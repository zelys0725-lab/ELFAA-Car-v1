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

        $vehicles = Vehicle::where('status', 'available')->get();
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
            'start_datetime' => 'required|date|after_or_equal:now',
            'end_datetime' => 'required|date|after:start_datetime',
            'pickup_location' => 'required|string|max:255',
            'payment_method' => 'required|in:cod,online',
            'promo_code' => 'nullable|string|exists:promos,promo_code',
        ]);

        $vehicleId = $request->vehicle_id;
        $start = $request->start_datetime;
        $end = $request->end_datetime;

        // Check availability
        if (!AvailabilityService::isAvailable($vehicleId, $start, $end)) {
            return back()->withErrors([
                'start_datetime' => 'The selected vehicle is not available for this date range.',
            ]);
        }

        // Calculate pricing
        $vehicle = Vehicle::findOrFail($vehicleId);
        $startCarbon = Carbon::parse($start);
        $endCarbon = Carbon::parse($end);
        
        $hours = $startCarbon->diffInHours($endCarbon);
        $days = max(1, ceil($hours / 24));
        $originalPrice = $days * $vehicle->price_per_day;

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
                // Cap the discount to avoid negative totals
                $discountAmount = min($discountAmount, $originalPrice);
            }
        }

        $totalPrice = $originalPrice - $discountAmount;

        // Create booking
        Booking::create([
            'user_id' => Auth::id(),
            'vehicle_id' => $vehicleId,
            'start_datetime' => $startCarbon,
            'end_datetime' => $endCarbon,
            'pickup_location' => $request->pickup_location,
            'original_price' => $originalPrice,
            'promo_code' => $promoCode,
            'discount_amount' => $discountAmount,
            'total_price' => $totalPrice,
            'payment_method' => $request->payment_method,
            'status' => 'pending',
        ]);

        return redirect()->route('client.dashboard')->with('success', 'Your reservation request was submitted successfully!');
    }

    /**
     * Upload account verification documents.
     */
    public function storeDocument(Request $request)
    {
        $request->validate([
            'type' => 'required|in:gov_id_1,gov_id_2,proof_of_billing',
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
}
