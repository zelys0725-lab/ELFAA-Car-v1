<?php

namespace App\Http\Controllers;

use App\Models\VehicleUnavailableDate;
use App\Services\VehicleAvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class CalendarController extends Controller
{
    protected VehicleAvailabilityService $availabilityService;

    public function __construct(VehicleAvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }

    /**
     * Customer calendar feed (Privacy-redacted, no customer details).
     */
    public function customerFeed(Request $request)
    {
        $startRange = $request->query('start', Carbon::now()->startOfMonth()->toIso8601String());
        $endRange = $request->query('end', Carbon::now()->endOfMonth()->toIso8601String());
        $vehicleId = $request->query('vehicle_id') ? (int)$request->query('vehicle_id') : null;

        $events = $this->availabilityService->getCalendarFeed(
            $startRange,
            $endRange,
            $vehicleId,
            null,
            true // isCustomer = true
        );

        return response()->json([
            'events' => $events,
        ]);
    }

    /**
     * Admin/Staff calendar feed (Full details).
     */
    public function adminFeed(Request $request)
    {
        $startRange = $request->query('start', Carbon::now()->startOfMonth()->toIso8601String());
        $endRange = $request->query('end', Carbon::now()->endOfMonth()->toIso8601String());
        $vehicleId = $request->query('vehicle_id') ? (int)$request->query('vehicle_id') : null;
        $statusFilter = $request->query('status');

        $events = $this->availabilityService->getCalendarFeed(
            $startRange,
            $endRange,
            $vehicleId,
            $statusFilter,
            false // isCustomer = false
        );

        return response()->json([
            'events' => $events,
        ]);
    }

    /**
     * Add a maintenance / unavailable block interval for a vehicle (Admin/Staff only).
     */
    public function storeUnavailableDate(Request $request)
    {
        $request->validate([
            'vehicle_id' => 'required|exists:vehicles,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:255',
            'type' => 'nullable|in:maintenance,unavailable,out_of_service',
        ]);

        $record = VehicleUnavailableDate::create([
            'vehicle_id' => $request->vehicle_id,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason ?? 'Scheduled maintenance',
            'type' => $request->type ?? 'maintenance',
        ]);

        return back()->with('success', 'Vehicle maintenance / block interval added successfully.');
    }

    /**
     * Remove a maintenance / unavailable block interval.
     */
    public function destroyUnavailableDate(VehicleUnavailableDate $unavailableDate)
    {
        $unavailableDate->delete();

        return back()->with('success', 'Block interval removed successfully.');
    }

    /**
     * Return Smart Insights & Reports analytics JSON.
     */
    public function smartInsights(Request $request)
    {
        $timeRange = $request->query('time_range', 'this_month');
        $data = $this->availabilityService->getSmartInsightsData($timeRange);

        return response()->json($data);
    }
}
