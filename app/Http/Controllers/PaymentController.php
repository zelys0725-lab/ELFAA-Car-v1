<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\PaymentTransaction;
use App\Models\Setting;
use App\Services\Payments\GcashGateway;
use App\Services\Payments\PaymentManager;
use App\Services\Payments\StripeGateway;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;

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
            'gateway' => 'required|string|in:stripe,gcash,gcash_paymongo',
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

        // Immediate verification for Stripe Checkout Session
        if ($booking && $gateway === 'stripe' && $sessionId) {
            try {
                $stripeGateway = $this->paymentManager->getGateway('stripe');
                $mode = $stripeGateway ? $stripeGateway->getMode() : 'test';
                $keyName = $mode === 'live' ? 'payment_stripe_live_sk' : 'payment_stripe_test_sk';
                $sk = Setting::where('key', $keyName)->value('value') ?: config("services.stripe.{$mode}_sk");

                if ($sk) {
                    $stripe = new StripeClient($sk);
                    $session = $stripe->checkout->sessions->retrieve($sessionId, []);

                    if ($session && $session->payment_status === 'paid' && $booking->payment_status !== 'paid') {
                        $amount = ($session->amount_total ?? 0) / 100.0;
                        $this->paymentManager->processSuccessfulPayment(
                            $booking,
                            'stripe',
                            $session->id,
                            $amount > 0 ? $amount : (float) $booking->total_price,
                            (array) $session,
                            $session->customer_details->email ?? null,
                            $session->customer_details->name ?? null,
                            $transactionId ? (int) $transactionId : null
                        );
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Immediate Stripe session check on return failed: " . $e->getMessage());
            }
        }

        // Immediate verification for PayMongo Checkout Session
        if ($booking && ($gateway === 'gcash' || $gateway === 'gcash_paymongo') && $transactionId) {
            $tx = PaymentTransaction::find($transactionId);
            if ($tx && $tx->gateway_transaction_id && $booking->payment_status !== 'paid') {
                try {
                    $gcashGateway = $this->paymentManager->getGateway('gcash_paymongo');
                    $mode = $gcashGateway ? $gcashGateway->getMode() : 'test';
                    $keyName = $mode === 'live' ? 'payment_gcash_live_sk' : 'payment_gcash_test_sk';
                    $sk = Setting::where('key', $keyName)->value('value');

                    if ($sk) {
                        $res = \Illuminate\Support\Facades\Http::withBasicAuth($sk, '')
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
                                $this->paymentManager->processSuccessfulPayment(
                                    $booking,
                                    'gcash_paymongo',
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
     * Stripe Webhook Endpoint (CSRF exempt).
     */
    public function stripeWebhook(Request $request)
    {
        $gateway = $this->paymentManager->getGateway('stripe');
        if (!$gateway) {
            return response()->json(['error' => 'Gateway not registered'], 500);
        }

        $result = $gateway->handleWebhook($request);

        if (!$result['success']) {
            Log::warning('Stripe webhook processing rejected: ' . ($result['message'] ?? 'Unknown error'));
            return response()->json(['received' => false, 'error' => $result['message'] ?? 'Invalid payload'], 400);
        }

        $bookingId = $result['booking_id'] ?? null;
        if ($bookingId) {
            $booking = Booking::find($bookingId);
            if ($booking) {
                $this->paymentManager->processSuccessfulPayment(
                    $booking,
                    'stripe',
                    $result['gateway_transaction_id'] ?? 'stripe_evt_' . time(),
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
     * PayMongo / GCash Webhook Endpoint (CSRF exempt).
     */
    public function paymongoWebhook(Request $request)
    {
        $gateway = $this->paymentManager->getGateway('gcash_paymongo');
        if (!$gateway) {
            return response()->json(['error' => 'Gateway not registered'], 500);
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
                $this->paymentManager->processSuccessfulPayment(
                    $booking,
                    'gcash_paymongo',
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
            'gateway' => 'required|string|in:stripe,gcash,gcash_paymongo',
        ]);

        $gateway = $this->paymentManager->getGateway($request->gateway);
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
            'payment_stripe_enabled' => 'nullable|in:0,1',
            'payment_stripe_mode' => 'nullable|in:test,live',
            'payment_stripe_test_pk' => 'nullable|string|max:500',
            'payment_stripe_test_sk' => 'nullable|string|max:500',
            'payment_stripe_test_webhook_secret' => 'nullable|string|max:500',
            'payment_stripe_live_pk' => 'nullable|string|max:500',
            'payment_stripe_live_sk' => 'nullable|string|max:500',
            'payment_stripe_live_webhook_secret' => 'nullable|string|max:500',

            'payment_gcash_enabled' => 'nullable|in:0,1',
            'payment_gcash_mode' => 'nullable|in:test,live',
            'payment_gcash_test_pk' => 'nullable|string|max:500',
            'payment_gcash_test_sk' => 'nullable|string|max:500',
            'payment_gcash_test_webhook_secret' => 'nullable|string|max:500',
            'payment_gcash_live_pk' => 'nullable|string|max:500',
            'payment_gcash_live_sk' => 'nullable|string|max:500',
            'payment_gcash_live_webhook_secret' => 'nullable|string|max:500',

            'payment_auto_confirm' => 'nullable|in:0,1',
            'payment_currency' => 'nullable|string|max:10',
        ]);

        $keys = [
            'payment_stripe_enabled',
            'payment_stripe_mode',
            'payment_stripe_test_pk',
            'payment_stripe_test_sk',
            'payment_stripe_test_webhook_secret',
            'payment_stripe_live_pk',
            'payment_stripe_live_sk',
            'payment_stripe_live_webhook_secret',

            'payment_gcash_enabled',
            'payment_gcash_mode',
            'payment_gcash_test_pk',
            'payment_gcash_test_sk',
            'payment_gcash_test_webhook_secret',
            'payment_gcash_live_pk',
            'payment_gcash_live_sk',
            'payment_gcash_live_webhook_secret',

            'payment_auto_confirm',
            'payment_currency',
        ];

        foreach ($keys as $key) {
            if ($request->has($key)) {
                $val = (string) $request->input($key, '');
                Setting::updateOrCreate(['key' => $key], ['value' => $val]);
            }
        }

        return redirect()->back()->with('success', 'Payment Settings updated successfully! API keys and modes have been saved.');
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
