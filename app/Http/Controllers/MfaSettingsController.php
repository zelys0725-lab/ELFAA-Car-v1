<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use App\Services\MfaService;
use App\Services\TotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class MfaSettingsController extends Controller
{
    protected MfaService $mfaService;
    protected TotpService $totpService;

    public function __construct(MfaService $mfaService, TotpService $totpService)
    {
        $this->mfaService = $mfaService;
        $this->totpService = $totpService;
    }

    /**
     * Get the authenticated user's current MFA status and security information.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'mfa_enabled' => (bool) $user->mfa_enabled,
            'mfa_type' => $user->mfa_type,
            'has_totp' => !empty($user->mfa_secret),
            'email_allowed' => $this->mfaService->isEmailAllowed(),
            'totp_allowed' => $this->mfaService->isTotpAllowed(),
            'policy' => $this->mfaService->getPolicy(),
            'is_mandatory' => $this->mfaService->isMfaRequiredForUser($user),
            'remaining_backup_codes' => $this->mfaService->getRemainingBackupCodesCount($user),
        ]);
    }

    /**
     * Initialize TOTP setup: Generate a new secret and QR code URI.
     */
    public function setupTotp(Request $request): JsonResponse
    {
        if (!$this->mfaService->isTotpAllowed()) {
            return response()->json([
                'success' => false,
                'message' => 'Authenticator App verification is currently disabled by administrator.',
            ], 403);
        }

        $user = $request->user();
        $secret = $this->totpService->generateSecret(16);

        // Store pending secret temporarily in session
        $request->session()->put('mfa:pending_totp_secret', $secret);

        $issuer = Setting::where('key', 'site_logo')->value('value') ?: 'ELFAA Car Rental';
        $otpauthUrl = $this->totpService->getOtpAuthUrl($issuer, $user->email, $secret);

        return response()->json([
            'success' => true,
            'secret' => $secret,
            'formatted_secret' => chunk_split($secret, 4, ' '),
            'otpauth_url' => $otpauthUrl,
            'account' => $user->email,
            'issuer' => $issuer,
        ]);
    }

    /**
     * Confirm TOTP setup with code verification.
     */
    public function confirmTotp(Request $request): JsonResponse|RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();
        $secret = $request->session()->get('mfa:pending_totp_secret');

        if (!$secret) {
            return response()->json([
                'success' => false,
                'message' => 'No pending authenticator setup found. Please start setup again.',
            ], 422);
        }

        if (!$this->totpService->verify($secret, $request->input('code'))) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid 6-digit code. Please verify the code in your Authenticator app and try again.',
            ], 422);
        }

        // Save secret and enable MFA
        $user->mfa_secret = $secret;
        $user->mfa_enabled = true;
        if (empty($user->mfa_type)) {
            $user->mfa_type = 'authenticator';
        }
        $user->save();

        $request->session()->forget('mfa:pending_totp_secret');

        // Automatically generate backup codes if user doesn't have any
        $backupCodes = [];
        if ($this->mfaService->getRemainingBackupCodesCount($user) === 0) {
            $backupCodes = $this->mfaService->generateBackupCodes($user);
        }

        return response()->json([
            'success' => true,
            'message' => 'Authenticator App successfully connected and activated!',
            'backup_codes' => $backupCodes,
        ]);
    }

    /**
     * Send test/confirmation code to enable Email OTP.
     */
    public function sendEmailConfirmation(Request $request): JsonResponse
    {
        if (!$this->mfaService->isEmailAllowed()) {
            return response()->json([
                'success' => false,
                'message' => 'Email OTP verification is disabled by administrator.',
            ], 403);
        }

        $user = $request->user();
        $result = $this->mfaService->sendEmailOtp($user, false);

        return response()->json($result);
    }

    /**
     * Confirm code and enable Email OTP.
     */
    public function confirmEmail(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        $user = $request->user();
        $result = $this->mfaService->verifyEmailOtp($user, $request->input('code'));

        if (!$result['success']) {
            return response()->json($result, 422);
        }

        $user->mfa_enabled = true;
        $user->mfa_type = 'email';
        $user->save();

        $backupCodes = [];
        if ($this->mfaService->getRemainingBackupCodesCount($user) === 0) {
            $backupCodes = $this->mfaService->generateBackupCodes($user);
        }

        return response()->json([
            'success' => true,
            'message' => 'Email OTP verification has been enabled for your account.',
            'backup_codes' => $backupCodes,
        ]);
    }

    /**
     * Update preferred MFA method.
     */
    public function setPreferredMethod(Request $request): JsonResponse
    {
        $request->validate([
            'method' => ['required', 'string', 'in:email,authenticator'],
        ]);

        $user = $request->user();
        $method = $request->input('method');

        if ($method === 'authenticator' && empty($user->mfa_secret)) {
            return response()->json([
                'success' => false,
                'message' => 'Please set up an Authenticator App before setting it as preferred.',
            ], 422);
        }

        $user->mfa_type = $method;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => "Preferred authentication method changed to {$method}.",
        ]);
    }

    /**
     * Generate fresh set of backup recovery codes.
     */
    public function generateBackupCodes(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Incorrect account password.',
            ], 422);
        }

        $codes = $this->mfaService->generateBackupCodes($user, 8);

        return response()->json([
            'success' => true,
            'codes' => $codes,
            'message' => 'New recovery backup codes generated. Previous codes have been invalidated.',
        ]);
    }

    /**
     * Disable MFA for user (requires current password).
     */
    public function disable(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if policy enforces MFA
        $policy = $this->mfaService->getPolicy();
        if ($policy === 'enforced_all' || ($policy === 'enforced_admin' && ($user->isAdmin() || $user->isStaff()))) {
            return response()->json([
                'success' => false,
                'message' => 'Multi-Factor Authentication is enforced by system policy and cannot be disabled.',
            ], 403);
        }

        $request->validate([
            'password' => ['required', 'string'],
        ]);

        if (!Hash::check($request->input('password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Incorrect account password.',
            ], 422);
        }

        $this->mfaService->resetUserMfa($user);

        return response()->json([
            'success' => true,
            'message' => 'Multi-Factor Authentication has been successfully disabled.',
        ]);
    }

    /**
     * Update global MFA settings (Admin only).
     */
    public function updateAdminSettings(Request $request): RedirectResponse
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action. Only administrators can configure MFA policies.');
        }

        $request->validate([
            'mfa_policy' => ['required', 'string', 'in:disabled,optional,enforced_admin,enforced_all'],
            'mfa_allow_email' => ['nullable', 'in:0,1'],
            'mfa_allow_totp' => ['nullable', 'in:0,1'],
            'mfa_otp_expiration' => ['required', 'integer', 'min:1', 'max:60'],
            'mfa_resend_cooldown' => ['required', 'integer', 'min:10', 'max:300'],
            'mfa_max_attempts' => ['required', 'integer', 'min:3', 'max:10'],
            'mfa_max_resends' => ['required', 'integer', 'min:2', 'max:10'],
        ]);

        $keys = [
            'mfa_policy',
            'mfa_allow_email',
            'mfa_allow_totp',
            'mfa_otp_expiration',
            'mfa_resend_cooldown',
            'mfa_max_attempts',
            'mfa_max_resends',
        ];

        foreach ($keys as $key) {
            $val = (string) $request->input($key, '');
            Setting::updateOrCreate(['key' => $key], ['value' => $val]);
        }

        return back()->with('success', 'MFA Security Policies and Configuration updated successfully!');
    }

    /**
     * Reset a specific user's MFA (Admin emergency recovery).
     */
    public function adminResetUserMfa(User $user): RedirectResponse
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action. Only administrators can reset user MFA.');
        }

        $this->mfaService->resetUserMfa($user);

        return back()->with('success', "MFA has been reset for {$user->name} ({$user->email}). The user can now log in without MFA.");
    }
}
