<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\VehicleUnavailableDate;
use Illuminate\Support\Carbon;

class AvailabilityService
{
    /**
     * Determine if a vehicle is available for the given datetime range.
     *
     * @param int $vehicleId
     * @param string|Carbon $start
     * @param string|Carbon $end
     * @return bool
     */
    public static function isAvailable(int $vehicleId, $start, $end): bool
    {
        $start = Carbon::parse($start);
        $end = Carbon::parse($end);

        if ($start->greaterThanOrEqualTo($end)) {
            return false;
        }

        // 1. Check for overlapping bookings (status is pending or confirmed)
        $hasBookingConflict = Booking::where('vehicle_id', $vehicleId)
            ->whereIn('status', ['pending', 'confirmed'])
            ->where(function ($query) use ($start, $end) {
                // Strict overlap check:
                // Existing booking starts before requested ends AND existing booking ends after requested starts
                $query->where('start_datetime', '<', $end)
                      ->where('end_datetime', '>', $start);
            })
            ->exists();

        if ($hasBookingConflict) {
            return false;
        }

        // 2. Check for manual blackout dates in vehicle_unavailable_dates
        // Blackout dates block the full days. If the requested range intersects with any blackout days, reject.
        $reqStartDate = $start->toDateString();
        $reqEndDate = $end->toDateString();

        $hasBlackoutConflict = VehicleUnavailableDate::where('vehicle_id', $vehicleId)
            ->where(function ($query) use ($reqStartDate, $reqEndDate) {
                $query->whereDate('start_date', '<=', $reqEndDate)
                      ->whereDate('end_date', '>=', $reqStartDate);
            })
            ->exists();

        if ($hasBlackoutConflict) {
            return false;
        }

        return true;
    }
}
