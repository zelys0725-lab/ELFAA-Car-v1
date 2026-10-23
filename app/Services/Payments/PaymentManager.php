<?php

namespace App\Services\Payments;

use App\Models\Booking;
use App\Models\BookingPayment;
use App\Models\PaymentTransaction;
use App\Models\Setting;
use App\Services\NotificationConfigService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentManager
{
    /**
     * Registered payment gateways.
     *
     * @var array<string, PaymentGatewayInterface>
     */
    protected array $gateways = [];

    public function __construct()
    {
        $this->register(new StripeGateway());
        $this->register(new GcashGateway());
    }

    /**
     * Register a payment gateway.
     */
    public function register(PaymentGatewayInterface $gateway): self
    {
        $this->gateways[$gateway->getIdentifier()] = $gateway;
        return $this;
    }

    /**
     * Get a gateway by identifier (supports aliases like 'gcash' => 'gcash_paymongo').
     */
    public function getGateway(string $identifier): ?PaymentGatewayInterface
    {
        if (isset($this->gateways[$identifier])) {
            return $this->gateways[$identifier];
        }

        if ($identifier === 'gcash') {
            return $this->gateways['gcash_paymongo'] ?? null;
        }

        return null;
    }

    /**
     * Get all registered gateways.
     *
     * @return array<string, PaymentGatewayInterface>
     */
    public function all(): array
    {
        return $this->gateways;
    }

    /**
     * Get public gateway info for client-side selection.
     */
    public function getAvailableGateways(): array
    {
        $available = [];

        foreach ($this->gateways as $gateway) {
            if ($gateway->isEnabled()) {
                $available[] = [
                    'id' => $gateway->getIdentifier(),
                    'alias' => $gateway->getIdentifier() === 'gcash_paymongo' ? 'gcash' : $gateway->getIdentifier(),
                    'name' => $gateway->getDisplayName(),
                    'mode' => $gateway->getMode(),
                    'configured' => $gateway->isConfigured(),
                    'public_key' => $gateway->getPublicKey(),
                ];
            }
        }

        return $available;
    }

    /**
     * Process and finalize a verified successful payment.
     */
    public function processSuccessfulPayment(
        Booking $booking,
        string $gatewayIdentifier,
        string $gatewayTransactionId,
        float $amount,
        array $rawPayload = [],
        ?string $payerEmail = null,
        ?string $payerName = null,
        ?int $paymentTransactionId = null
    ): PaymentTransaction {
        return DB::transaction(function () use (
            $booking,
            $gatewayIdentifier,
            $gatewayTransactionId,
            $amount,
            $rawPayload,
            $payerEmail,
            $payerName,
            $paymentTransactionId
        ) {
            // 1. Locate or create PaymentTransaction
            $transaction = null;
            if ($paymentTransactionId) {
                $transaction = PaymentTransaction::find($paymentTransactionId);
            }

            if (!$transaction && $gatewayTransactionId) {
                $transaction = PaymentTransaction::where('gateway_transaction_id', $gatewayTransactionId)->first();
            }

            if (!$transaction) {
                $transaction = PaymentTransaction::where('booking_id', $booking->id)
                    ->where('status', 'pending')
                    ->latest()
                    ->first();
            }

            if (!$transaction) {
                $transaction = new PaymentTransaction([
                    'booking_id' => $booking->id,
                    'user_id' => $booking->user_id,
                    'gateway' => $gatewayIdentifier,
                    'amount' => $amount,
                    'currency' => 'PHP',
                    'mode' => Setting::where('key', "payment_{$gatewayIdentifier}_mode")->value('value') ?: 'test',
                ]);
            }

            $transaction->fill([
                'gateway_transaction_id' => $gatewayTransactionId,
                'status' => 'paid',
                'amount' => $amount,
                'paid_at' => now(),
                'payer_email' => $payerEmail ?: $transaction->payer_email,
                'payer_name' => $payerName ?: $transaction->payer_name,
                'raw_response' => $rawPayload,
                'notes' => "Payment verified via {$gatewayIdentifier} webhook/callback.",
            ]);
            $transaction->save();

            // 2. Log in standard BookingPayment table (used by existing reporting & ledger)
            $methodLabel = match ($gatewayIdentifier) {
                'stripe' => 'credit_card',
                'gcash', 'gcash_paymongo' => 'gcash',
                default => 'online',
            };

            // Avoid double-logging in booking_payments
            $existingPayment = BookingPayment::where('booking_id', $booking->id)
                ->where('reference_number', $gatewayTransactionId)
                ->first();

            if (!$existingPayment) {
                BookingPayment::create([
                    'booking_id' => $booking->id,
                    'collector_id' => null, // Online self-service payment
                    'amount_collected' => $amount,
                    'payment_method' => $methodLabel,
                    'payment_type' => $amount >= $booking->total_price ? 'final_settlement' : 'downpayment',
                    'reference_number' => $gatewayTransactionId,
                    'notes' => "Automated online payment via {$transaction->gateway} (Mode: {$transaction->mode})",
                ]);
            }

            // 3. Update Booking financial status & auto-confirm
            $totalCollected = $booking->payments()->sum('amount_collected');
            $paymentStatus = 'unpaid';
            if ($totalCollected >= $booking->total_price) {
                $paymentStatus = 'paid';
            } elseif ($totalCollected > 0) {
                $paymentStatus = 'partial';
            }

            $autoConfirm = Setting::where('key', 'payment_auto_confirm')->value('value') ?? '1';
            $newBookingStatus = $booking->status;
            if ($autoConfirm === '1' && $booking->status === 'pending') {
                $newBookingStatus = 'confirmed';
            }

            $booking->update([
                'amount_paid' => $totalCollected,
                'payment_status' => $paymentStatus,
                'payment_gateway' => $gatewayIdentifier,
                'payment_reference' => $gatewayTransactionId,
                'status' => $newBookingStatus,
            ]);

            Log::info("Payment of PHP {$amount} confirmed for Booking #{$booking->id} via {$gatewayIdentifier}");

            // 4. Send booking notifications & SMS
            try {
                NotificationConfigService::sendBookingNotification($booking, 'booking_confirmed');

                if ($booking->user && $booking->user->phone) {
                    NotificationConfigService::sendSms(
                        $booking->user->phone,
                        "ELFAA CAR RENTAL: We have received your payment of PHP " . number_format($amount, 2) . " for Booking #{$booking->id}. Your reservation is now CONFIRMED! Thank you."
                    );
                }
            } catch (\Throwable $e) {
                Log::warning("Could not dispatch post-payment notification: " . $e->getMessage());
            }

            return $transaction;
        });
    }
}
