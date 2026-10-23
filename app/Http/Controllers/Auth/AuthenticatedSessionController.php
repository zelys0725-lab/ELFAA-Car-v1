<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        // Check if user is locked by admin
        if ($user->isLocked()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been locked by an administrator. Please contact support.',
            ]);
        }

        // Check if user is deactivated
        if (! $user->isActive()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Your account has been deactivated. Please contact support.',
            ]);
        }

        // Check if Multi-Factor Authentication (MFA) is required
        $mfaService = app(\App\Services\MfaService::class);
        if ($mfaService->isMfaRequiredForUser($user)) {
            $userId = $user->id;
            $remember = $request->boolean('remember');

            // Log out from full session
            Auth::guard('web')->logout();

            // Set pending MFA session state
            $request->session()->put('mfa:user_id', $userId);
            $request->session()->put('mfa:remember', $remember);

            $defaultMethod = $mfaService->getDefaultMethodForUser($user);
            $request->session()->put('mfa:method', $defaultMethod);

            // If method is email, dispatch initial OTP code
            if ($defaultMethod === 'email') {
                $mfaService->sendEmailOtp($user, false);
            }

            return redirect()->route('mfa.challenge');
        }

        $request->session()->regenerate();

        // Redirect based on role
        if ($user->isAdmin() || $user->isStaff()) {
            return redirect()->route('admin.dashboard');
        }

        return redirect()->route('client.dashboard');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
