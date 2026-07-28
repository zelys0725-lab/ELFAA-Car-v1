<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Document;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\Promo;
use App\Models\ExtraGood;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Retrieve items with relationships
        $bookings = Booking::with(['user', 'vehicle', 'rating'])
            ->orderBy('created_at', 'desc')
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

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'monthlyEarnings' => $monthlyEarnings,
            'categoryEarnings' => $categoryEarnings,
            'topVehicles' => $topVehicles,
            'bookings' => $bookings,
            'vehicles' => $vehicles,
            'promos' => $promos,
            'extraGoods' => $extraGoods,
            'documents' => $documents,
            'users' => $users,
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
            'status' => 'required|in:available,maintenance,unavailable',
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
}
