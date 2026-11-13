<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\PaymentTransaction;
use App\Models\Setting;
use App\Services\Payments\GcashGateway;
use App\Services\Payments\CardGateway;
use App\Services\Payments\PaymentManager;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    public function __construct(
        protected PaymentManager $paymentManager
    ) {}

    /**
     * Initiate online payment checkout for a booking (Client or Admin).
     */
    public function initiateCheckout(Request $request, Booking $booking)
    {
        $user = Auth::user();
        if ($user->role !== 'admin' && $booking->user_id !== $user->id) {
            abort(403, 'Unauthorized access to booking payment.');
        }

        if ($booking->payment_status === 'paid') {
            return back()->with('info', 'This booking has already been paid in full.');
        }

        $request->validate([
            'gateway' => 'required|string|in:gcash,gcash_paymongo,card,card_paymongo',
        ]);

        $gatewayName = $request->gateway;
        $gateway = $this->paymentManager->getGateway($gatewayName);

        if (!$gateway || !$gateway->isEnabled()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'The selected payment method is currently disabled. Please select another option or contact support.',
                ], 422);
            }
            return back()->withErrors(['gateway' => 'The selected payment method is currently disabled.']);
        }

        if (!$gateway->isConfigured()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'The payment gateway is not yet configured. Please contact the administrator.',
                ], 422);
            }
            return back()->withErrors(['gateway' => 'Payment gateway credentials are not configured.']);
        }

        try {
            $session = $gateway->createCheckoutSession($booking);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'checkout_url' => $session['checkout_url'],
                    'session_id' => $session['session_id'],
                    'transaction_id' => $session['transaction_id'],
                ]);
            }

            return redirect()->away($session['checkout_url']);
        } catch (\Throwable $e) {
            Log::error("Failed to initiate {$gatewayName} checkout for booking #{$booking->id}: " . $e->getMessage());

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment initiation failed: ' . $e->getMessage(),
                ], 500);
            }

            return back()->withErrors(['payment' => 'Could not start payment session: ' . $e->getMessage()]);
        }
    }

    /**
     * Customer return handler after successful payment redirect.
     */
    public function paymentSuccess(Request $request)
    {
        $bookingId = $request->query('booking_id');
        $gateway = $request->query('gateway', 'online');
        $sessionId = $request->query('session_id');
        $transactionId = $request->query('transaction_id');

        $booking = $bookingId ? Booking::with('vehicle')->find($bookingId) : null;

        // Immediate verification for PayMongo Checkout Session (GCash or Card)
        if ($booking && in_array($gateway, ['gcash', 'gcash_paymongo', 'card', 'card_paymongo']) && $transactionId) {
            $tx = PaymentTransaction::find($transactionId);
            if ($tx && $tx->gateway_transaction_id && $booking->payment_status !== 'paid') {
                try {
                    $activeGateway = $this->paymentManager->getGateway($gateway);
                    $mode = $activeGateway ? $activeGateway->getMode() : 'test';
                    $sk = Setting::where('key', "payment_paymongo_{$mode}_sk")->value('value')
                        ?: (Setting::where('key', "payment_{$gateway}_{$mode}_sk")->value('value')
                        ?: (Setting::where('key', "payment_gcash_{$mode}_sk")->value('value')
                        ?: config("services.paymongo.{$mode}_sk")));

                    if ($sk) {
                        $res = Http::withBasicAuth($sk, '')
                            ->timeout(10)
                            ->get("https://api.paymongo.com/v1/checkout_sessions/{$tx->gateway_transaction_id}");

                        if ($res->successful()) {
                            $sessionData = $res->json('data.attributes');
                            $payments = $sessionData['payments'] ?? [];
                            $hasPaid = false;
                            $amountPaid = 0;
                            foreach ($payments as $p) {
                                if (($p['attributes']['status'] ?? '') === 'paid') {
                                    $hasPaid = true;
                                    $amountPaid += ($p['attributes']['amount'] ?? 0) / 100.0;
                                }
                            }

                            if ($hasPaid) {
                                $gatewayId = $tx->gateway ?: (in_array($gateway, ['card', 'card_paymongo']) ? 'card_paymongo' : 'gcash_paymongo');
                                $this->paymentManager->processSuccessfulPayment(
                                    $booking,
                                    $gatewayId,
                                    $tx->gateway_transaction_id,
                                    $amountPaid > 0 ? $amountPaid : (float) $booking->total_price,
                                    $res->json(),
                                    $sessionData['billing']['email'] ?? null,
                                    $sessionData['billing']['name'] ?? null,
                                    $tx->id
                                );
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    Log::warning("Immediate PayMongo check on return failed: " . $e->getMessage());
                }
            }
        }

        $targetRoute = (Auth::check() && in_array(Auth::user()->role, ['admin', 'staff']))
            ? route('admin.dashboard')
            : route('client.dashboard');

        return redirect($targetRoute)->with('success', 'Payment processed successfully! Your booking reservation is confirmed.');
    }

    /**
     * Customer cancel handler if they abort the payment page.
     */
    public function paymentCancel(Request $request)
    {
        $transactionId = $request->query('transaction_id');
        if ($transactionId) {
            PaymentTransaction::where('id', $transactionId)
                ->where('status', 'pending')
                ->update(['status' => 'cancelled', 'notes' => 'Cancelled by user at checkout screen.']);
        }

        $targetRoute = (Auth::check() && in_array(Auth::user()->role, ['admin', 'staff']))
            ? route('admin.dashboard')
            : route('client.dashboard');

        return redirect($targetRoute)->with('info', 'Payment checkout was cancelled. You can retry anytime from your bookings log.');
    }

    /**
     * PayMongo Webhook Endpoint for both GCash and Card payments (CSRF exempt).
     */
    public function paymongoWebhook(Request $request)
    {
        $gateway = $this->paymentManager->getGateway('gcash_paymongo') 
            ?: $this->paymentManager->getGateway('card_paymongo');

        if (!$gateway) {
            return response()->json(['error' => 'No PayMongo gateway registered'], 500);
        }

        $result = $gateway->handleWebhook($request);

        if (!$result['success']) {
            Log::warning('PayMongo webhook processing rejected: ' . ($result['message'] ?? 'Unknown error'));
            return response()->json(['received' => false, 'error' => $result['message'] ?? 'Invalid payload'], 400);
        }

        $bookingId = $result['booking_id'] ?? null;
        if ($bookingId) {
            $booking = Booking::find($bookingId);
            if ($booking) {
                $tx = !empty($result['payment_transaction_id']) ? PaymentTransaction::find($result['payment_transaction_id']) : null;
                $paymentType = $result['raw']['data']['attributes']['data']['attributes']['metadata']['payment_type'] ?? '';
                $gatewayIdentifier = $tx?->gateway 
                    ?: ($paymentType === 'card' ? 'card_paymongo' : 'gcash_paymongo');

                $this->paymentManager->processSuccessfulPayment(
                    $booking,
                    $gatewayIdentifier,
                    $result['gateway_transaction_id'] ?? 'paymongo_evt_' . time(),
                    (float) ($result['amount'] ?? $booking->total_price),
                    $result['raw'] ?? [],
                    $result['payer_email'] ?? null,
                    $result['payer_name'] ?? null,
                    $result['payment_transaction_id'] ?? null
                );
            }
        }

        return response()->json(['received' => true]);
    }

    /**
     * Test API connection from Payment Settings (Admin only).
     */
    public function testConnection(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized.');
        }

        $request->validate([
            'gateway' => 'required|string|in:gcash,gcash_paymongo,card,card_paymongo,paymongo',
        ]);

        $gatewayKey = $request->gateway === 'paymongo' ? 'gcash_paymongo' : $request->gateway;
        $gateway = $this->paymentManager->getGateway($gatewayKey);
        if (!$gateway) {
            $gateway = $this->paymentManager->getGateway('card_paymongo');
        }

        if (!$gateway) {
            return response()->json([
                'success' => false,
                'message' => 'Unknown payment gateway.',
            ], 404);
        }

        $result = $gateway->verifyConnection();
        return response()->json($result);
    }

    /**
     * Update Payment Settings directly from admin dashboard (Admin only).
     */
    public function updatePaymentSettings(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action. Only administrators can update payment settings.');
        }

        $request->validate([
            'payment_paymongo_mode' => 'nullable|in:test,live',
            'payment_paymongo_test_pk' => 'nullable|string|max:500',
            'payment_paymongo_test_sk' => 'nullable|string|max:500',
            'payment_paymongo_test_webhook_secret' => 'nullable|string|max:500',
            'payment_paymongo_live_pk' => 'nullable|string|max:500',
            'payment_paymongo_live_sk' => 'nullable|string|max:500',
            'payment_paymongo_live_webhook_secret' => 'nullable|string|max:500',

            'payment_gcash_enabled' => 'nullable|in:0,1',
            'payment_gcash_mode' => 'nullable|in:test,live',
            'payment_gcash_test_pk' => 'nullable|string|max:500',
            'payment_gcash_test_sk' => 'nullable|string|max:500',
            'payment_gcash_test_webhook_secret' => 'nullable|string|max:500',
            'payment_gcash_live_pk' => 'nullable|string|max:500',
            'payment_gcash_live_sk' => 'nullable|string|max:500',
            'payment_gcash_live_webhook_secret' => 'nullable|string|max:500',

            'payment_card_enabled' => 'nullable|in:0,1',
            'payment_card_mode' => 'nullable|in:test,live',
            'payment_card_test_pk' => 'nullable|string|max:500',
            'payment_card_test_sk' => 'nullable|string|max:500',
            'payment_card_test_webhook_secret' => 'nullable|string|max:500',
            'payment_card_live_pk' => 'nullable|string|max:500',
            'payment_card_live_sk' => 'nullable|string|max:500',
            'payment_card_live_webhook_secret' => 'nullable|string|max:500',

            'payment_auto_confirm' => 'nullable|in:0,1',
            'payment_currency' => 'nullable|string|max:10',
        ]);

        $keys = [
            'payment_paymongo_mode',
            'payment_paymongo_test_pk',
            'payment_paymongo_test_sk',
            'payment_paymongo_test_webhook_secret',
            'payment_paymongo_live_pk',
            'payment_paymongo_live_sk',
            'payment_paymongo_live_webhook_secret',

            'payment_gcash_enabled',
            'payment_gcash_mode',
            'payment_gcash_test_pk',
            'payment_gcash_test_sk',
            'payment_gcash_test_webhook_secret',
            'payment_gcash_live_pk',
            'payment_gcash_live_sk',
            'payment_gcash_live_webhook_secret',

            'payment_card_enabled',
            'payment_card_mode',
            'payment_card_test_pk',
            'payment_card_test_sk',
            'payment_card_test_webhook_secret',
            'payment_card_live_pk',
            'payment_card_live_sk',
            'payment_card_live_webhook_secret',

            'payment_auto_confirm',
            'payment_currency',
        ];

        foreach ($keys as $key) {
            if ($request->has($key)) {
                $val = (string) $request->input($key, '');
                Setting::updateOrCreate(['key' => $key], ['value' => $val]);
            }
        }

        // If payment_paymongo_mode was updated, sync payment_gcash_mode and payment_card_mode
        if ($request->has('payment_paymongo_mode')) {
            $mode = $request->input('payment_paymongo_mode');
            Setting::updateOrCreate(['key' => 'payment_gcash_mode'], ['value' => $mode]);
            Setting::updateOrCreate(['key' => 'payment_card_mode'], ['value' => $mode]);
        }

        return redirect()->back()->with('success', 'Payment Settings updated successfully! PayMongo API keys and payment method configurations have been saved.');
    }

    /**
     * Get transaction history for a booking (Admin / Authenticated client).
     */
    public function getBookingTransactions(Booking $booking)
    {
        $user = Auth::user();
        if ($user->role !== 'admin' && $booking->user_id !== $user->id) {
            abort(403);
        }

        $transactions = $booking->paymentTransactions()->orderBy('created_at', 'desc')->get();
        $ledgerPayments = $booking->payments()->with('collector')->orderBy('created_at', 'desc')->get();

        return response()->json([
            'transactions' => $transactions,
            'payments' => $ledgerPayments,
            'booking' => [
                'id' => $booking->id,
                'total_price' => $booking->total_price,
                'amount_paid' => $booking->amount_paid,
                'payment_status' => $booking->payment_status,
                'status' => $booking->status,
            ],
        ]);
    }
}
