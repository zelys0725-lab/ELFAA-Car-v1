<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vehicle;
use App\Models\VehicleGpsLog;
use App\Models\Setting;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

class GpsTrackerController extends Controller
{
    /**
     * Ensure GPS schema exists safely in database before query execution.
     */
    public static function ensureSchema(): void
    {
        if (!Schema::hasColumn('vehicles', 'gps_enabled')) {
            Schema::table('vehicles', function (Blueprint $table) {
                if (!Schema::hasColumn('vehicles', 'gps_enabled')) $table->boolean('gps_enabled')->default(false)->after('status');
                if (!Schema::hasColumn('vehicles', 'gps_device_id')) $table->string('gps_device_id')->nullable()->unique()->after('gps_enabled');
                if (!Schema::hasColumn('vehicles', 'gps_tracker_key')) $table->string('gps_tracker_key', 64)->nullable()->unique()->after('gps_device_id');
                if (!Schema::hasColumn('vehicles', 'last_latitude')) $table->decimal('last_latitude', 10, 7)->nullable()->after('gps_tracker_key');
                if (!Schema::hasColumn('vehicles', 'last_longitude')) $table->decimal('last_longitude', 10, 7)->nullable()->after('last_latitude');
                if (!Schema::hasColumn('vehicles', 'current_speed')) $table->decimal('current_speed', 5, 2)->default(0)->after('last_longitude');
                if (!Schema::hasColumn('vehicles', 'last_gps_updated_at')) $table->timestamp('last_gps_updated_at')->nullable()->after('current_speed');
            });
        }

        if (!Schema::hasTable('vehicle_gps_logs')) {
            Schema::create('vehicle_gps_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
                $table->decimal('latitude', 10, 7);
                $table->decimal('longitude', 10, 7);
                $table->decimal('speed', 5, 2)->default(0);
                $table->decimal('heading', 5, 2)->nullable();
                $table->timestamp('recorded_at')->useCurrent();
                $table->timestamps();

                $table->index(['vehicle_id', 'recorded_at']);
            });
        }
    }

    /**
     * Ingest location pings from the mobile phone web transmitter.
     */
    public function recordPing(Request $request)
    {
        $this->ensureSchema();

        $trackerKey = $request->input('tracker_key');
        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');
        $speed = $request->input('speed', 0);
        $heading = $request->input('heading', null);

        if (!$trackerKey || !is_numeric($latitude) || !is_numeric($longitude)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Missing required tracker_key, latitude, or longitude.',
            ], 422);
        }

        $vehicle = Vehicle::where('gps_tracker_key', $trackerKey)
            ->where('gps_enabled', true)
            ->first();

        if (!$vehicle) {
            return response()->json([
                'status' => 'error',
                'message' => 'Vehicle not found or GPS tracking is currently disabled.',
            ], 403);
        }

        $now = Carbon::now();

        // 1. Update Current Vehicle Location
        $vehicle->update([
            'last_latitude'       => $latitude,
            'last_longitude'      => $longitude,
            'current_speed'       => $speed,
            'last_gps_updated_at' => $now,
        ]);

        // 2. Append to Route History
        VehicleGpsLog::create([
            'vehicle_id'  => $vehicle->id,
            'latitude'    => $latitude,
            'longitude'   => $longitude,
            'speed'       => $speed,
            'heading'     => $heading,
            'recorded_at' => $now,
        ]);

        return response()->json([
            'status'     => 'success',
            'vehicle'    => [
                'id'           => $vehicle->id,
                'name'         => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
            ],
            'timestamp'  => $now->toIso8601String(),
        ]);
    }

    /**
     * Support Traccar Client Open-Source Phone App (HTTP GET or POST protocol).
     * e.g., /api/gps/traccar?id=ELFAA-01&lat=14.5995&lon=120.9842&speed=25.5&bearing=180
     */
    public function recordTraccar(Request $request)
    {
        $this->ensureSchema();

        $deviceId = $request->input('id');
        $latitude = $request->input('lat');
        $longitude = $request->input('lon');
        $speedKnots = $request->input('speed', 0);
        $speedKph = (float) $speedKnots * 1.852; // Traccar sends speed in knots
        $bearing = $request->input('bearing', null);

        if (!$deviceId || !is_numeric($latitude) || !is_numeric($longitude)) {
            return response()->json(['status' => 'error', 'message' => 'Invalid parameters'], 400);
        }

        $vehicle = Vehicle::where('gps_device_id', $deviceId)
            ->where('gps_enabled', true)
            ->first();

        if (!$vehicle) {
            return response()->json(['status' => 'error', 'message' => 'Device ID not recognized'], 404);
        }

        $now = Carbon::now();

        $vehicle->update([
            'last_latitude'       => $latitude,
            'last_longitude'      => $longitude,
            'current_speed'       => $speedKph,
            'last_gps_updated_at' => $now,
        ]);

        VehicleGpsLog::create([
            'vehicle_id'  => $vehicle->id,
            'latitude'    => $latitude,
            'longitude'   => $longitude,
            'speed'       => $speedKph,
            'heading'     => $bearing,
            'recorded_at' => $now,
        ]);

        return response('OK', 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Mobile Phone Web Transmitter Page.
     * Open this on any smartphone to turn it into an active vehicle GPS transmitter.
     */
    public function renderTransmitter(Request $request, $key)
    {
        $this->ensureSchema();

        $vehicle = Vehicle::where('gps_tracker_key', $key)->first();

        if (!$vehicle) {
            return Inertia::render('Errors/Error', [
                'status' => 404,
                'message' => 'Invalid Vehicle GPS Transmitter link. Please verify with the administrator.',
            ]);
        }

        $activeBooking = $vehicle->bookings()
            ->whereIn('status', ['confirmed', 'active'])
            ->with('user:id,name,phone')
            ->latest()
            ->first();

        return Inertia::render('Gps/Transmitter', [
            'vehicle' => [
                'id'                  => $vehicle->id,
                'name'                => $vehicle->name,
                'plate_number'        => $vehicle->plate_number,
                'type'                => $vehicle->type,
                'gps_enabled'         => (bool) $vehicle->gps_enabled,
                'gps_device_id'       => $vehicle->gps_device_id,
                'gps_tracker_key'     => $vehicle->gps_tracker_key,
                'last_latitude'       => $vehicle->last_latitude,
                'last_longitude'      => $vehicle->last_longitude,
                'current_speed'       => $vehicle->current_speed,
                'last_gps_updated_at' => $vehicle->last_gps_updated_at ? $vehicle->last_gps_updated_at->toIso8601String() : null,
            ],
            'activeBooking' => $activeBooking ? [
                'id'         => $activeBooking->id,
                'renter'     => $activeBooking->user ? $activeBooking->user->name : 'N/A',
                'start_date' => $activeBooking->start_date,
                'end_date'   => $activeBooking->end_date,
            ] : null,
        ]);
    }

    /**
     * Admin Live Fleet Feed API.
     */
    public function liveFleet()
    {
        $this->ensureSchema();

        $vehicles = Vehicle::where('gps_enabled', true)
            ->with(['bookings' => function ($q) {
                $q->whereIn('status', ['confirmed', 'active'])->with('user:id,name,phone')->latest();
            }])
            ->get()
            ->map(function ($v) {
                $lastPing = $v->last_gps_updated_at ? Carbon::parse($v->last_gps_updated_at) : null;
                $diffMinutes = $lastPing ? $lastPing->diffInMinutes(now()) : 9999;

                $status = 'offline';
                if ($diffMinutes <= 2) {
                    $status = (float) $v->current_speed > 3 ? 'moving' : 'idle';
                } elseif ($diffMinutes <= 10) {
                    $status = 'idle';
                }

                $activeBooking = $v->bookings->first();

                return [
                    'id'                  => $v->id,
                    'name'                => $v->name,
                    'plate_number'        => $v->plate_number,
                    'type'                => $v->type,
                    'gps_device_id'       => $v->gps_device_id,
                    'gps_tracker_key'     => $v->gps_tracker_key,
                    'latitude'            => $v->last_latitude ? (float) $v->last_latitude : null,
                    'longitude'           => $v->last_longitude ? (float) $v->last_longitude : null,
                    'speed'               => (float) $v->current_speed,
                    'status'              => $status,
                    'last_updated'        => $v->last_gps_updated_at ? $v->last_gps_updated_at->diffForHumans() : 'Never',
                    'last_updated_raw'    => $v->last_gps_updated_at ? $v->last_gps_updated_at->toIso8601String() : null,
                    'active_renter'       => $activeBooking && $activeBooking->user ? $activeBooking->user->name : null,
                    'booking_id'          => $activeBooking ? $activeBooking->id : null,
                ];
            });

        return response()->json([
            'vehicles' => $vehicles,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get Route History Breadcrumbs for a vehicle (Past 24 hours or custom date).
     */
    public function routeHistory($vehicleId)
    {
        $this->ensureSchema();

        $vehicle = Vehicle::findOrFail($vehicleId);

        $logs = VehicleGpsLog::where('vehicle_id', $vehicle->id)
            ->where('recorded_at', '>=', now()->subHours(24))
            ->orderBy('recorded_at', 'asc')
            ->limit(500)
            ->get()
            ->map(function ($log) {
                return [
                    'lat'   => (float) $log->latitude,
                    'lng'   => (float) $log->longitude,
                    'speed' => (float) $log->speed,
                    'time'  => $log->recorded_at->format('h:i:s A'),
                ];
            });

        return response()->json([
            'vehicle' => [
                'id'           => $vehicle->id,
                'name'         => $vehicle->name,
                'plate_number' => $vehicle->plate_number,
            ],
            'coordinates' => $logs,
        ]);
    }

    /**
     * Admin: Enable/Disable GPS and generate Device ID & Tracker Key.
     */
    public function updateConfig(Request $request, $vehicleId)
    {
        $this->ensureSchema();

        $vehicle = Vehicle::findOrFail($vehicleId);

        $validated = $request->validate([
            'gps_enabled'   => 'required|boolean',
            'gps_device_id' => 'nullable|string|max:64',
        ]);

        $trackerKey = $vehicle->gps_tracker_key;
        if (!$trackerKey) {
            $trackerKey = Str::random(32);
        }

        $deviceId = $validated['gps_device_id'] ?: ($vehicle->gps_device_id ?: 'ELFAA-GPS-' . str_pad($vehicle->id, 3, '0', STR_PAD_LEFT));

        $vehicle->update([
            'gps_enabled'     => $validated['gps_enabled'],
            'gps_device_id'   => $deviceId,
            'gps_tracker_key' => $trackerKey,
        ]);

        return redirect()->back()->with('success', "GPS configuration updated for {$vehicle->name}.");
    }
}
