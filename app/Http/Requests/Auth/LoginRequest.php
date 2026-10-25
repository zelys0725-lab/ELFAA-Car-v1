<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
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
    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey(), 900); // Lock for 15 minutes (900 seconds)
            RateLimiter::hit($this->emailThrottleKey(), 900);

            $attempts = max(
                RateLimiter::attempts($this->throttleKey()),
                RateLimiter::attempts($this->emailThrottleKey())
            );

            if ($attempts >= 3) {
                // Automatically lock the user account in database so admin can see and unlock it
                $user = \App\Models\User::where('email', $this->string('email'))->first();
                if ($user && $user->role !== 'admin') {
                    $user->update(['status' => 'locked']);
                    \Illuminate\Support\Facades\Cache::put('locked_user_ip:'.$user->id, $this->ip(), 1800);
                    \Illuminate\Support\Facades\Log::warning("User account locked out after 3 failed login attempts: {$user->email} from IP {$this->ip()}");
                }

                event(new Lockout($this));
                $seconds = max(
                    RateLimiter::availableIn($this->throttleKey()),
                    RateLimiter::availableIn($this->emailThrottleKey())
                );
                $minutes = max(1, ceil($seconds / 60));

                throw ValidationException::withMessages([
                    'email' => "Brute-force protection triggered: 3 failed login attempts reached. Your account has been temporarily locked for {$minutes} minutes for security. If you are locked out, please call ELFAA Support at 0917-888-9999 or email support@elfaacarrental.com and an admin will unlock your account immediately.|seconds:{$seconds}",
                ]);
            }

            $attemptsLeft = min(
                RateLimiter::retriesLeft($this->throttleKey(), 3),
                RateLimiter::retriesLeft($this->emailThrottleKey(), 3)
            );

            throw ValidationException::withMessages([
                'email' => "Invalid email or password. Warning: {$attemptsLeft} attempt" . ($attemptsLeft === 1 ? '' : 's') . " remaining before account lockout.",
            ]);
        }

        RateLimiter::clear($this->throttleKey());
        RateLimiter::clear($this->emailThrottleKey());
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

        $emailLimited = RateLimiter::tooManyAttempts($this->emailThrottleKey(), 3);
        $ipLimited = RateLimiter::tooManyAttempts($this->throttleKey(), 3);

        if (! $emailLimited && ! $ipLimited) {
            return;
        }

        event(new Lockout($this));

        $seconds = max(
            RateLimiter::availableIn($this->throttleKey()),
            RateLimiter::availableIn($this->emailThrottleKey())
        );
        $minutes = max(1, ceil($seconds / 60));

        throw ValidationException::withMessages([
            'email' => "Brute-force protection triggered: 3 failed login attempts reached. Your account has been temporarily locked for {$minutes} minutes for security. If you are locked out, please call ELFAA Support at 0917-888-9999 or email support@elfaacarrental.com and an admin will unlock your account immediately.|seconds:{$seconds}",
        ]);
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
}
