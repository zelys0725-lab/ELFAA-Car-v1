<?php

namespace App\Services\Payments;

use App\Models\Booking;
use App\Models\PaymentTransaction;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class CardGateway implements PaymentGatewayInterface
{
    protected string $apiBase = 'https://api.paymongo.com/v1';

    public function getIdentifier(): string
    {
        return 'card_paymongo';
    }

    public function getDisplayName(): string
    {
        return 'Credit / Debit Card';
    }

    public function isEnabled(): bool
    {
        return (bool) (Setting::where('key', 'payment_card_enabled')->value('value') ?: false);
    }

    public function getMode(): string
    {
        return Setting::where('key', 'payment_paymongo_mode')->value('value')
            ?: (Setting::where('key', 'payment_card_mode')->value('value')
            ?: (Setting::where('key', 'payment_gcash_mode')->value('value') ?: 'test'));
    }

    protected function getSecretKey(): ?string
    {
        $mode = $this->getMode();
        return Setting::where('key', "payment_paymongo_{$mode}_sk")->value('value')
            ?: (Setting::where('key', "payment_card_{$mode}_sk")->value('value')
            ?: (Setting::where('key', "payment_gcash_{$mode}_sk")->value('value')
            ?: config("services.paymongo.{$mode}_sk")));
    }

    public function getPublicKey(): ?string
    {
        $mode = $this->getMode();
        return Setting::where('key', "payment_paymongo_{$mode}_pk")->value('value')
            ?: (Setting::where('key', "payment_card_{$mode}_pk")->value('value')
            ?: (Setting::where('key', "payment_gcash_{$mode}_pk")->value('value')
            ?: config("services.paymongo.{$mode}_pk")));
    }

    protected function getWebhookSecret(): ?string
    {
        $mode = $this->getMode();
        return Setting::where('key', "payment_paymongo_{$mode}_webhook_secret")->value('value')
            ?: (Setting::where('key', "payment_card_{$mode}_webhook_secret")->value('value')
            ?: (Setting::where('key', "payment_gcash_{$mode}_webhook_secret")->value('value')
            ?: config("services.paymongo.{$mode}_webhook_secret")));
    }

    public function isConfigured(): bool
    {
        return !empty($this->getSecretKey());
    }

    public function verifyConnection(): array
    {
        $sk = $this->getSecretKey();
        if (empty($sk)) {
            return [
                'success' => false,
                'message' => 'PayMongo Secret Key is not configured for ' . $this->getMode() . ' mode.',
            ];
        }

        try {
            $response = Http::withBasicAuth($sk, '')
                ->timeout(10)
                ->get("{$this->apiBase}/links", ['limit' => 1]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => 'PayMongo Card Gateway connected successfully (' . strtoupper($this->getMode()) . ' mode).',
                ];
            }

            $resIntents = Http::withBasicAuth($sk, '')
                ->timeout(10)
                ->get("{$this->apiBase}/payment_intents", ['limit' => 1]);

            if ($resIntents->successful()) {
                return [
                    'success' => true,
                    'message' => 'PayMongo API authenticated successfully for Card payments (' . strtoupper($this->getMode()) . ' mode).',
                ];
            }

            $errorMsg = $response->json('errors.0.detail') ?? $response->body() ?: 'Unauthorized';
            return [
                'success' => false,
                'message' => 'PayMongo API Error: ' . $errorMsg,
            ];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'message' => 'PayMongo Connection Error: ' . $e->getMessage(),
            ];
        }
    }

    public function createCheckoutSession(Booking $booking, array $options = []): array
    {
        $sk = $this->getSecretKey();
        if (empty($sk)) {
            throw new \RuntimeException('PayMongo Secret Key is not configured.');
        }

        $amount = (float) ($options['amount'] ?? $booking->total_price);
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Payment amount must be greater than zero.');
        }

        $amountInCentavos = (int) round($amount * 100);
        $user = $booking->user;
        $vehicle = $booking->vehicle;

        $description = sprintf(
            'ELFAA Rental Booking #%d - %s',
            $booking->id,
            $vehicle ? $vehicle->name : 'Fleet Vehicle'
        );

        // Create pending transaction record
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
            'notes' => 'PayMongo Card Checkout initiated.',
        ]);

        $successUrl = route('payment.success', [
            'gateway' => 'card',
            'booking_id' => $booking->id,
            'transaction_id' => $transaction->id,
        ]);

        $cancelUrl = route('payment.cancel', [
            'booking_id' => $booking->id,
            'transaction_id' => $transaction->id,
        ]);

        // PayMongo Checkout Session (v1) with Credit/Debit Card payment method
        $checkoutPayload = [
            'data' => [
                'attributes' => [
                    'send_email_receipt' => true,
                    'show_description' => true,
                    'show_line_items' => true,
                    'description' => $description,
                    'payment_method_types' => ['card'],
                    'line_items' => [
                        [
                            'currency' => 'PHP',
                            'amount' => $amountInCentavos,
                            'name' => 'ELFAA Car Rental - Booking #' . $booking->id,
                            'quantity' => 1,
                            'description' => $vehicle ? "{$vehicle->name} ({$vehicle->transmission})" : 'Vehicle Rental',
                            'images' => ($vehicle && !empty($vehicle->images) && is_array($vehicle->images)) 
                                ? [url($vehicle->images[0])] 
                                : [],
                        ],
                    ],
                    'success_url' => $successUrl,
                    'cancel_url' => $cancelUrl,
                    'metadata' => [
                        'booking_id' => (string) $booking->id,
                        'transaction_id' => (string) $transaction->id,
                        'user_id' => (string) ($user ? $user->id : ''),
                        'payment_type' => 'card',
                        'app' => 'ELFAA_CAR_RENTAL',
                    ],
                ],
            ],
        ];

        $res = Http::withBasicAuth($sk, '')
            ->timeout(20)
            ->post("{$this->apiBase}/checkout_sessions", $checkoutPayload);

        if ($res->successful()) {
            $data = $res->json('data');
            $checkoutUrl = $data['attributes']['checkout_url'] ?? null;
            $sessionId = $data['id'] ?? null;

            $transaction->update([
                'gateway_transaction_id' => $sessionId,
                'checkout_url' => $checkoutUrl,
                'raw_response' => $data,
            ]);

            return [
                'checkout_url' => $checkoutUrl,
                'session_id' => $sessionId,
                'transaction_id' => $transaction->id,
            ];
        }

        // Secondary fallback: PayMongo Links API
        Log::warning('PayMongo checkout_sessions for Card failed, trying payment links fallback: ' . $res->body());

        $linkPayload = [
            'data' => [
                'attributes' => [
                    'amount' => $amountInCentavos,
                    'description' => $description,
                    'remarks' => "ELFAA-BOOKING-{$booking->id}-TX-{$transaction->id}",
                ],
            ],
        ];

        $linkRes = Http::withBasicAuth($sk, '')
            ->timeout(20)
            ->post("{$this->apiBase}/links", $linkPayload);

        if ($linkRes->successful()) {
            $linkData = $linkRes->json('data');
            $checkoutUrl = $linkData['attributes']['checkout_url'] ?? null;
            $linkId = $linkData['id'] ?? null;

            $transaction->update([
                'gateway_transaction_id' => $linkId,
                'checkout_url' => $checkoutUrl,
                'raw_response' => $linkData,
            ]);

            return [
                'checkout_url' => $checkoutUrl,
                'session_id' => $linkId,
                'transaction_id' => $transaction->id,
            ];
        }

        $errorMsg = $res->json('errors.0.detail') ?? $linkRes->json('errors.0.detail') ?? 'Failed to initiate Card payment session.';
        $transaction->update([
            'status' => 'failed',
            'notes' => 'API Error: ' . $errorMsg,
        ]);

        throw new \RuntimeException('PayMongo Card Error: ' . $errorMsg);
    }

    public function handleWebhook(Request $request): array
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('paymongo-signature');
        $webhookSecret = $this->getWebhookSecret();

        if (!empty($webhookSecret) && !empty($sigHeader)) {
            $parts = explode(',', $sigHeader);
            $sigMap = [];
            foreach ($parts as $part) {
                $pair = explode('=', trim($part), 2);
                if (count($pair) === 2) {
                    $sigMap[$pair[0]] = $pair[1];
                }
            }

            $timestamp = $sigMap['t'] ?? null;
            $signature = $this->getMode() === 'live' ? ($sigMap['li'] ?? null) : ($sigMap['te'] ?? null);

            if ($timestamp && $signature) {
                $expectedSignature = hash_hmac('sha256', "{$timestamp}.{$payload}", $webhookSecret);
                if (!hash_equals($expectedSignature, $signature)) {
                    Log::error('PayMongo webhook signature verification mismatch');
                    return ['success' => false, 'message' => 'PayMongo signature mismatch'];
                }
            }
        }

        $data = json_decode($payload, true);
        $eventType = $data['data']['attributes']['type'] ?? null;
        Log::info("PayMongo Card Webhook event: {$eventType}");

        if (in_array($eventType, ['checkout_session.payment.paid', 'link.payment.paid', 'payment.paid'])) {
            $eventData = $data['data']['attributes']['data'] ?? [];
            $attributes = $eventData['attributes'] ?? [];

            $metadata = $attributes['metadata'] ?? [];
            $bookingId = $metadata['booking_id'] ?? null;
            $transactionId = $metadata['transaction_id'] ?? null;

            if (!$bookingId && !empty($attributes['remarks'])) {
                if (preg_match('/ELFAA-BOOKING-(\d+)/', $attributes['remarks'], $matches)) {
                    $bookingId = $matches[1];
                }
            }

            $amountInCentavos = $attributes['amount'] ?? 0;
            $amount = $amountInCentavos > 0 ? ($amountInCentavos / 100.0) : 0;
            $currency = strtoupper($attributes['currency'] ?? 'PHP');
            $gatewayTxId = $eventData['id'] ?? null;

            $payerEmail = $attributes['billing']['email'] ?? null;
            $payerName = $attributes['billing']['name'] ?? null;

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
                'raw' => $data,
            ];
        }

        return [
            'success' => false,
            'message' => "Unhandled PayMongo event: {$eventType}",
        ];
    }
}
