<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Document;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Promo;
use App\Models\ExtraGood;
use App\Models\BillRecord;
use App\Models\VehicleExpense;
use App\Models\VehicleInspection;
use App\Models\InspectionCharge;
use App\Models\BookingPriceHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class AdminPortalController extends Controller
{
    /**
     * View Admin & Staff Portal Dashboard.
     */
    public function dashboard()
    {
        $user = Auth::user();

        // Analytical summary stats
        $stats = [
            'total_bookings' => Booking::count(),
            'pending_bookings' => Booking::where('status', 'pending')->count(),
            'confirmed_bookings' => Booking::where('status', 'confirmed')->count(),
            'completed_bookings' => Booking::where('status', 'completed')->count(),
            'total_earnings' => Booking::where('status', 'completed')->sum('total_price'),
            'total_vehicles' => Vehicle::count(),
            'active_promos' => Promo::where('status', 'active')->count(),
            'pending_documents' => Document::where('status', 'pending')->count(),
        ];

        // Group completed bookings programmatically to support SQLite and MySQL identically
        $completedBookings = Booking::with('vehicle')
            ->where('status', 'completed')
            ->get();

        // 1. Monthly earnings mapping
        $monthlyMap = [];
        foreach ($completedBookings as $b) {
            $time = strtotime($b->start_datetime);
            if ($time) {
                $monthKey = date('Y-m', $time);
                $monthName = date('M Y', $time);
                if (!isset($monthlyMap[$monthKey])) {
                    $monthlyMap[$monthKey] = ['month' => $monthName, 'earnings' => 0];
                }
                $monthlyMap[$monthKey]['earnings'] += floatval($b->total_price);
            }
        }
        ksort($monthlyMap);
        $monthlyEarnings = array_values($monthlyMap);

        // 2. Category earnings mapping
        $categoryMap = [];
        foreach ($completedBookings as $b) {
            $type = $b->vehicle->type ?? 'Other';
            if (!isset($categoryMap[$type])) {
                $categoryMap[$type] = ['type' => $type, 'earnings' => 0, 'count' => 0];
            }
            $categoryMap[$type]['earnings'] += floatval($b->total_price);
            $categoryMap[$type]['count'] += 1;
        }
        $categoryEarnings = array_values($categoryMap);

        // 3. Top performing vehicles
        $vehiclesList = Vehicle::all();
        $vehicleStats = [];
        foreach ($vehiclesList as $v) {
            $vBookings = Booking::where('vehicle_id', $v->id)
                ->where('status', 'completed')
                ->get();
            $rev = $vBookings->sum('total_price');
            $cnt = $vBookings->count();
            if ($cnt > 0) {
                $vehicleStats[] = [
                    'name' => $v->name,
                    'type' => $v->type,
                    'bookings_count' => $cnt,
                    'revenue' => floatval($rev),
                ];
            }
        }
        usort($vehicleStats, function($a, $b) {
            return $b['revenue'] <=> $a['revenue'];
        });
        $topVehicles = array_slice($vehicleStats, 0, 5);

        // Retrieve active items with relationships
        $bookings = Booking::with(['user', 'vehicle', 'rating', 'inspections.inspector', 'inspectionCharges.creator', 'inspectionCharges.approver', 'priceHistories.changedBy'])
            ->whereNull('archived_at')
            ->orderBy('created_at', 'desc')
            ->get();

        $archivedBookings = Booking::with(['user', 'vehicle', 'rating', 'inspections.inspector', 'inspectionCharges.creator', 'inspectionCharges.approver', 'priceHistories.changedBy'])
            ->whereNotNull('archived_at')
            ->orderBy('archived_at', 'desc')
            ->get();

        $vehicles = Vehicle::orderBy('created_at', 'desc')->get();
        $promos = Promo::orderBy('created_at', 'desc')->get();
        $extraGoods = ExtraGood::orderBy('created_at', 'desc')->get();
        
        $documents = Document::with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        // Administrator role manages accounts
        $users = User::where('id', '!=', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $billRecords = BillRecord::orderBy('due_date', 'asc')->get();

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'monthlyEarnings' => $monthlyEarnings,
            'categoryEarnings' => $categoryEarnings,
            'topVehicles' => $topVehicles,
            'bookings' => $bookings,
            'archivedBookings' => $archivedBookings,
            'vehicles' => $vehicles,
            'promos' => $promos,
            'extraGoods' => $extraGoods,
            'documents' => $documents,
            'users' => $users,
            'billRecords' => $billRecords,
        ]);
    }

    /**
     * Enable/Disable user accounts (Admin Only).
     */
    public function toggleUserStatus(User $user)
    {
        // Guard check: Administrators resolve and manage security
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action. Only admins can modify account statuses.');
        }

        $newStatus = $user->status === 'active' ? 'deactivated' : 'active';
        $user->update(['status' => $newStatus]);

        return redirect()->route('admin.dashboard')->with('success', "User account status changed to {$newStatus}.");
    }

    /**
     * Approve or reject identity verifications.
     */
    public function verifyDocument(Request $request, Document $document)
    {
        $request->validate([
            'action' => 'required|in:verify,reject',
            'reject_reason' => 'nullable|required_if:action,reject|string|max:255',
        ]);

        if ($request->action === 'verify') {
            $document->update([
                'status' => 'verified',
                'reject_reason' => null,
                'verified_by' => Auth::id(),
                'verified_at' => now(),
            ]);
        } else {
            $document->update([
                'status' => 'rejected',
                'reject_reason' => $request->reject_reason,
                'verified_by' => Auth::id(),
                'verified_at' => now(),
            ]);
        }

        return redirect()->route('admin.dashboard')->with('success', 'Document verification processed.');
    }

    /**
     * Approve/Reject/Complete bookings.
     */
    public function verifyBooking(Request $request, Booking $booking)
    {
        $request->validate([
            'action' => 'required|in:confirm,reject,complete',
        ]);

        $statusMap = [
            'confirm' => 'confirmed',
            'reject' => 'rejected',
            'complete' => 'completed',
        ];

        $booking->update([
            'status' => $statusMap[$request->action],
        ]);

        return redirect()->route('admin.dashboard')->with('success', "Booking status marked as {$statusMap[$request->action]}.");
    }

    /**
     * Approve or update payment status of a booking.
     */
    public function verifyPayment(Request $request, Booking $booking)
    {
        $request->validate([
            'payment_status' => 'required|in:paid,unpaid,pending_verification,refunded',
        ]);

        $booking->update([
            'payment_status' => $request->payment_status,
        ]);

        return redirect()->route('admin.dashboard')->with('success', "Payment status updated to {$request->payment_status}.");
    }

    /*
     * ==========================================
     *            VEHICLE FLEET CRUD
     * ==========================================
     */
    public function storeVehicle(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'plate_number' => 'required|string|unique:vehicles,plate_number|max:20',
            'type' => 'required|string|max:50',
            'seats' => 'required|integer|min:2',
            'transmission' => 'required|in:Auto,Manual',
            'fuel_type' => 'required|string|max:50',
            'price_per_day' => 'required|numeric|min:0',
            'meetup_location' => 'required|string|max:255',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $imgUrl = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'; // Default placeholder

        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/vehicles'), $filename);
            $imgUrl = '/uploads/vehicles/' . $filename;
        }

        Vehicle::create([
            'name' => $request->name,
            'plate_number' => $request->plate_number,
            'type' => $request->type,
            'seats' => $request->seats,
            'transmission' => $request->transmission,
            'fuel_type' => $request->fuel_type,
            'price_per_day' => $request->price_per_day,
            'meetup_location' => $request->meetup_location,
            'description' => $request->description,
            'features' => $request->features ?: [],
            'images' => [$imgUrl],
            'status' => 'available',
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Vehicle fleet added successfully!');
    }

    public function updateVehicle(Request $request, Vehicle $vehicle)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'plate_number' => "required|string|max:20|unique:vehicles,plate_number,{$vehicle->id}",
            'type' => 'required|string|max:50',
            'seats' => 'required|integer|min:2',
            'transmission' => 'required|in:Auto,Manual',
            'fuel_type' => 'required|string|max:50',
            'price_per_day' => 'required|numeric|min:0',
            'meetup_location' => 'required|string|max:255',
            'description' => 'nullable|string',
            'features' => 'nullable|array',
            'status' => 'required|in:available,reserved,rented,maintenance,unavailable',
            'image_file' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $images = $vehicle->images ?: [];
        if ($request->hasFile('image_file')) {
            $file = $request->file('image_file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/vehicles'), $filename);
            $images = ['/uploads/vehicles/' . $filename];
        }

        $vehicle->update([
            'name' => $request->name,
            'plate_number' => $request->plate_number,
            'type' => $request->type,
            'seats' => $request->seats,
            'transmission' => $request->transmission,
            'fuel_type' => $request->fuel_type,
            'price_per_day' => $request->price_per_day,
            'meetup_location' => $request->meetup_location,
            'description' => $request->description,
            'features' => $request->features ?: [],
            'images' => $images,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Vehicle fleet updated successfully!');
    }

    public function deleteVehicle(Vehicle $vehicle)
    {
        $vehicle->delete();
        return redirect()->route('admin.dashboard')->with('success', 'Vehicle fleet deleted.');
    }

    /*
     * ==========================================
     *             CAMPAIGN PROMOS CRUD
     * ==========================================
     */
    public function storePromo(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'promo_code' => 'required|string|unique:promos,promo_code|max:50',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'discount_text' => 'required|string|max:100',
            'description' => 'required|string',
            'status' => 'required|in:active,expired',
            'promo_file' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $imgUrl = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800';

        if ($request->hasFile('promo_file')) {
            $file = $request->file('promo_file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/promos'), $filename);
            $imgUrl = '/uploads/promos/' . $filename;
        }

        Promo::create([
            'title' => $request->title,
            'promo_code' => strtoupper($request->promo_code),
            'discount_type' => $request->discount_type,
            'discount_value' => $request->discount_value,
            'discount_text' => $request->discount_text,
            'description' => $request->description,
            'image_url' => $imgUrl,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Promo created successfully!');
    }

    public function updatePromo(Request $request, Promo $promo)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'promo_code' => "required|string|max:50|unique:promos,promo_code,{$promo->id}",
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'discount_text' => 'required|string|max:100',
            'description' => 'required|string',
            'status' => 'required|in:active,expired',
            'promo_file' => 'nullable|image|mimes:jpeg,png,jpg|max:5120',
        ]);

        $imgUrl = $promo->image_url;
        if ($request->hasFile('promo_file')) {
            $file = $request->file('promo_file');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/promos'), $filename);
            $imgUrl = '/uploads/promos/' . $filename;
        }

        $promo->update([
            'title' => $request->title,
            'promo_code' => strtoupper($request->promo_code),
            'discount_type' => $request->discount_type,
            'discount_value' => $request->discount_value,
            'discount_text' => $request->discount_text,
            'description' => $request->description,
            'image_url' => $imgUrl,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Promo updated successfully!');
    }

    public function deletePromo(Promo $promo)
    {
        $promo->delete();
        return redirect()->route('admin.dashboard')->with('success', 'Promo campaign deleted.');
    }

    /*
     * ==========================================
     *             EXTRA GOODS CRUD
     * ==========================================
     */
    public function storeExtraGood(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price_per_day' => 'required|numeric|min:0',
            'description' => 'required|string',
        ]);

        ExtraGood::create([
            'name' => $request->name,
            'price_per_day' => $request->price_per_day,
            'description' => $request->description,
            'status' => 'available',
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Extra good accessory registered!');
    }

    public function updateExtraGood(Request $request, ExtraGood $extraGood)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'price_per_day' => 'required|numeric|min:0',
            'description' => 'required|string',
            'status' => 'required|in:available,unavailable',
        ]);

        $extraGood->update([
            'name' => $request->name,
            'price_per_day' => $request->price_per_day,
            'description' => $request->description,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Extra good updated!');
    }

    public function deleteExtraGood(ExtraGood $extraGood)
    {
        $extraGood->delete();
        return redirect()->route('admin.dashboard')->with('success', 'Extra good deleted.');
    }

    public function updateSettings(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            abort(403, 'Unauthorized action. Only admins can update site settings.');
        }

        $request->validate([
            'site_logo' => 'required|string|max:50',
            'home_hero_title' => 'required|string|max:255',
            'home_hero_subtitle' => 'required|string|max:500',
            'contact_email' => 'required|email|max:100',
            'contact_phone' => 'required|string|max:50',
            'site_logo_image_file' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
        ]);

        foreach ($request->only(['site_logo', 'home_hero_title', 'home_hero_subtitle', 'contact_email', 'contact_phone']) as $key => $value) {
            \App\Models\Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        if ($request->boolean('clear_logo_image')) {
            \App\Models\Setting::where('key', 'site_logo_image')->delete();
        } elseif ($request->hasFile('site_logo_image_file')) {
            $file = $request->file('site_logo_image_file');
            $filename = 'logo_' . time() . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/branding');

            if (!file_exists($destinationPath)) {
                mkdir($destinationPath, 0755, true);
            }

            $file->move($destinationPath, $filename);
            $logoUrl = '/uploads/branding/' . $filename;

            \App\Models\Setting::updateOrCreate(['key' => 'site_logo_image'], ['value' => $logoUrl]);
        }

        return redirect()->route('admin.dashboard')->with('success', 'Site settings updated successfully!');
    }

    /**
     * Archive a booking record.
     */
    public function archiveBooking(Booking $booking)
    {
        $booking->update([
            'archived_at' => now(),
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Booking record archived.');
    }

    /**
     * Restore an archived booking record.
     */
    public function restoreBooking(Booking $booking)
    {
        $booking->update([
            'archived_at' => null,
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Booking record restored to active list.');
    }

    /**
     * Update administrator account password.
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'The provided current password does not match our records.']);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Administrator password updated successfully!');
    }

    /*
     * ==========================================
     *             BILL RECORDS CRUD
     * ==========================================
     */
    public function storeBillRecord(Request $request)
    {
        $request->validate([
            'biller_name' => 'required|string|max:255',
            'bill_category' => 'required|string|max:100',
            'account_number' => 'nullable|string|max:100',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'payment_date' => 'nullable|date',
            'status' => 'required|in:pending,paid,overdue,cancelled',
            'notes' => 'nullable|string',
        ]);

        BillRecord::create([
            'biller_name' => $request->biller_name,
            'bill_category' => $request->bill_category,
            'account_number' => $request->account_number,
            'amount' => $request->amount,
            'due_date' => $request->due_date,
            'payment_date' => $request->payment_date,
            'status' => $request->status,
            'notes' => $request->notes,
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Bill record added successfully!');
    }

    public function updateBillRecord(Request $request, BillRecord $billRecord)
    {
        $request->validate([
            'biller_name' => 'required|string|max:255',
            'bill_category' => 'required|string|max:100',
            'account_number' => 'nullable|string|max:100',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'payment_date' => 'nullable|date',
            'status' => 'required|in:pending,paid,overdue,cancelled',
            'notes' => 'nullable|string',
        ]);

        $billRecord->update([
            'biller_name' => $request->biller_name,
            'bill_category' => $request->bill_category,
            'account_number' => $request->account_number,
            'amount' => $request->amount,
            'due_date' => $request->due_date,
            'payment_date' => $request->payment_date,
            'status' => $request->status,
            'notes' => $request->notes,
        ]);

        return redirect()->route('admin.dashboard')->with('success', 'Bill record updated successfully!');
    }

    public function deleteBillRecord(BillRecord $billRecord)
    {
        $billRecord->delete();
        return redirect()->route('admin.dashboard')->with('success', 'Bill record deleted.');
    }

    /**
     * Per-Vehicle Revenue & Profit Analytics (JSON endpoint for filtered requests).
     */
    public function vehicleProfitAnalytics(Request $request)
    {
        $dateFrom = $request->input('date_from');
        $dateTo   = $request->input('date_to');
        $vehicleId = $request->input('vehicle_id');

        $vehicleQuery = Vehicle::with(['expenses'])->orderBy('name');
        if ($vehicleId) {
            $vehicleQuery->where('id', $vehicleId);
        }
        $vehicles = $vehicleQuery->get();

        $analytics = $vehicles->map(function ($vehicle) use ($dateFrom, $dateTo) {
            $bookingQuery = Booking::where('vehicle_id', $vehicle->id)
                ->where('status', 'completed');

            if ($dateFrom) {
                $bookingQuery->whereDate('start_datetime', '>=', $dateFrom);
            }
            if ($dateTo) {
                $bookingQuery->whereDate('start_datetime', '<=', $dateTo);
            }

            $completedBookings = $bookingQuery->get();

            $rentalRevenue      = $completedBookings->sum('original_price') ?: $completedBookings->sum('total_price');
            $locationFeeTotal   = $completedBookings->sum('location_fee');
            $discountGiven      = $completedBookings->sum('discount_amount');
            $grossRevenue       = $completedBookings->sum('total_price');
            $completedCount     = $completedBookings->count();

            $expenseQuery = $vehicle->expenses();
            if ($dateFrom) {
                $expenseQuery->whereDate('expense_date', '>=', $dateFrom);
            }
            if ($dateTo) {
                $expenseQuery->whereDate('expense_date', '<=', $dateTo);
            }
            $expenses     = $expenseQuery->get();
            $totalExpenses = $expenses->sum('amount');

            $purchaseCost = floatval($vehicle->purchase_cost ?? 0);
            $netProfit    = floatval($grossRevenue) - floatval($totalExpenses);

            $breakEvenStatus = 'in_progress';
            if ($purchaseCost > 0) {
                if ($netProfit >= $purchaseCost) {
                    $breakEvenStatus = 'reached';
                } elseif ($netProfit < 0) {
                    $breakEvenStatus = 'loss';
                }
            } elseif ($netProfit >= 0) {
                $breakEvenStatus = 'profitable';
            } else {
                $breakEvenStatus = 'loss';
            }

            return [
                'id'                  => $vehicle->id,
                'name'                => $vehicle->name,
                'plate_number'        => $vehicle->plate_number,
                'type'                => $vehicle->type,
                'status'              => $vehicle->status,
                'purchase_cost'       => $purchaseCost,
                'price_per_day'       => floatval($vehicle->price_per_day),
                'completed_rentals'   => $completedCount,
                'rental_revenue'      => floatval($rentalRevenue),
                'location_fee_total'  => floatval($locationFeeTotal),
                'discount_given'      => floatval($discountGiven),
                'gross_revenue'       => floatval($grossRevenue),
                'total_expenses'      => floatval($totalExpenses),
                'net_profit'          => $netProfit,
                'break_even_status'   => $breakEvenStatus,
                'expenses'            => $expenses->map(fn($e) => [
                    'id'           => $e->id,
                    'expense_type' => $e->expense_type,
                    'amount'       => floatval($e->amount),
                    'description'  => $e->description,
                    'expense_date' => $e->expense_date?->format('Y-m-d'),
                ]),
            ];
        });

        return response()->json(['analytics' => $analytics]);
    }

    /**
     * Store a new vehicle expense record.
     */
    public function storeVehicleExpense(Request $request)
    {
        $request->validate([
            'vehicle_id'   => 'required|exists:vehicles,id',
            'expense_type' => 'required|in:maintenance,repair,other',
            'amount'       => 'required|numeric|min:0',
            'description'  => 'nullable|string|max:255',
            'expense_date' => 'required|date',
        ]);

        VehicleExpense::create([
            'vehicle_id'   => $request->vehicle_id,
            'expense_type' => $request->expense_type,
            'amount'       => $request->amount,
            'description'  => $request->description,
            'expense_date' => $request->expense_date,
        ]);

        return response()->json(['success' => true, 'message' => 'Expense recorded successfully.']);
    }

    /**
     * Delete a vehicle expense record.
     */
    public function destroyVehicleExpense(VehicleExpense $vehicleExpense)
    {
        $vehicleExpense->delete();
        return response()->json(['success' => true, 'message' => 'Expense deleted.']);
    }

    /**
     * Store Vehicle Pickup or Return Inspection
     */
    public function storeInspection(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'type' => 'required|in:pickup,return',
            'fuel_bars' => 'required|integer|min:0|max:8',
            'odometer_reading' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'photos.*' => 'nullable|image|max:10240', // 10MB max per photo
        ]);

        $booking = Booking::findOrFail($request->booking_id);

        $photoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $path = $file->store('inspections', 'public');
                $photoPaths[] = $path;
            }
        }

        $inspection = VehicleInspection::create([
            'booking_id' => $booking->id,
            'vehicle_id' => $booking->vehicle_id,
            'inspector_id' => Auth::id(),
            'type' => $request->type,
            'fuel_bars' => $request->fuel_bars,
            'odometer_reading' => $request->odometer_reading,
            'notes' => $request->notes,
            'photos' => $photoPaths,
            'inspected_at' => now(),
        ]);

        return redirect()->back()->with('success', ucfirst($request->type) . ' inspection record saved successfully!');
    }

    /**
     * Store Additional Charge Proposal
     */
    public function storeInspectionCharge(Request $request)
    {
        $request->validate([
            'booking_id' => 'required|exists:bookings,id',
            'inspection_id' => 'nullable|exists:vehicle_inspections,id',
            'charge_type' => 'required|string|in:damage,fuel_deficit,cleaning,late_return,other',
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'evidence_photos.*' => 'nullable|image|max:10240',
        ]);

        $evidencePaths = [];
        if ($request->hasFile('evidence_photos')) {
            foreach ($request->file('evidence_photos') as $file) {
                $path = $file->store('inspection_charges', 'public');
                $evidencePaths[] = $path;
            }
        }

        InspectionCharge::create([
            'booking_id' => $request->booking_id,
            'inspection_id' => $request->inspection_id,
            'created_by' => Auth::id(),
            'charge_type' => $request->charge_type,
            'description' => $request->description,
            'amount' => $request->amount,
            'evidence_photos' => $evidencePaths,
            'status' => 'proposed',
        ]);

        return redirect()->back()->with('success', 'Additional charge proposal submitted!');
    }

    /**
     * Approve, Reject, or Mark Paid an Inspection Charge
     */
    public function updateInspectionChargeStatus(Request $request, InspectionCharge $inspectionCharge)
    {
        $request->validate([
            'status' => 'required|in:proposed,approved,rejected,paid',
        ]);

        $data = ['status' => $request->status];
        if (in_array($request->status, ['approved', 'rejected'])) {
            $data['approved_by'] = Auth::id();
        }

        $inspectionCharge->update($data);

        return redirect()->back()->with('success', 'Charge status updated to ' . ucfirst($request->status));
    }

    /**
     * Adjust Booking Price & Log Audit Trail (Feature #7)
     */
    public function adjustBookingPrice(Request $request, Booking $booking)
    {
        $request->validate([
            'new_total' => 'required|numeric|min:0',
            'security_deposit' => 'nullable|numeric|min:0',
            'amount_paid' => 'nullable|numeric|min:0',
            'reason' => 'required|string|max:255',
        ]);

        $previousTotal = floatval($booking->total_price);
        $newTotal = floatval($request->new_total);
        $changeAmount = $newTotal - $previousTotal;

        // Create Price History Audit Trail Record
        BookingPriceHistory::create([
            'booking_id' => $booking->id,
            'changed_by_id' => Auth::id(),
            'previous_total' => $previousTotal,
            'new_total' => $newTotal,
            'change_amount' => $changeAmount,
            'reason' => $request->reason,
            'breakdown_snapshot' => [
                'original_price' => floatval($booking->original_price),
                'location_fee' => floatval($booking->location_fee),
                'discount_amount' => floatval($booking->discount_amount),
                'security_deposit' => floatval($request->input('security_deposit', $booking->security_deposit ?? 0)),
                'amount_paid' => floatval($request->input('amount_paid', $booking->amount_paid ?? 0)),
                'approved_charges' => $booking->inspectionCharges()->where('status', 'approved')->sum('amount'),
            ],
        ]);

        // Update Booking Total and Paid amounts
        $booking->update([
            'total_price' => $newTotal,
            'security_deposit' => floatval($request->input('security_deposit', $booking->security_deposit ?? 0)),
            'amount_paid' => floatval($request->input('amount_paid', $booking->amount_paid ?? 0)),
            'payment_status' => (floatval($request->input('amount_paid', $booking->amount_paid)) >= $newTotal) ? 'paid' : 'partial',
        ]);

        return redirect()->back()->with('success', 'Booking price updated and audit log saved.');
    }

    /**
     * Generate Printable Invoice / Statement View (Feature #7)
     */
    public function getInvoice(Booking $booking)
    {
        $booking->load(['user', 'vehicle', 'inspections', 'inspectionCharges', 'priceHistories.changedBy']);

        return view('invoice', compact('booking'));
    }
}

