<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use App\Models\Vehicle;
use App\Models\VehicleUnavailableDate;
use App\Services\AvailabilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AvailabilityServiceTest extends TestCase
{
    use RefreshDatabase;

    private $vehicle;
    private $customer;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test customer (role: client)
        $this->customer = User::create([
            'name' => 'Test Customer',
            'email' => 'customer@gmail.com',
            'password' => bcrypt('password'),
            'role' => 'client',
            'status' => 'active',
        ]);

        // Create a test vehicle
        $this->vehicle = Vehicle::create([
            'name' => 'Toyota Vios 2024',
            'type' => 'Sedan',
            'seats' => 5,
            'transmission' => 'Auto',
            'fuel_type' => 'Gas',
            'price_per_day' => 1500.00,
            'status' => 'available',
            'meetup_location' => 'Manila Airport',
            'features' => ['GPS', 'Bluetooth'],
            'images' => [],
        ]);
    }

    public function test_vehicle_is_available_when_no_bookings_exist()
    {
        $this->assertTrue(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-01 10:00:00', '2026-08-03 10:00:00')
        );
    }

    public function test_vehicle_is_unavailable_when_there_is_a_fully_overlapping_booking()
    {
        // Pre-existing booking: Aug 1 12:00 to Aug 3 12:00
        Booking::create([
            'user_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => '2026-08-01 12:00:00',
            'end_datetime' => '2026-08-03 12:00:00',
            'pickup_location' => 'Airport',
            'total_price' => 3000.00,
            'payment_method' => 'cod',
            'status' => 'confirmed',
        ]);

        // Attempting to book within the range: Aug 2 10:00 to Aug 2 18:00
        $this->assertFalse(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-02 10:00:00', '2026-08-02 18:00:00')
        );
    }

    public function test_vehicle_is_unavailable_when_overlap_at_the_start()
    {
        // Pre-existing booking: Aug 1 12:00 to Aug 3 12:00
        Booking::create([
            'user_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => '2026-08-01 12:00:00',
            'end_datetime' => '2026-08-03 12:00:00',
            'pickup_location' => 'Airport',
            'total_price' => 3000.00,
            'payment_method' => 'cod',
            'status' => 'confirmed',
        ]);

        // Attempting to book overlapping the start: Jul 31 12:00 to Aug 1 13:00
        $this->assertFalse(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-07-31 12:00:00', '2026-08-01 13:00:00')
        );
    }

    public function test_vehicle_is_unavailable_when_overlap_at_the_end()
    {
        // Pre-existing booking: Aug 1 12:00 to Aug 3 12:00
        Booking::create([
            'user_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => '2026-08-01 12:00:00',
            'end_datetime' => '2026-08-03 12:00:00',
            'pickup_location' => 'Airport',
            'total_price' => 3000.00,
            'payment_method' => 'cod',
            'status' => 'confirmed',
        ]);

        // Attempting to book overlapping the end: Aug 3 11:00 to Aug 4 12:00
        $this->assertFalse(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-03 11:00:00', '2026-08-04 12:00:00')
        );
    }

    public function test_vehicle_is_available_for_back_to_back_same_day_bookings()
    {
        // Pre-existing booking: Aug 1 10:00 to Aug 1 19:00 (7 PM return)
        Booking::create([
            'user_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => '2026-08-01 10:00:00',
            'end_datetime' => '2026-08-01 19:00:00',
            'pickup_location' => 'Airport',
            'total_price' => 1500.00,
            'payment_method' => 'cod',
            'status' => 'confirmed',
        ]);

        // Same-day back-to-back: starts at 19:00 or after (e.g. 19:00 or 20:00)
        // Starts exactly at 19:00
        $this->assertTrue(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-01 19:00:00', '2026-08-01 22:00:00')
        );

        // Starts at 20:00
        $this->assertTrue(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-01 20:00:00', '2026-08-01 23:00:00')
        );
    }

    public function test_rejected_or_cancelled_bookings_do_not_block_availability()
    {
        // Pre-existing CANCELLED booking: Aug 1 12:00 to Aug 3 12:00
        Booking::create([
            'user_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => '2026-08-01 12:00:00',
            'end_datetime' => '2026-08-03 12:00:00',
            'pickup_location' => 'Airport',
            'total_price' => 3000.00,
            'payment_method' => 'cod',
            'status' => 'cancelled',
        ]);

        // Pre-existing REJECTED booking: Aug 5 12:00 to Aug 7 12:00
        Booking::create([
            'user_id' => $this->customer->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => '2026-08-05 12:00:00',
            'end_datetime' => '2026-08-07 12:00:00',
            'pickup_location' => 'Airport',
            'total_price' => 3000.00,
            'payment_method' => 'cod',
            'status' => 'rejected',
        ]);

        // Should be available now
        $this->assertTrue(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-01 12:00:00', '2026-08-03 12:00:00')
        );
        $this->assertTrue(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-05 12:00:00', '2026-08-07 12:00:00')
        );
    }

    public function test_vehicle_is_unavailable_when_it_overlaps_blackout_dates()
    {
        // Set manual blackout date on Aug 10 to Aug 12
        VehicleUnavailableDate::create([
            'vehicle_id' => $this->vehicle->id,
            'start_date' => '2026-08-10',
            'end_date' => '2026-08-12',
        ]);

        // Attempting to book: Aug 9 22:00 to Aug 10 02:00 (intersects with blackout start)
        $this->assertFalse(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-09 22:00:00', '2026-08-10 02:00:00')
        );

        // Attempting to book: Aug 11 10:00 to Aug 11 12:00 (fully inside blackout)
        $this->assertFalse(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-11 10:00:00', '2026-08-11 12:00:00')
        );

        // Attempting to book: Aug 12 22:00 to Aug 13 02:00 (intersects with blackout end)
        $this->assertFalse(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-12 22:00:00', '2026-08-13 02:00:00')
        );

        // Attempting to book outer range: Aug 9 to Aug 13
        $this->assertFalse(
            AvailabilityService::isAvailable($this->vehicle->id, '2026-08-09 10:00:00', '2026-08-13 10:00:00')
        );
    }
}

