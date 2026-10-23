<?php

namespace App\Services\Payments;

use App\Models\Booking;
use App\Models\PaymentTransaction;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;
use Stripe\Webhook;

class StripeGateway implements PaymentGatewayInterface
{
    public function getIdentifier(): string
    {
        return 'stripe';
    }

    public function getDisplayName(): string
    {
        return 'Credit / Debit Card (Stripe)';
    }

    public function isEnabled(): bool
    {
        return (bool) Setting::where('key', 'payment_stripe_enabled')->value('value') ?: false;
    }

    public function getMode(): string
    {
        return Setting::where('key', 'payment_stripe_mode')->value('value') ?: 'test';
    }

    protected function getSecretKey(): ?string
    {
        $mode = $this->getMode();
        $keyName = $mode === 'live' ? 'payment_stripe_live_sk' : 'payment_stripe_test_sk';
        return Setting::where('key', $keyName)->value('value') ?: config("services.stripe.{$mode}_sk");
    }

    public function getPublicKey(): ?string
    {
        $mode = $this->getMode();
        $keyName = $mode === 'live' ? 'payment_stripe_live_pk' : 'payment_stripe_test_pk';
        return Setting::where('key', $keyName)->value('value') ?: config("services.stripe.{$mode}_pk");
    }

    protected function getWebhookSecret(): ?string
    {
        $mode = $this->getMode();
        $keyName = $mode === 'live' ? 'payment_stripe_live_webhook_secret' : 'payment_stripe_test_webhook_secret';
        return Setting::where('key', $keyName)->value('value') ?: config("services.stripe.{$mode}_webhook_secret");
    }

    public function isConfigured(): bool
    {
        return !empty($this->getSecretKey()) && !empty($this->getPublicKey());
    }

    public function verifyConnection(): array
    {
        $sk = $this->getSecretKey();
        if (empty($sk)) {
            return [
                'success' => false,
                'message' => 'Stripe Secret Key is not configured for ' . $this->getMode() . ' mode.',
            ];
        }

        try {
            $stripe = new StripeClient($sk);
            $account = $stripe->accounts->retrieve(null, []);
            
            return [
                'success' => true,
                'message' => "Stripe connected successfully (" . strtoupper($this->getMode()) . " mode). Account: " . ($account->business_profile->name ?? $account->id ?? 'Active'),
                'account_id' => $account->id,
            ];
        } catch (\Throwable $e) {
            // Also try balance endpoint if standard account retrieve has restricted permissions
            try {
                $stripe = new StripeClient($sk);
                $balance = $stripe->balance->retrieve([]);
                return [
                    'success' => true,
                    'message' => "Stripe API authenticated successfully (" . strtoupper($this->getMode()) . " mode).",
                ];
            } catch (\Throwable $ex) {
                return [
                    'success' => false,
                    'message' => 'Stripe API Connection Error: ' . $ex->getMessage(),
                ];
            }
        }
    }

    public function createCheckoutSession(Booking $booking, array $options = []): array
    {
        $sk = $this->getSecretKey();
        if (empty($sk)) {
            throw new \RuntimeException('Stripe Secret Key is not configured.');
        }

        $stripe = new StripeClient($sk);

        $amount = (float) ($options['amount'] ?? $booking->total_price);
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Payment amount must be greater than zero.');
        }

        $amountInCentavos = (int) round($amount * 100);
        $user = $booking->user;
        $vehicle = $booking->vehicle;

        $description = sprintf(
            'ELFAA Rental: %s (%s to %s)',
            $vehicle ? $vehicle->name : 'Fleet Vehicle',
            $booking->start_datetime ? $booking->start_datetime->format('M d') : 'N/A',
            $booking->end_datetime ? $booking->end_datetime->format('M d') : 'N/A'
        );

        $lineItems = [
            [
                'price_data' => [
                    'currency' => 'php',
                    'unit_amount' => $amountInCentavos,
                    'product_data' => [
                        'name' => 'ELFAA Car Rental - Booking #' . $booking->id,
                        'description' => $description,
                        'images' => ($vehicle && !empty($vehicle->images) && is_array($vehicle->images)) 
                            ? [url($vehicle->images[0])] 
                            : [],
                    ],
                ],
                'quantity' => 1,
            ],
        ];

        // Create pending transaction record first
        $transaction = PaymentTransaction::create([
            'booking_id' => $booking->id,
            'user_id' => $user ? $user->id : null,
            'gateway' => $this->getIdentifier(),
            'payment_method_type' => 'card',
            'amount' => $amount,
            'currency' => 'PHP',
            'status' => 'pending',
            'mode' => $this->getMode(),
            'payer_email' => $user ? $user->email : null,
            'payer_name' => $user ? $user->name : null,
            'notes' => 'Stripe Checkout initiated.',
        ]);

        $successUrl = route('payment.success', [
            'gateway' => 'stripe',
            'booking_id' => $booking->id,
            'transaction_id' => $transaction->id,
        ]) . '&session_id={CHECKOUT_SESSION_ID}';

        $cancelUrl = route('payment.cancel', [
            'booking_id' => $booking->id,
            'transaction_id' => $transaction->id,
        ]);

        $sessionParams = [
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'mode' => 'payment',
            'customer_email' => $user ? $user->email : null,
            'client_reference_id' => (string) $booking->id,
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'metadata' => [
                'booking_id' => (string) $booking->id,
                'transaction_id' => (string) $transaction->id,
                'user_id' => (string) ($user ? $user->id : ''),
                'app' => 'ELFAA_CAR_RENTAL',
            ],
        ];

        $session = $stripe->checkout->sessions->create($sessionParams);

        $transaction->update([
            'gateway_transaction_id' => $session->id,
            'checkout_url' => $session->url,
            'raw_response' => [
                'session_id' => $session->id,
                'payment_intent' => $session->payment_intent,
            ],
        ]);

        return [
            'checkout_url' => $session->url,
            'session_id' => $session->id,
            'transaction_id' => $transaction->id,
        ];
    }

    public function handleWebhook(Request $request): array
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('stripe-signature');
        $webhookSecret = $this->getWebhookSecret();

        if (empty($sigHeader)) {
            Log::warning('Stripe webhook missing stripe-signature header');
            return ['success' => false, 'message' => 'Missing signature header'];
        }

        try {
            if (!empty($webhookSecret)) {
                $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
            } else {
                // In development / testing without secret, decode payload with caution
                $event = json_decode($payload, false);
                Log::notice('Stripe webhook processed without webhook secret verification (test mode)');
            }
        } catch (\Throwable $e) {
            Log::error('Stripe webhook signature verification failed: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Signature verification failed: ' . $e->getMessage()];
        }

        $eventType = is_object($event) ? ($event->type ?? null) : null;
        Log::info("Stripe Webhook received: {$eventType}");

        if ($eventType === 'checkout.session.completed' || $eventType === 'payment_intent.succeeded') {
            $dataObject = $event->data->object;

            $bookingId = $dataObject->metadata->booking_id ?? $dataObject->client_reference_id ?? null;
            $transactionId = $dataObject->metadata->transaction_id ?? null;
            $amountInCentavos = $dataObject->amount_total ?? $dataObject->amount ?? 0;
            $amount = $amountInCentavos > 0 ? ($amountInCentavos / 100.0) : 0;
            $currency = strtoupper($dataObject->currency ?? 'PHP');
            $gatewayTxId = $dataObject->id ?? null;

            $payerEmail = $dataObject->customer_details->email ?? $dataObject->customer_email ?? null;
            $payerName = $dataObject->customer_details->name ?? null;

            return [
                'success' => true,
                'event' => $eventType,
                'booking_id' => $bookingId ? (int) $bookingId : null,
                'payment_transaction_id' => $transactionId ? (int) $transactionId : null,
                'gateway_transaction_id' => $gatewayTxId,
                'amount' => $amount,
                'currency' => $currency,
                'payer_email' => $payerEmail,
                'payer_name' => $payerName,
                'raw' => (array) $dataObject,
            ];
        }

        return [
            'success' => false,
            'message' => "Unhandled event type: {$eventType}",
        ];
    }
}
