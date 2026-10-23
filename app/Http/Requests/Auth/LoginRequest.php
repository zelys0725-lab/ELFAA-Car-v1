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
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->only('email', 'password'), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey(), 900); // Lock for 15 minutes (900 seconds)

            if (RateLimiter::attempts($this->throttleKey()) >= 3) {
                event(new Lockout($this));
                $seconds = RateLimiter::availableIn($this->throttleKey());
                $minutes = max(1, ceil($seconds / 60));

                throw ValidationException::withMessages([
                    'email' => "Brute-force protection triggered: 3 failed login attempts reached. Your account has been temporarily locked for {$minutes} minutes for security.|seconds:{$seconds}",
                ]);
            }

            $attemptsLeft = RateLimiter::retriesLeft($this->throttleKey(), 3);

            throw ValidationException::withMessages([
                'email' => "Invalid email or password. Warning: {$attemptsLeft} attempt" . ($attemptsLeft === 1 ? '' : 's') . " remaining before temporary account lockout.",
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 3)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());
        $minutes = max(1, ceil($seconds / 60));

        throw ValidationException::withMessages([
            'email' => "Brute-force protection triggered: 3 failed login attempts reached. Your account has been temporarily locked for {$minutes} minutes for security.|seconds:{$seconds}",
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
