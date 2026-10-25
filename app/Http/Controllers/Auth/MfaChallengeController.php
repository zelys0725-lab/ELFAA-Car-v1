<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\MfaService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class MfaChallengeController extends Controller
{
    protected MfaService $mfaService;

    public function __construct(MfaService $mfaService)
    {
        $this->mfaService = $mfaService;
    }

    /**
     * Helper to retrieve pending MFA user from session.
     */
    protected function getPendingUser(Request $request): ?User
    {
        $userId = $request->session()->get('mfa:user_id');
        if (!$userId) {
            return null;
        }

        return User::find($userId);
    }

    /**
     * Mask an email address for privacy (e.g. j***@domain.com).
     */
    protected function maskEmail(string $email): string
    {
        $parts = explode('@', $email);
        if (count($parts) !== 2) {
            return $email;
        }

        $name = $parts[0];
        $domain = $parts[1];

        if (strlen($name) <= 2) {
            $maskedName = substr($name, 0, 1) . '*';
        } else {
            $maskedName = substr($name, 0, 1) . str_repeat('*', max(3, strlen($name) - 2)) . substr($name, -1);
        }

        return $maskedName . '@' . $domain;
    }

    /**
     * Display the MFA verification challenge view.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $this->getPendingUser($request);

        if (!$user) {
            return redirect()->route('login')->withErrors([
                'email' => 'Your authentication session has expired. Please log in again.',
            ]);
        }

        if ($user->isLocked() || !$user->isActive()) {
            $request->session()->forget(['mfa:user_id', 'mfa:remember', 'mfa:method']);
            return redirect()->route('login')->withErrors([
                'email' => 'Your account is currently inactive or locked. Please contact support.',
            ]);
        }

        $availableMethods = $this->mfaService->getAvailableMethodsForUser($user);

        // Determine current method
        $currentMethod = $request->session()->get('mfa:method');
        if (!$currentMethod || !in_array($currentMethod, $availableMethods, true)) {
            $currentMethod = $this->mfaService->getDefaultMethodForUser($user);
            $request->session()->put('mfa:method', $currentMethod);

            // If defaulting to email, trigger initial OTP send if needed
            if ($currentMethod === 'email' && (empty($user->mfa_email_otp) || now()->gt($user->mfa_otp_expires_at ?? now()->subSecond()))) {
                $this->mfaService->sendEmailOtp($user, false);
            }
        }

        // Calculate cooldown remaining for email resend
        $cooldownRemaining = 0;
        if ($user->mfa_resend_available_at && now()->lt($user->mfa_resend_available_at)) {
            $cooldownRemaining = now()->diffInSeconds($user->mfa_resend_available_at);
        }

        return Inertia::render('Auth/MfaChallenge', [
            'method' => $currentMethod,
            'availableMethods' => $availableMethods,
            'maskedEmail' => $this->maskEmail($user->email),
            'hasTotp' => !empty($user->mfa_secret) && $this->mfaService->isTotpAllowed(),
            'hasBackupCodes' => $this->mfaService->getRemainingBackupCodesCount($user) > 0,
            'cooldownSeconds' => $cooldownRemaining,
            'expiresInMinutes' => $this->mfaService->getOtpExpirationMinutes(),
            'maxAttempts' => $this->mfaService->getMaxAttempts(),
            'failedAttempts' => $user->mfa_failed_attempts,
            'status' => session('status'),
            'error' => session('error'),
        ]);
    }

    /**
     * Verify the user's submitted MFA code (OTP, TOTP, or Backup Code).
     */
    public function verify(Request $request): RedirectResponse
    {
        $user = $this->getPendingUser($request);

        if (!$user) {
            return redirect()->route('login')->withErrors([
                'email' => 'Your session has expired. Please log in again.',
            ]);
        }

        $request->validate([
            'code' => ['required', 'string', 'max:25'],
            'method' => ['required', 'string', 'in:email,authenticator,backup_code'],
        ]);

        $method = $request->input('method');
        $code = trim($request->input('code'));

        $maxAttempts = $this->mfaService->getMaxAttempts();
        if ($user->mfa_failed_attempts >= $maxAttempts) {
            $request->session()->forget(['mfa:user_id', 'mfa:remember', 'mfa:method']);
            return redirect()->route('login')->withErrors([
                'email' => 'Too many failed verification attempts. For your security, this session has been locked. Please log in again.',
            ]);
        }

        $result = match ($method) {
            'email' => $this->mfaService->verifyEmailOtp($user, $code),
            'authenticator' => $this->mfaService->verifyTotp($user, $code),
            'backup_code' => $this->mfaService->verifyBackupCode($user, $code),
            default => ['success' => false, 'message' => 'Invalid authentication method selected.'],
        };

        if (!$result['success']) {
            return back()->withErrors([
                'code' => $result['message'] ?? 'Invalid code entered. Please try again.',
            ]);
        }

        // Successfully verified! Authenticate user
        $remember = (bool) $request->session()->get('mfa:remember', false);
        $request->session()->forget(['mfa:user_id', 'mfa:remember', 'mfa:method']);

        Auth::login($user, $remember);
        $request->session()->regenerate();

        if (isset($result['remaining_backup_codes'])) {
            session()->flash('warning', "You logged in using a single-use backup recovery code. You have {$result['remaining_backup_codes']} code(s) remaining.");
        }

        if ($user->isAdmin() || $user->isStaff()) {
            return redirect()->intended(route('admin.dashboard'));
        }

        return redirect()->intended(route('client.dashboard', ['tab' => 'fleet']));
    }

    /**
     * Resend an Email OTP.
     */
    public function resend(Request $request): RedirectResponse
    {
        $user = $this->getPendingUser($request);

        if (!$user) {
            return redirect()->route('login');
        }

        $result = $this->mfaService->sendEmailOtp($user, true);

        if (!$result['success']) {
            return back()->withErrors([
                'code' => $result['message'],
            ]);
        }

        return back()->with('status', 'A new verification code has been dispatched to your email.');
    }

    /**
     * Switch active verification method.
     */
    public function switchMethod(Request $request): RedirectResponse
    {
        $user = $this->getPendingUser($request);

        if (!$user) {
            return redirect()->route('login');
        }

        $request->validate([
            'method' => ['required', 'string', 'in:email,authenticator,backup_code'],
        ]);

        $newMethod = $request->input('method');
        $available = $this->mfaService->getAvailableMethodsForUser($user);

        if (!in_array($newMethod, $available, true)) {
            return back()->withErrors(['method' => 'Selected verification method is not available.']);
        }

        $request->session()->put('mfa:method', $newMethod);

        // If switching to email and no valid code is active, send one
        if ($newMethod === 'email' && (empty($user->mfa_email_otp) || now()->gt($user->mfa_otp_expires_at ?? now()->subSecond()))) {
            $this->mfaService->sendEmailOtp($user, false);
        }

        return back();
    }

    /**
     * Cancel the MFA verification and return to login.
     */
    public function cancel(Request $request): RedirectResponse
    {
        $request->session()->forget(['mfa:user_id', 'mfa:remember', 'mfa:method']);
        return redirect()->route('login');
    }
}
