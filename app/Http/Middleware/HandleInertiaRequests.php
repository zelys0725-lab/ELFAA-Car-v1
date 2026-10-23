<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $isAdmin = $user && method_exists($user, 'isAdmin') ? $user->isAdmin() : ($user?->role === 'admin');

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'settings' => rescue(function () use ($isAdmin) {
                $settings = \App\Models\Setting::pluck('value', 'key');
                $all = is_array($settings) ? $settings : (method_exists($settings, 'all') ? $settings->all() : (array) $settings);

                if (!$isAdmin) {
                    $sensitiveKeys = [
                        'mail_password',
                        'sms_api_key',
                        'payment_stripe_test_sk',
                        'payment_stripe_live_sk',
                        'payment_stripe_test_webhook_secret',
                        'payment_stripe_live_webhook_secret',
                        'payment_gcash_test_sk',
                        'payment_gcash_live_sk',
                        'payment_gcash_test_webhook_secret',
                        'payment_gcash_live_webhook_secret',
                    ];
                    foreach ($sensitiveKeys as $key) {
                        unset($all[$key]);
                    }
                }

                return $all;
            }, []),
            'paymentGateways' => rescue(function () {
                return app(\App\Services\Payments\PaymentManager::class)->getAvailableGateways();
            }, []),
        ];
    }
}
