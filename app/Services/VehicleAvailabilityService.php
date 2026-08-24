<?php

namespace App\Services;

use App\Models\Vehicle;
use App\Models\Booking;
use App\Models\VehicleUnavailableDate;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class VehicleAvailabilityService
{
    /**
     * Check if a vehicle is available for a specific date/time range.
     */
    public function isAvailable(Vehicle $vehicle, string $startDatetime, string $endDatetime, ?int $excludeBookingId = null): bool
    {
        // 1. Check vehicle base status
        if (in_array($vehicle->status, ['unavailable', 'maintenance'])) {
            return false;
        }

        $start = Carbon::parse($startDatetime);
        $end = Carbon::parse($endDatetime);
        $startDateStr = $start->toDateString();
        $endDateStr = $end->toDateString();

        // 2. Check manual maintenance / unavailable intervals
        $hasBlockedDates = VehicleUnavailableDate::where('vehicle_id', $vehicle->id)
            ->where(function ($query) use ($startDateStr, $endDateStr) {
                $query->where('start_date', '<=', $endDateStr)
                      ->where('end_date', '>=', $startDateStr);
            })
            ->exists();

        if ($hasBlockedDates) {
            return false;
        }

        // 3. Check active overlapping bookings
        // Active status: pending, confirmed, rented, reserved
        // Ignore cancelled, completed, or rejected bookings
        $hasOverlappingBooking = Booking::where('vehicle_id', $vehicle->id)
            ->whereIn('status', ['pending', 'confirmed', 'rented', 'reserved'])
            ->when($excludeBookingId, function ($query, $id) {
                return $query->where('id', '!=', $id);
            })
            ->where(function ($query) use ($start, $end) {
                $query->where('start_datetime', '<', $end)
                      ->where('end_datetime', '>', $start);
            })
            ->exists();

        return !$hasOverlappingBooking;
    }

    /**
     * Retrieve calendar events within a date range for Admin/Staff or Customer (privacy redacted).
     */
    public function getCalendarFeed(string $startRange, string $endRange, ?int $vehicleId = null, ?string $statusFilter = null, bool $isCustomer = false): array
    {
        $start = Carbon::parse($startRange)->startOfDay();
        $end = Carbon::parse($endRange)->endOfDay();
        $startDateStr = $start->toDateString();
        $endDateStr = $end->toDateString();

        $events = [];

        // 1. Fetch relevant bookings
        $bookingsQuery = Booking::with(['vehicle', 'user'])
            ->where(function ($query) use ($start, $end) {
                $query->where('start_datetime', '<=', $end)
                      ->where('end_datetime', '>=', $start);
            })
            ->when($vehicleId, fn($q) => $q->where('vehicle_id', $vehicleId))
            ->when($statusFilter, function ($q, $status) {
                if (in_array($status, ['pending', 'confirmed', 'rented', 'reserved', 'completed', 'cancelled'])) {
                    return $q->where('status', $status);
                }
            });

        $bookings = $bookingsQuery->get();

        foreach ($bookings as $b) {
            // Apply status filter if requested
            if ($statusFilter && $b->status !== $statusFilter) {
                continue;
            }

            if ($isCustomer) {
                // Privacy redaction for customer view
                $events[] = [
                    'id' => 'booking-' . $b->id,
                    'type' => 'booking',
                    'vehicle_id' => $b->vehicle_id,
                    'vehicle_name' => $b->vehicle ? $b->vehicle->name : 'Vehicle',
                    'start' => $b->start_datetime->toIso8601String(),
                    'end' => $b->end_datetime->toIso8601String(),
                    'status' => $b->status,
                    'title' => in_array($b->status, ['confirmed', 'rented', 'reserved']) ? 'Booked / Reserved' : 'Unavailable',
                    'is_customer_view' => true,
                ];
            } else {
                // Admin / Staff view with full details
                $events[] = [
                    'id' => 'booking-' . $b->id,
                    'type' => 'booking',
                    'booking_id' => $b->id,
                    'vehicle_id' => $b->vehicle_id,
                    'vehicle_name' => $b->vehicle ? $b->vehicle->name : 'N/A',
                    'plate_number' => $b->vehicle ? ($b->vehicle->plate_number ?? 'N/A') : 'N/A',
                    'customer_id' => $b->user_id,
                    'customer_name' => $b->user ? $b->user->name : 'Unknown User',
                    'customer_email' => $b->user ? $b->user->email : 'N/A',
                    'customer_phone' => $b->user ? ($b->user->phone ?? 'N/A') : 'N/A',
                    'start' => $b->start_datetime->toIso8601String(),
                    'end' => $b->end_datetime->toIso8601String(),
                    'total_price' => (float)$b->total_price,
                    'payment_method' => $b->payment_method,
                    'status' => $b->status,
                    'title' => ($b->user ? $b->user->name : 'Client') . ' (' . strtoupper($b->status) . ')',
                    'damage_notes' => $b->vehicle ? $b->vehicle->damage_notes : null,
                    'pickup_location' => $b->pickup_location,
                ];
            }
        }

        // 2. Fetch manual maintenance & unavailable dates
        $unavailableQuery = VehicleUnavailableDate::with('vehicle')
            ->where('start_date', '<=', $endDateStr)
            ->where('end_date', '>=', $startDateStr)
            ->when($vehicleId, fn($q) => $q->where('vehicle_id', $vehicleId));

        $unavailableDates = $unavailableQuery->get();

        foreach ($unavailableDates as $ud) {
            $status = $ud->type ?? 'maintenance';
            if ($statusFilter && $statusFilter !== 'all' && $statusFilter !== $status) {
                continue;
            }

            $events[] = [
                'id' => 'unavailable-' . $ud->id,
                'type' => 'maintenance',
                'unavailable_id' => $ud->id,
                'vehicle_id' => $ud->vehicle_id,
                'vehicle_name' => $ud->vehicle ? $ud->vehicle->name : 'Vehicle',
                'plate_number' => $ud->vehicle ? ($ud->vehicle->plate_number ?? 'N/A') : 'N/A',
                'start' => Carbon::parse($ud->start_date)->startOfDay()->toIso8601String(),
                'end' => Carbon::parse($ud->end_date)->endOfDay()->toIso8601String(),
                'status' => $status,
                'title' => ucfirst($status) . ($ud->reason ? ': ' . $ud->reason : ''),
                'reason' => $ud->reason ?? 'Scheduled maintenance / Blocked',
                'is_customer_view' => $isCustomer,
            ];
        }

        return $events;
    }

    /**
     * Compute Smart Reports analytics & rule-based AI recommendations.
     */
    public function getSmartInsightsData(?string $timeRange = 'this_month'): array
    {
        $now = Carbon::now();
        $startDate = match ($timeRange) {
            'today' => $now->copy()->startOfDay(),
            'this_week' => $now->copy()->startOfWeek(),
            'last_month' => $now->copy()->subMonth()->startOfMonth(),
            'this_year' => $now->copy()->startOfYear(),
            default => $now->copy()->startOfMonth(), // 'this_month'
        };

        $endDate = match ($timeRange) {
            'today' => $now->copy()->endOfDay(),
            'this_week' => $now->copy()->endOfWeek(),
            'last_month' => $now->copy()->subMonth()->endOfMonth(),
            'this_year' => $now->copy()->endOfYear(),
            default => $now->copy()->endOfMonth(),
        };

        // Vehicles counts
        $vehicles = Vehicle::all();
        $totalVehicles = $vehicles->count();
        $availableVehicles = $vehicles->where('status', 'available')->count();
        $rentedVehicles = $vehicles->where('status', 'rented')->count();
        $reservedVehicles = $vehicles->where('status', 'reserved')->count();
        $maintenanceVehicles = $vehicles->where('status', 'maintenance')->count();
        $unavailableVehicles = $vehicles->where('status', 'unavailable')->count();

        // Bookings in date range
        $bookings = Booking::with('vehicle')
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate)
            ->get();

        $totalRentals = $bookings->count();
        $activeRentals = $bookings->whereIn('status', ['confirmed', 'rented', 'reserved'])->count();
        $completedRentals = $bookings->where('status', 'completed')->count();
        $cancelledRentals = $bookings->where('status', 'cancelled')->count();

        $totalRevenue = (float) Booking::whereIn('status', ['confirmed', 'completed', 'rented'])
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate)
            ->sum('total_price');

        $outstandingPayments = (float) Booking::where('status', 'pending')
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate)
            ->sum('total_price');

        // Most & Least rented vehicles
        $vehicleBookingCounts = Booking::select('vehicle_id', DB::raw('count(*) as booking_count'))
            ->where('created_at', '>=', $startDate)
            ->where('created_at', '<=', $endDate)
            ->groupBy('vehicle_id')
            ->pluck('booking_count', 'vehicle_id');

        $vehicleStats = $vehicles->map(function ($v) use ($vehicleBookingCounts) {
            $count = $vehicleBookingCounts->get($v->id, 0);
            return [
                'id' => $v->id,
                'name' => $v->name,
                'plate_number' => $v->plate_number,
                'booking_count' => $count,
                'status' => $v->status,
                'damage_notes' => $v->damage_notes,
            ];
        })->sortByDesc('booking_count')->values();

        $mostRented = $vehicleStats->first();
        $leastRented = $vehicleStats->last();

        // Rule-Based Smart AI Insights & Recommendations
        $insights = [];

        if ($mostRented && $mostRented['booking_count'] > 0) {
            $insights[] = [
                'type' => 'high_demand',
                'title' => 'High Fleet Utilization',
                'message' => "{$mostRented['name']} ({$mostRented['plate_number']}) is your top performing vehicle with {$mostRented['booking_count']} reservations during this period. Ensure regular routine inspections.",
                'badge' => 'High Demand',
                'color' => 'emerald',
            ];
        }

        if ($leastRented && $leastRented['booking_count'] == 0 && $totalVehicles > 0) {
            $insights[] = [
                'type' => 'low_demand',
                'title' => 'Underutilized Fleet Asset',
                'message' => "{$leastRented['name']} ({$leastRented['plate_number']}) has 0 bookings during this period. Consider assigning a promotional discount or bundling extra add-ons.",
                'badge' => 'Promo Suggestion',
                'color' => 'amber',
            ];
        }

        $damagedVehicles = $vehicles->filter(fn($v) => !empty($v->damage_notes));
        if ($damagedVehicles->count() > 0) {
            $names = $damagedVehicles->take(2)->map(fn($v) => "{$v->name} ({$v->plate_number})")->implode(', ');
            $insights[] = [
                'type' => 'damage_warning',
                'title' => 'Recorded Fleet Damage',
                'message' => "{$damagedVehicles->count()} vehicle(s) have recorded damage reports ({$names}). Schedule maintenance before re-listing as Available.",
                'badge' => 'Inspection Required',
                'color' => 'rose',
            ];
        }

        if ($outstandingPayments > 0) {
            $insights[] = [
                'type' => 'payment_alert',
                'title' => 'Outstanding Uncollected Revenue',
                'message' => "There is ₱" . number_format($outstandingPayments, 2) . " in pending uncollected booking payments requiring verification.",
                'badge' => 'Payment Follow-up',
                'color' => 'indigo',
            ];
        }

        $upcomingBookingsCount = Booking::where('start_datetime', '>=', $now)
            ->where('start_datetime', '<=', $now->copy()->addDays(7))
            ->whereIn('status', ['pending', 'confirmed', 'reserved'])
            ->count();

        if ($upcomingBookingsCount > 0) {
            $insights[] = [
                'type' => 'upcoming_demand',
                'title' => 'Upcoming Dispatch Surge',
                'message' => "{$upcomingBookingsCount} upcoming reservation(s) scheduled for dispatch within the next 7 days.",
                'badge' => '7-Day Surge',
                'color' => 'sky',
            ];
        }

        return [
            'summary' => [
                'total_vehicles' => $totalVehicles,
                'available_vehicles' => $availableVehicles,
                'rented_vehicles' => $rentedVehicles,
                'reserved_vehicles' => $reservedVehicles,
                'maintenance_vehicles' => $maintenanceVehicles,
                'unavailable_vehicles' => $unavailableVehicles,
                'total_rentals' => $totalRentals,
                'active_rentals' => $activeRentals,
                'completed_rentals' => $completedRentals,
                'cancelled_rentals' => $cancelledRentals,
                'total_revenue' => $totalRevenue,
                'outstanding_payments' => $outstandingPayments,
            ],
            'vehicle_stats' => $vehicleStats,
            'most_rented' => $mostRented,
            'least_rented' => $leastRented,
            'insights' => $insights,
            'time_range' => $timeRange,
        ];
    }
}
