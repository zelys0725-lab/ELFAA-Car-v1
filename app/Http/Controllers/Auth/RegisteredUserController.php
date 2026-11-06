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
    public function create(Request $request): Response
    {
        $redirect = $request->query('redirect');
        $selectVehicleId = $request->query('select_vehicle');
        $selectedVehicle = null;
        if ($selectVehicleId) {
            $selectedVehicle = \App\Models\Vehicle::find($selectVehicleId);
        }

        return Inertia::render('Auth/Register', [
            'redirect' => $redirect,
            'selectedVehicle' => $selectedVehicle,
            'vehicles' => \App\Models\Vehicle::whereIn('status', ['available', 'rented', 'reserved'])->get(),
            'promos' => \App\Models\Promo::where('status', 'active')->get(),
        ]);
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
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
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

        if ($request->filled('redirect')) {
            return redirect($request->input('redirect'));
        }

        if ($request->filled('select_vehicle')) {
            return redirect()->route('client.dashboard', [
                'tab' => 'dashboard',
                'select_vehicle' => $request->input('select_vehicle'),
                'voice_guide' => 1,
            ]);
        }

        return redirect()->route('client.dashboard', ['tab' => 'fleet']);
    }
}
