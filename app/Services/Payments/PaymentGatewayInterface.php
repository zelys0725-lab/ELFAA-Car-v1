<?php

namespace App\Services\Payments;

use App\Models\Booking;
use Illuminate\Http\Request;

interface PaymentGatewayInterface
{
    /**
     * Unique gateway identifier (e.g., 'stripe', 'gcash_paymongo').
     */
    public function getIdentifier(): string;

    /**
     * Human-readable provider name (e.g., 'Credit/Debit Card (Stripe)', 'GCash (PayMongo)').
     */
    public function getDisplayName(): string;

    /**
     * Whether this payment gateway is currently enabled in settings.
     */
    public function isEnabled(): bool;

    /**
     * Current mode ('test' or 'live').
     */
    public function getMode(): string;

    /**
     * Check if required API credentials are fully configured for the current mode.
     */
    public function isConfigured(): bool;

    /**
     * Get the public / publishable key for client-side integrations (never returns secret keys).
     */
    public function getPublicKey(): ?string;

    /**
     * Initiate a secure hosted checkout session for a customer booking.
     * 
     * @return array ['checkout_url' => string, 'session_id' => string, 'transaction_id' => int]
     */
    public function createCheckoutSession(Booking $booking, array $options = []): array;

    /**
     * Validate and process an incoming webhook payload from the payment provider.
     *
     * @return array Standardized result with keys: success, booking_id, transaction_id, amount, currency, payer_email, payer_name, raw
     */
    public function handleWebhook(Request $request): array;

    /**
     * Test connection to payment provider API using current configured keys.
     *
     * @return array ['success' => bool, 'message' => string]
     */
    public function verifyConnection(): array;
}
