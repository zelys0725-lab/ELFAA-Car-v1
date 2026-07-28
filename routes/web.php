<?php

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Vehicle;
use App\Models\Promo;
use App\Models\ExtraGood;
use App\Http\Controllers\ProfileController;

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Landing Homepage - Guest accessible
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
        'vehicles' => Vehicle::where('status', 'available')->get(),
        'promos' => Promo::where('status', 'active')->get(),
        'addOns' => ExtraGood::where('status', 'available')->get(),
    ]);
});

// ================= RENTER PORTAL (CLIENTS) =================
Route::middleware(['auth', 'role:client'])->prefix('client')->name('client.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\ClientPortalController::class, 'dashboard'])->name('dashboard');
    Route::post('/bookings', [App\Http\Controllers\ClientPortalController::class, 'storeBooking'])->name('bookings.store');
    Route::post('/bookings/{booking}/cancel', [App\Http\Controllers\ClientPortalController::class, 'cancelBooking'])->name('bookings.cancel');
    Route::post('/bookings/{booking}/rate', [App\Http\Controllers\ClientPortalController::class, 'storeRating'])->name('bookings.rate');
    Route::post('/documents', [App\Http\Controllers\ClientPortalController::class, 'storeDocument'])->name('documents.store');
});

// ================= ADMIN & STAFF PORTAL =================
Route::middleware(['auth', 'role:admin,staff'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\AdminPortalController::class, 'dashboard'])->name('dashboard');
    Route::post('/users/{user}/toggle', [App\Http\Controllers\AdminPortalController::class, 'toggleUserStatus'])->name('users.toggle');
    Route::post('/documents/{document}/verify', [App\Http\Controllers\AdminPortalController::class, 'verifyDocument'])->name('documents.verify');
    Route::post('/bookings/{booking}/verify', [App\Http\Controllers\AdminPortalController::class, 'verifyBooking'])->name('bookings.verify');
    
    // Vehicles CRUD
    Route::post('/vehicles', [App\Http\Controllers\AdminPortalController::class, 'storeVehicle'])->name('vehicles.store');
    Route::post('/vehicles/{vehicle}', [App\Http\Controllers\AdminPortalController::class, 'updateVehicle'])->name('vehicles.update');
    Route::post('/vehicles/{vehicle}/destroy', [App\Http\Controllers\AdminPortalController::class, 'deleteVehicle'])->name('vehicles.destroy');
    
    // Promos CRUD
    Route::post('/promos', [App\Http\Controllers\AdminPortalController::class, 'storePromo'])->name('promos.store');
    Route::post('/promos/{promo}', [App\Http\Controllers\AdminPortalController::class, 'updatePromo'])->name('promos.update');
    Route::post('/promos/{promo}/destroy', [App\Http\Controllers\AdminPortalController::class, 'deletePromo'])->name('promos.destroy');
    
    // Extra Goods CRUD
    Route::post('/extra-goods', [App\Http\Controllers\AdminPortalController::class, 'storeExtraGood'])->name('extra-goods.store');
    Route::post('/extra-goods/{extraGood}', [App\Http\Controllers\AdminPortalController::class, 'updateExtraGood'])->name('extra-goods.update');
    Route::post('/extra-goods/{extraGood}/destroy', [App\Http\Controllers\AdminPortalController::class, 'deleteExtraGood'])->name('extra-goods.destroy');

    // Site Settings Configurations
    Route::post('/settings', [App\Http\Controllers\AdminPortalController::class, 'updateSettings'])->name('settings.update');
});

// Standard Breeze Auth Routes
require __DIR__.'/auth.php';
