<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Document;
use App\Models\Rating;
use App\Models\Vehicle;
use App\Models\ExtraGood;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ClientPortalController extends Controller
{
    /**
     * Display the customer/client portal workspace.
     */
    public function dashboard(Request $request)
    {
        $user = Auth::user();

        // Feed data to renter workspace
        $bookings = Booking::where('user_id', $user->id)
            ->with(['vehicle', 'rating'])
            ->orderBy('created_at', 'desc')
            ->get();

        $vehicles = Vehicle::whereIn('status', ['available', 'rented', 'reserved'])->get();
        $documents = Document::where('user_id', $user->id)->get();
        $addOns = ExtraGood::where('status', 'available')->get();
        $promos = \App\Models\Promo::where('status', 'active')->get();

        return Inertia::render('Client/Dashboard', [
            'bookings' => $bookings,
            'vehicles' => $vehicles,
            'documents' => $documents,
            'addOns' => $addOns,
            'promos' => $promos,
            'selectedVehicleId' => $request->query('select_vehicle'),
        ]);
    }

    /**
     * Submit a new booking request.
     */
    public function storeBooking(Request $request)
    {
        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'start_datetime' => 'required|date',
            'end_datetime' => 'required|date|after:start_datetime',
            'pickup_location' => 'required|string|max:255',
            'dropoff_location' => 'nullable|string|max:255',
            'payment_method' => 'required|in:cash,online',
            'promo_code' => 'nullable|string|exists:promos,promo_code',
            'custom_location_fee' => 'nullable|numeric|min:0',
        ]);

        $vehicleId = $request->vehicle_id;
        $start = $request->start_datetime;
        $end = $request->end_datetime;

        $availabilityService = app(\App\Services\VehicleAvailabilityService::class);
        $vehicle = Vehicle::findOrFail($vehicleId);

        // Transaction & Double Booking Guard
        $isAvailable = DB::transaction(function () use ($availabilityService, $vehicle, $start, $end) {
            return $availabilityService->isAvailable($vehicle, $start, $end);
        });

        if (! $isAvailable) {
            return back()->withErrors([
                'start_datetime' => 'This vehicle is not available for the selected dates.',
            ]);
        }

        // Calculate pricing
        $vehicle = Vehicle::findOrFail($vehicleId);
        $startCarbon = Carbon::parse($start);
        $endCarbon = Carbon::parse($end);
        
        $hours = $startCarbon->diffInHours($endCarbon);
        $days = max(1, ceil($hours / 24));
        $originalPrice = $days * $vehicle->price_per_day;

        // Location Pricing & Out-of-Bounds Fee Calculation
        $pickupLoc = trim($request->pickup_location);
        $dropoffLoc = trim($request->dropoff_location ?: $pickupLoc);
        $isOutOfBounds = false;
        $locationFee = 0.00;

        $standardHubs = [
            'Main Garage / HQ (Mercedes Homes Padre Pio, Sto. Tomas)',
            'SM City Santo Tomas',
            'Victory Mall Tanauan',
            'SM City Calamba'
        ];

        if (!in_array($pickupLoc, $standardHubs)) {
            $isOutOfBounds = true;
            $locationFee += 500.00;
        }

        if ($dropoffLoc !== $pickupLoc) {
            $locationFee += 300.00;
            if (!in_array($dropoffLoc, $standardHubs)) {
                $isOutOfBounds = true;
            }
        }

        if ($request->filled('custom_location_fee') && is_numeric($request->custom_location_fee)) {
            $locationFee = (float)$request->custom_location_fee;
            if ($locationFee > 0) {
                $isOutOfBounds = true;
            }
        }

        // Promo Calculations
        $discountAmount = 0.00;
        $promoCode = $request->promo_code;

        if ($promoCode) {
            $promo = \App\Models\Promo::where('promo_code', $promoCode)
                ->where('status', 'active')
                ->first();

            if ($promo) {
                if ($promo->discount_type === 'percentage') {
                    $discountAmount = ($promo->discount_value / 100.00) * $originalPrice;
                } else {
                    $discountAmount = $promo->discount_value;
                }
                $discountAmount = min($discountAmount, $originalPrice + $locationFee);
            }
        }

        $totalPrice = max(0, $originalPrice + $locationFee - $discountAmount);

        // Create booking
        $paymentStatus = $request->payment_method === 'online' ? 'pending_verification' : 'unpaid';

        $booking = Booking::create([
            'user_id' => Auth::id(),
            'vehicle_id' => $vehicleId,
            'start_datetime' => $startCarbon,
            'end_datetime' => $endCarbon,
            'pickup_location' => $pickupLoc,
            'dropoff_location' => $dropoffLoc,
            'original_price' => $originalPrice,
            'location_fee' => $locationFee,
            'is_out_of_bounds' => $isOutOfBounds,
            'promo_code' => $promoCode,
            'discount_amount' => $discountAmount,
            'total_price' => $totalPrice,
            'payment_method' => $request->payment_method,
            'payment_status' => $paymentStatus,
            'payment_reference' => $request->payment_reference,
            'status' => 'pending',
        ]);

        if ($request->hasFile('payment_proof')) {
            $file = $request->file('payment_proof');
            $filename = 'pay_' . $booking->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/payments');
            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }
            $file->move($destinationPath, $filename);
            $booking->update([
                'payment_proof_path' => '/uploads/payments/' . $filename,
            ]);
        }

        return redirect()->route('client.dashboard')->with('success', 'Your reservation request was submitted successfully!');
    }

    /**
     * Upload or update payment proof for a booking.
     */
    public function uploadPaymentProof(Request $request, Booking $booking)
    {
        if ($booking->user_id !== Auth::id()) {
            abort(403);
        }

        $request->validate([
            'payment_reference' => 'nullable|string|max:100',
            'payment_proof' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120',
        ]);

        $file = $request->file('payment_proof');
        $filename = 'pay_' . $booking->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $destinationPath = public_path('uploads/payments');
        if (!file_exists($destinationPath)) {
            mkdir($destinationPath, 0755, true);
        }
        $file->move($destinationPath, $filename);

        $booking->update([
            'payment_reference' => $request->payment_reference ?: $booking->payment_reference,
            'payment_proof_path' => '/uploads/payments/' . $filename,
            'payment_status' => 'pending_verification',
        ]);

        return back()->with('success', 'Payment proof uploaded successfully.');
    }

    /**
     * Upload account verification documents.
     */
    public function storeDocument(Request $request)
    {
        $request->validate([
            'type' => 'required|in:gov_id_1,gov_id_2,proof_of_billing,proof_of_billing_electricity,proof_of_billing_water,proof_of_billing_internet,proof_of_billing_other',
            'file' => 'required|file|mimes:jpeg,png,jpg,pdf|max:5120', // 5MB limit
        ]);

        $user = Auth::user();

        // Handle file storage to public/uploads/documents/ for absolute browser viewing paths
        $file = $request->file('file');
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        
        // Ensure path exists
        $uploadPath = public_path('uploads/documents');
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }

        $file->move($uploadPath, $filename);
        $filePath = '/uploads/documents/' . $filename;

        // Save to Database (update if type already exists for clean records)
        Document::updateOrCreate(
            [
                'user_id' => $user->id,
                'type' => $request->type,
            ],
            [
                'file_path' => $filePath,
                'status' => 'pending',
                'reject_reason' => null,
                'verified_by' => null,
                'verified_at' => null,
            ]
        );

        return redirect()->route('client.dashboard')->with('success', 'Document uploaded successfully and is pending review.');
    }

    /**
     * Cancel an active pending booking.
     */
    public function cancelBooking(Booking $booking)
    {
        // Guard check
        if ($booking->user_id !== Auth::id()) {
            abort(403);
        }

        if ($booking->status !== 'pending') {
            return back()->withErrors(['status' => 'Only pending bookings can be cancelled.']);
        }

        $booking->update([
            'status' => 'cancelled',
        ]);

        return redirect()->route('client.dashboard')->with('success', 'Booking reservation cancelled successfully.');
    }

    /**
     * Submit a rating/review for a completed trip.
     */
    public function storeRating(Request $request, Booking $booking)
    {
        // Guard check
        if ($booking->user_id !== Auth::id()) {
            abort(403);
        }

        if ($booking->status !== 'completed') {
            return back()->withErrors(['status' => 'You can only leave reviews on completed bookings.']);
        }

        $request->validate([
            'stars' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        Rating::updateOrCreate(
            [
                'booking_id' => $booking->id,
            ],
            [
                'user_id' => Auth::id(),
                'vehicle_id' => $booking->vehicle_id,
                'stars' => $request->stars,
                'comment' => $request->comment,
            ]
        );

        return redirect()->route('client.dashboard')->with('success', 'Thank you for your rating review!');
    }

    /**
     * Update customer identity credentials (driver's license & government ID numbers).
     */
    public function updateIdentityDetails(Request $request)
    {
        $request->validate([
            'drivers_license_number' => 'nullable|string|max:50',
            'id_number' => 'nullable|string|max:50',
            'id_type' => 'nullable|string|max:50',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $user->update([
            'drivers_license_number' => $request->drivers_license_number,
            'id_number' => $request->id_number,
            'id_type' => $request->id_type,
        ]);

        return redirect()->route('client.dashboard')->with('success', 'Identity information updated successfully.');
    }
}
