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
        'vehicles' => Vehicle::whereIn('status', ['available', 'rented', 'reserved'])->get(),
        'promos' => Promo::where('status', 'active')->get(),
        'addOns' => ExtraGood::where('status', 'available')->get(),
    ]);
});

// ================= RENTER PORTAL (CLIENTS) =================
Route::middleware(['auth', 'nocache', 'role:client'])->prefix('client')->name('client.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\ClientPortalController::class, 'dashboard'])->name('dashboard');
    Route::post('/bookings', [App\Http\Controllers\ClientPortalController::class, 'storeBooking'])->name('bookings.store');
    Route::post('/bookings/{booking}/cancel', [App\Http\Controllers\ClientPortalController::class, 'cancelBooking'])->name('bookings.cancel');
    Route::post('/bookings/{booking}/rate', [App\Http\Controllers\ClientPortalController::class, 'storeRating'])->name('bookings.rate');
    Route::post('/bookings/{booking}/payment-proof', [App\Http\Controllers\ClientPortalController::class, 'uploadPaymentProof'])->name('bookings.payment_proof');
    Route::post('/documents', [App\Http\Controllers\ClientPortalController::class, 'storeDocument'])->name('documents.store');
    Route::post('/identity', [App\Http\Controllers\ClientPortalController::class, 'updateIdentityDetails'])->name('identity.update');
});

// ================= ADMIN & STAFF PORTAL =================
Route::middleware(['auth', 'nocache', 'role:admin,staff'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [App\Http\Controllers\AdminPortalController::class, 'dashboard'])->name('dashboard');
    Route::post('/users/{user}/toggle', [App\Http\Controllers\AdminPortalController::class, 'toggleUserStatus'])->name('users.toggle');
    Route::post('/documents/{document}/verify', [App\Http\Controllers\AdminPortalController::class, 'verifyDocument'])->name('documents.verify');
    Route::post('/bookings/{booking}/verify', [App\Http\Controllers\AdminPortalController::class, 'verifyBooking'])->name('bookings.verify');
    Route::post('/bookings/{booking}/verify-payment', [App\Http\Controllers\AdminPortalController::class, 'verifyPayment'])->name('bookings.verify_payment');
    Route::post('/bookings/{booking}/archive', [App\Http\Controllers\AdminPortalController::class, 'archiveBooking'])->name('bookings.archive');
    Route::post('/bookings/{booking}/restore', [App\Http\Controllers\AdminPortalController::class, 'restoreBooking'])->name('bookings.restore');
    
    // Admin Password Change
    Route::post('/change-password', [App\Http\Controllers\AdminPortalController::class, 'changePassword'])->name('password.change');
    
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

    // Bill Records CRUD
    Route::post('/bill-records', [App\Http\Controllers\AdminPortalController::class, 'storeBillRecord'])->name('bill_records.store');
    Route::post('/bill-records/{billRecord}', [App\Http\Controllers\AdminPortalController::class, 'updateBillRecord'])->name('bill_records.update');
    Route::post('/bill-records/{billRecord}/destroy', [App\Http\Controllers\AdminPortalController::class, 'deleteBillRecord'])->name('bill_records.destroy');

    // Vehicle Profit Analytics API
    Route::get('/vehicle-analytics', [App\Http\Controllers\AdminPortalController::class, 'vehicleProfitAnalytics'])->name('vehicle_analytics.index');
    Route::post('/vehicle-expenses', [App\Http\Controllers\AdminPortalController::class, 'storeVehicleExpense'])->name('vehicle_expenses.store');
    Route::post('/vehicle-expenses/{vehicleExpense}/destroy', [App\Http\Controllers\AdminPortalController::class, 'destroyVehicleExpense'])->name('vehicle_expenses.destroy');

    // Vehicle Pickup & Return Inspection Routes
    Route::post('/inspections', [App\Http\Controllers\AdminPortalController::class, 'storeInspection'])->name('inspections.store');
    Route::post('/inspection-charges', [App\Http\Controllers\AdminPortalController::class, 'storeInspectionCharge'])->name('inspection_charges.store');
    Route::post('/inspection-charges/{inspectionCharge}/status', [App\Http\Controllers\AdminPortalController::class, 'updateInspectionChargeStatus'])->name('inspection_charges.status');

    // Price Breakdown & Adjustment Routes (Feature #7)
    Route::post('/bookings/{booking}/adjust-price', [App\Http\Controllers\AdminPortalController::class, 'adjustBookingPrice'])->name('bookings.adjust_price');
    Route::get('/bookings/{booking}/invoice', [App\Http\Controllers\AdminPortalController::class, 'getInvoice'])->name('bookings.invoice');

    // Site Settings Configurations
    Route::post('/settings', [App\Http\Controllers\AdminPortalController::class, 'updateSettings'])->name('settings.update');

    // Calendar & Maintenance Interval Routes
    Route::get('/calendar/feed', [App\Http\Controllers\CalendarController::class, 'adminFeed'])->name('calendar.admin_feed');
    Route::post('/unavailable-dates', [App\Http\Controllers\CalendarController::class, 'storeUnavailableDate'])->name('unavailable_dates.store');
    Route::post('/unavailable-dates/{unavailableDate}/destroy', [App\Http\Controllers\CalendarController::class, 'destroyUnavailableDate'])->name('unavailable_dates.destroy');
    Route::get('/reports/smart-insights-data', [App\Http\Controllers\CalendarController::class, 'smartInsights'])->name('reports.smart_insights_data');
});

// Public / Guest / Customer Calendar API
Route::get('/api/calendar/customer', [App\Http\Controllers\CalendarController::class, 'customerFeed'])->name('calendar.customer_feed');

// Direct Error Page Routes
Route::get('/error/403', function () {
    return Inertia::render('Errors/Error', ['status' => 403]);
})->name('error.403');

Route::get('/error/404', function () {
    return Inertia::render('Errors/Error', ['status' => 404]);
})->name('error.404');

// Fallback Route for unmatched paths (404 Page Not Found)
Route::fallback(function () {
    return Inertia::render('Errors/Error', ['status' => 404]);
});

// Standard Breeze Auth Routes
require __DIR__.'/auth.php';
