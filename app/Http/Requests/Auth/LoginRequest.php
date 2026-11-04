<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            // Increment cumulative failed attempt counters
            $attempts = \Illuminate\Support\Facades\Cache::has($this->attemptsCountKey())
                ? \Illuminate\Support\Facades\Cache::increment($this->attemptsCountKey())
                : (\Illuminate\Support\Facades\Cache::put($this->attemptsCountKey(), 1, 86400) ? 1 : 1);

            $emailAttempts = \Illuminate\Support\Facades\Cache::has($this->emailAttemptsCountKey())
                ? \Illuminate\Support\Facades\Cache::increment($this->emailAttemptsCountKey())
                : (\Illuminate\Support\Facades\Cache::put($this->emailAttemptsCountKey(), 1, 86400) ? 1 : 1);

            $totalAttempts = max($attempts, $emailAttempts);

            // Progressive Rate Limiting Tiers:
            // Tier 3: 12 attempts -> 15 minutes (900 seconds) lockout
            // Tier 2: 6 attempts -> 5 minutes (300 seconds) lockout
            // Tier 1: 3 attempts -> 1 minute (60 seconds) lockout

            if ($totalAttempts >= 12) {
                $duration = 900; // 15 minutes
                $lockoutUntil = time() + $duration;
                \Illuminate\Support\Facades\Cache::put($this->lockoutUntilKey(), $lockoutUntil, $duration);
                \Illuminate\Support\Facades\Cache::put($this->emailLockoutUntilKey(), $lockoutUntil, $duration);

                // Automatically lock the user account in database so admin can see and unlock it
                $user = \App\Models\User::where('email', $this->string('email'))->first();
                if ($user && $user->role !== 'admin') {
                    $user->update(['status' => 'locked']);
                    \Illuminate\Support\Facades\Cache::put('locked_user_ip:'.$user->id, $this->ip(), 1800);
                    \Illuminate\Support\Facades\Log::warning("User account locked out after 12 failed login attempts: {$user->email} from IP {$this->ip()}");
                }

                event(new Lockout($this));

                throw ValidationException::withMessages([
                    'email' => "Brute-force protection triggered: 12 failed login attempts reached. Your account has been temporarily locked for 15 minutes for security. If you are locked out, please call ELFAA Support at 0917-888-9999 or email support@elfaacarrental.com and an admin will unlock your account immediately.|seconds:{$duration}",
                ]);
            }

            if ($totalAttempts >= 6 && $totalAttempts < 12) {
                // Trigger 5-minute lockout at 6 attempts
                if ($totalAttempts === 6) {
                    $duration = 300; // 5 minutes
                    $lockoutUntil = time() + $duration;
                    \Illuminate\Support\Facades\Cache::put($this->lockoutUntilKey(), $lockoutUntil, $duration);
                    \Illuminate\Support\Facades\Cache::put($this->emailLockoutUntilKey(), $lockoutUntil, $duration);

                    event(new Lockout($this));

                    throw ValidationException::withMessages([
                        'email' => "Brute-force protection triggered: 6 failed login attempts reached. Your account has been temporarily locked for 5 minutes for security. If you are locked out, please call ELFAA Support at 0917-888-9999 or email support@elfaacarrental.com and an admin will unlock your account immediately.|seconds:{$duration}",
                    ]);
                }

                // If between 7 and 11 attempts (after 5-minute lockout expired)
                $attemptsLeft = 12 - $totalAttempts;
                throw ValidationException::withMessages([
                    'email' => "Invalid email or password. Warning: {$attemptsLeft} attempt" . ($attemptsLeft === 1 ? '' : 's') . " remaining before a 15-minute account lockout.",
                ]);
            }

            if ($totalAttempts >= 3 && $totalAttempts < 6) {
                // Trigger 1-minute lockout at 3 attempts
                if ($totalAttempts === 3) {
                    $duration = 60; // 1 minute
                    $lockoutUntil = time() + $duration;
                    \Illuminate\Support\Facades\Cache::put($this->lockoutUntilKey(), $lockoutUntil, $duration);
                    \Illuminate\Support\Facades\Cache::put($this->emailLockoutUntilKey(), $lockoutUntil, $duration);

                    event(new Lockout($this));

                    throw ValidationException::withMessages([
                        'email' => "Brute-force protection triggered: 3 failed login attempts reached. Your account has been temporarily locked for 1 minute for security. If you are locked out, please call ELFAA Support at 0917-888-9999 or email support@elfaacarrental.com and an admin will unlock your account immediately.|seconds:{$duration}",
                    ]);
                }

                // If between 4 and 5 attempts (after 1-minute lockout expired)
                $attemptsLeft = 6 - $totalAttempts;
                throw ValidationException::withMessages([
                    'email' => "Invalid email or password. Warning: {$attemptsLeft} attempt" . ($attemptsLeft === 1 ? '' : 's') . " remaining before a 5-minute account lockout.",
                ]);
            }

            // Below 3 attempts
            $attemptsLeft = 3 - $totalAttempts;
            throw ValidationException::withMessages([
                'email' => "Invalid email or password. Warning: {$attemptsLeft} attempt" . ($attemptsLeft === 1 ? '' : 's') . " remaining before a 1-minute account lockout.",
            ]);
        }

        $this->clearRateLimits();
    }

    /**
     * Ensure the login request is not rate limited or account locked.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        // First check if user is locked in database
        $user = \App\Models\User::where('email', $this->string('email'))->first();
        if ($user && $user->isLocked()) {
            throw ValidationException::withMessages([
                'email' => 'Your account has been locked by security protection or an administrator. If you are locked out, please call ELFAA Support at 0917-888-9999 or email support@elfaacarrental.com and an admin will unlock your account immediately.',
            ]);
        }

        $now = time();
        $lockoutUntilIp = (int) \Illuminate\Support\Facades\Cache::get($this->lockoutUntilKey(), 0);
        $lockoutUntilEmail = (int) \Illuminate\Support\Facades\Cache::get($this->emailLockoutUntilKey(), 0);
        $maxLockout = max($lockoutUntilIp, $lockoutUntilEmail);

        if ($maxLockout > $now) {
            event(new Lockout($this));
            $seconds = $maxLockout - $now;
            $minutes = max(1, ceil($seconds / 60));

            throw ValidationException::withMessages([
                'email' => "Brute-force protection active: Your account has been temporarily locked for {$minutes} minute" . ($minutes > 1 ? 's' : '') . " for security. If you are locked out, please call ELFAA Support at 0917-888-9999 or email support@elfaacarrental.com and an admin will unlock your account immediately.|seconds:{$seconds}",
            ]);
        }
    }

    /**
     * Clear all rate limiting attempt counters and lockout timers upon successful authentication.
     */
    public function clearRateLimits(): void
    {
        \Illuminate\Support\Facades\Cache::forget($this->attemptsCountKey());
        \Illuminate\Support\Facades\Cache::forget($this->emailAttemptsCountKey());
        \Illuminate\Support\Facades\Cache::forget($this->lockoutUntilKey());
        \Illuminate\Support\Facades\Cache::forget($this->emailLockoutUntilKey());
        RateLimiter::clear($this->throttleKey());
        RateLimiter::clear($this->emailThrottleKey());
    }

    /**
     * Get the rate limiting throttle key for IP + email.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }

    /**
     * Get the rate limiting throttle key for email account (allows admin to clear upon customer call).
     */
    public function emailThrottleKey(): string
    {
        return 'login:email:' . Str::transliterate(Str::lower($this->string('email')));
    }

    public function attemptsCountKey(): string
    {
        return 'login:attempts:' . $this->throttleKey();
    }

    public function emailAttemptsCountKey(): string
    {
        return 'login:attempts:email:' . Str::transliterate(Str::lower($this->string('email')));
    }

    public function lockoutUntilKey(): string
    {
        return 'login:lockout_until:' . $this->throttleKey();
    }

    public function emailLockoutUntilKey(): string
    {
        return 'login:lockout_until:email:' . Str::transliterate(Str::lower($this->string('email')));
    }
}
