<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use App\Models\UserBackupCode;
use App\Notifications\MfaOtpNotification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class MfaService
{
    protected TotpService $totpService;

    public function __construct(TotpService $totpService)
    {
        $this->totpService = $totpService;
    }

    /**
     * Get global MFA policy: 'disabled' | 'optional' | 'enforced_admin' | 'enforced_all'.
     */
    public function getPolicy(): string
    {
        return Setting::where('key', 'mfa_policy')->value('value') ?? 'optional';
    }

    /**
     * Determine if MFA is enabled system-wide.
     */
    public function isSystemEnabled(): bool
    {
        return $this->getPolicy() !== 'disabled';
    }

    /**
     * Check whether Email OTP method is allowed by admin.
     */
    public function isEmailAllowed(): bool
    {
        return (Setting::where('key', 'mfa_allow_email')->value('value') ?? '1') === '1';
    }

    /**
     * Check whether Authenticator App (TOTP) method is allowed by admin.
     */
    public function isTotpAllowed(): bool
    {
        return (Setting::where('key', 'mfa_allow_totp')->value('value') ?? '1') === '1';
    }

    /**
     * Get OTP expiration in minutes.
     */
    public function getOtpExpirationMinutes(): int
    {
        return (int) (Setting::where('key', 'mfa_otp_expiration')->value('value') ?? 10);
    }

    /**
     * Get resend cooldown in seconds.
     */
    public function getResendCooldownSeconds(): int
    {
        return (int) (Setting::where('key', 'mfa_resend_cooldown')->value('value') ?? 60);
    }

    /**
     * Get max failed verification attempts before challenge lockout.
     */
    public function getMaxAttempts(): int
    {
        return (int) (Setting::where('key', 'mfa_max_attempts')->value('value') ?? 5);
    }

    /**
     * Get max resends allowed per session.
     */
    public function getMaxResends(): int
    {
        return (int) (Setting::where('key', 'mfa_max_resends')->value('value') ?? 5);
    }

    /**
     * Determine if a user must complete MFA to log in.
     */
    public function isMfaRequiredForUser(User $user): bool
    {
        $policy = $this->getPolicy();

        if ($policy === 'disabled') {
            return false;
        }

        if ($policy === 'enforced_all') {
            return true;
        }

        if ($policy === 'enforced_admin' && ($user->isAdmin() || $user->isStaff())) {
            return true;
        }

        // Under 'optional' (or non-admin in 'enforced_admin'), check individual account setting
        return (bool) $user->mfa_enabled;
    }

    /**
     * Get the available MFA methods for a user.
     */
    public function getAvailableMethodsForUser(User $user): array
    {
        $methods = [];

        if ($this->isEmailAllowed()) {
            $methods[] = 'email';
        }

        if ($this->isTotpAllowed() && !empty($user->mfa_secret)) {
            $methods[] = 'authenticator';
        }

        // Backup codes are always available if user has active unused backup codes
        if ($this->getRemainingBackupCodesCount($user) > 0) {
            $methods[] = 'backup_code';
        }

        return $methods;
    }

    /**
     * Determine primary/default method for user challenge.
     */
    public function getDefaultMethodForUser(User $user): string
    {
        $userPref = $user->mfa_type;

        if ($userPref === 'authenticator' && $this->isTotpAllowed() && !empty($user->mfa_secret)) {
            return 'authenticator';
        }

        if ($this->isEmailAllowed()) {
            return 'email';
        }

        if ($this->isTotpAllowed() && !empty($user->mfa_secret)) {
            return 'authenticator';
        }

        return 'email';
    }

    /**
     * Send or resend an Email OTP to the user.
     */
    public function sendEmailOtp(User $user, bool $isResend = false): array
    {
        if (!$this->isEmailAllowed()) {
            return [
                'success' => false,
                'message' => 'Email OTP is currently disabled by administrator.',
            ];
        }

        $now = now();

        // Check resend cooldown
        if ($isResend && $user->mfa_resend_available_at && $now->lt($user->mfa_resend_available_at)) {
            $remaining = $now->diffInSeconds($user->mfa_resend_available_at);
            return [
                'success' => false,
                'message' => "Please wait {$remaining} seconds before requesting another code.",
                'remaining_cooldown' => $remaining,
            ];
        }

        // Check resend count limit
        if ($isResend && $user->mfa_resend_count >= $this->getMaxResends()) {
            return [
                'success' => false,
                'message' => 'Maximum resend limit reached. Please wait for the current code to expire or contact support.',
            ];
        }

        $code = (string) random_int(100000, 999999);
        $expiresMinutes = $this->getOtpExpirationMinutes();
        $cooldownSeconds = $this->getResendCooldownSeconds();

        $user->mfa_email_otp = Hash::make($code);
        $user->mfa_otp_expires_at = $now->copy()->addMinutes($expiresMinutes);
        $user->mfa_resend_available_at = $now->copy()->addSeconds($cooldownSeconds);
        $user->mfa_resend_count = $isResend ? ($user->mfa_resend_count + 1) : 1;
        $user->save();

        try {
            $user->notify(new MfaOtpNotification($code, $expiresMinutes));
        } catch (\Throwable $e) {
            Log::error("Failed to send MFA OTP email to {$user->email}: " . $e->getMessage());
            // Log code in local/debug environment so developer/admin can always log in even without working SMTP
            if (config('app.debug') || app()->environment('local')) {
                Log::info("DEV MFA CODE FOR {$user->email}: {$code}");
            }
        }

        return [
            'success' => true,
            'message' => 'A verification code has been sent to your registered email.',
            'expires_in_minutes' => $expiresMinutes,
            'cooldown_seconds' => $cooldownSeconds,
        ];
    }

    /**
     * Verify submitted Email OTP.
     */
    public function verifyEmailOtp(User $user, string $code): array
    {
        $cleanCode = preg_replace('/\s+/', '', (string) $code);

        if (empty($user->mfa_email_otp) || empty($user->mfa_otp_expires_at)) {
            return [
                'success' => false,
                'message' => 'No active verification code found. Please request a new code.',
            ];
        }

        if (now()->gt($user->mfa_otp_expires_at)) {
            return [
                'success' => false,
                'message' => 'The verification code has expired. Please request a new one.',
            ];
        }

        if (!Hash::check($cleanCode, $user->mfa_email_otp)) {
            $user->increment('mfa_failed_attempts');
            $maxAttempts = $this->getMaxAttempts();
            $remaining = max(0, $maxAttempts - $user->mfa_failed_attempts);

            return [
                'success' => false,
                'message' => $remaining > 0
                    ? "Invalid code. {$remaining} attempt" . ($remaining === 1 ? '' : 's') . " remaining."
                    : 'Too many failed attempts. For security, please log in again.',
                'remaining_attempts' => $remaining,
            ];
        }

        // Successfully verified: clear temporary OTP state
        $user->mfa_email_otp = null;
        $user->mfa_otp_expires_at = null;
        $user->mfa_resend_available_at = null;
        $user->mfa_resend_count = 0;
        $user->mfa_failed_attempts = 0;
        $user->save();

        return ['success' => true];
    }

    /**
     * Verify submitted TOTP Authenticator code.
     */
    public function verifyTotp(User $user, string $code): array
    {
        if (!$this->isTotpAllowed()) {
            return [
                'success' => false,
                'message' => 'Authenticator App verification is currently disabled by administrator.',
            ];
        }

        if (empty($user->mfa_secret)) {
            return [
                'success' => false,
                'message' => 'Authenticator App is not configured for your account.',
            ];
        }

        $isValid = $this->totpService->verify($user->mfa_secret, $code);

        if (!$isValid) {
            $user->increment('mfa_failed_attempts');
            $maxAttempts = $this->getMaxAttempts();
            $remaining = max(0, $maxAttempts - $user->mfa_failed_attempts);

            return [
                'success' => false,
                'message' => $remaining > 0
                    ? "Invalid authenticator code. {$remaining} attempt" . ($remaining === 1 ? '' : 's') . " remaining."
                    : 'Too many failed attempts. For security, please log in again.',
                'remaining_attempts' => $remaining,
            ];
        }

        $user->mfa_failed_attempts = 0;
        $user->save();

        return ['success' => true];
    }

    /**
     * Verify submitted backup recovery code.
     */
    public function verifyBackupCode(User $user, string $code): array
    {
        $normalizedCode = strtoupper(preg_replace('/[^A-Z0-9]/', '', $code));

        $backupCodes = $user->backupCodes()->whereNull('used_at')->get();

        foreach ($backupCodes as $backupCode) {
            if (Hash::check($normalizedCode, $backupCode->code_hash)) {
                $backupCode->update(['used_at' => now()]);
                $user->mfa_failed_attempts = 0;
                $user->save();

                $remaining = $user->backupCodes()->whereNull('used_at')->count();

                return [
                    'success' => true,
                    'remaining_backup_codes' => $remaining,
                    'message' => "Backup code verified successfully. You have {$remaining} backup code(s) remaining.",
                ];
            }
        }

        $user->increment('mfa_failed_attempts');
        $maxAttempts = $this->getMaxAttempts();
        $remainingAttempts = max(0, $maxAttempts - $user->mfa_failed_attempts);

        return [
            'success' => false,
            'message' => 'Invalid backup code or code has already been used.',
            'remaining_attempts' => $remainingAttempts,
        ];
    }

    /**
     * Generate fresh set of 8 backup codes for user.
     */
    public function generateBackupCodes(User $user, int $count = 8): array
    {
        // Invalidate old backup codes
        $user->backupCodes()->delete();

        $plainCodes = [];
        $charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // exclude 0, 1, I, O to prevent confusion

        for ($i = 0; $i < $count; $i++) {
            $part1 = '';
            $part2 = '';
            for ($j = 0; $j < 4; $j++) {
                $part1 .= $charset[random_int(0, strlen($charset) - 1)];
                $part2 .= $charset[random_int(0, strlen($charset) - 1)];
            }
            $clean = $part1 . $part2;
            $formatted = "{$part1}-{$part2}";

            UserBackupCode::create([
                'user_id' => $user->id,
                'code_hash' => Hash::make($clean),
            ]);

            $plainCodes[] = $formatted;
        }

        return $plainCodes;
    }

    /**
     * Get remaining unused backup codes count.
     */
    public function getRemainingBackupCodesCount(User $user): int
    {
        return $user->backupCodes()->whereNull('used_at')->count();
    }

    /**
     * Emergency / Administrative reset of a user's MFA.
     */
    public function resetUserMfa(User $user): void
    {
        $user->update([
            'mfa_enabled' => false,
            'mfa_type' => null,
            'mfa_secret' => null,
            'mfa_email_otp' => null,
            'mfa_otp_expires_at' => null,
            'mfa_resend_available_at' => null,
            'mfa_resend_count' => 0,
            'mfa_failed_attempts' => 0,
        ]);

        $user->backupCodes()->delete();
    }
}
