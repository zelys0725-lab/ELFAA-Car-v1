<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'phone' => 'required|string|max:20',
            'drivers_license_number' => 'nullable|string|max:50',
            'password' => ['required', 'confirmed', Rules\Password::defaults()->min(8)],
            'terms' => 'required|accepted',
        ], [
            'terms.accepted' => 'You must agree to the Terms and Conditions to create an account.',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'drivers_license_number' => $request->drivers_license_number,
            'password' => Hash::make($request->password),
            'role' => 'client', // Default to client (renter)
            'status' => 'active',
            'terms_accepted_at' => now(),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect('/');
    }
}
