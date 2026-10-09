<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\Promo;
use App\Models\ExtraGood;
use App\Models\Setting;
use App\Models\Booking;
use App\Models\Document;
use App\Models\VehicleInspection;
use App\Models\InspectionCharge;
use App\Models\BookingPriceHistory;
use App\Models\BillRecord;
use App\Models\VehicleExpense;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with comprehensive, realistic sample data.
     */
    public function run(): void
    {
        // 0. Ensure upload sample documents exist on disk so links work
        $uploadDocPath = public_path('uploads/documents');
        if (!File::exists($uploadDocPath)) {
            File::makeDirectory($uploadDocPath, 0755, true);
        }

        // Create sample dummy image file for ID verification preview
        $dummyImgPath = $uploadDocPath . '/sample_id_license.jpg';
        if (!File::exists($dummyImgPath)) {
            // Simple SVG converted to fake image file
            $svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#18181b"/><text x="300" y="180" font-family="sans-serif" font-size="24" font-weight="bold" fill="#FF3B30" text-anchor="middle">DRIVERS LICENSE VERIFICATION</text><text x="300" y="220" font-family="sans-serif" font-size="16" fill="#a1a1aa" text-anchor="middle">ELFAA Car Rental — Valid Identity Document</text></svg>';
            File::put($dummyImgPath, $svgContent);
        }

        $dummyBillingPath = $uploadDocPath . '/sample_proof_of_billing.jpg';
        if (!File::exists($dummyBillingPath)) {
            $svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#09090b"/><text x="300" y="180" font-family="sans-serif" font-size="24" font-weight="bold" fill="#10b981" text-anchor="middle">PROOF OF BILLING STATEMENT</text><text x="300" y="220" font-family="sans-serif" font-size="16" fill="#a1a1aa" text-anchor="middle">Meralco / Water Utility Bill Verification</text></svg>';
            File::put($dummyBillingPath, $svgContent);
        }

        // 1. Seed Users (Admin, Staff, Clients)
        $admin = User::updateOrCreate(
            ['email' => 'admin@elfaa.com'],
            [
                'name' => 'ELFAA Admin Officer',
                'phone' => '09171234567',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        $staff = User::updateOrCreate(
            ['email' => 'staff@elfaa.com'],
            [
                'name' => 'Mark Staff Inspector',
                'phone' => '09177654321',
                'password' => Hash::make('password'),
                'role' => 'staff',
                'status' => 'active',
            ]
        );

        $customer1 = User::updateOrCreate(
            ['email' => 'juan.delacruz@gmail.com'],
            [
                'name' => 'Juan Dela Cruz',
                'phone' => '09223334444',
                'password' => Hash::make('password'),
                'role' => 'client',
                'status' => 'active',
            ]
        );

        $customer2 = User::updateOrCreate(
            ['email' => 'maria.santos@gmail.com'],
            [
                'name' => 'Maria Santos',
                'phone' => '09189876543',
                'password' => Hash::make('password'),
                'role' => 'client',
                'status' => 'active',
            ]
        );

        $customer3 = User::updateOrCreate(
            ['email' => 'alexander.reyes@yahoo.com'],
            [
                'name' => 'Alexander Reyes',
                'phone' => '09995551234',
                'password' => Hash::make('password'),
                'role' => 'client',
                'status' => 'active',
            ]
        );

        // Seed Customer ID Documents
        Document::updateOrCreate(
            ['user_id' => $customer1->id, 'type' => 'gov_id_1'],
            [
                'file_path' => '/uploads/documents/sample_id_license.jpg',
                'status' => 'verified',
                'verified_at' => now(),
            ]
        );

        Document::updateOrCreate(
            ['user_id' => $customer1->id, 'type' => 'proof_of_billing'],
            [
                'file_path' => '/uploads/documents/sample_proof_of_billing.jpg',
                'status' => 'verified',
                'verified_at' => now(),
            ]
        );

        Document::updateOrCreate(
            ['user_id' => $customer2->id, 'type' => 'gov_id_1'],
            [
                'file_path' => '/uploads/documents/sample_id_license.jpg',
                'status' => 'pending',
            ]
        );

        // 2. Seed Fleet Vehicles with Purchase Costs & Locations
        $vios = Vehicle::updateOrCreate(
            ['name' => 'Toyota Vios 2024'],
            [
                'type' => 'Sedan',
                'seats' => 5,
                'transmission' => 'Automatic',
                'fuel_type' => 'Gasoline',
                'price_per_day' => 1500.00,
                'purchase_cost' => 850000.00,
                'plate_number' => 'NDA-8821',
                'status' => 'available',
                'meetup_location' => 'SM Sto Tomas',
                'features' => ['GPS Navigation', 'Bluetooth Audio', 'Backup Camera', 'USB Charging Port'],
                'images' => [
                    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'
                ],
                'description' => 'A fuel-efficient Toyota Vios sedan perfect for city commutes and quick weekend getaways.',
            ]
        );

        $innova = Vehicle::updateOrCreate(
            ['name' => 'Toyota Innova 2023'],
            [
                'type' => 'MPV',
                'seats' => 7,
                'transmission' => 'Automatic',
                'fuel_type' => 'Diesel',
                'price_per_day' => 2500.00,
                'purchase_cost' => 1350000.00,
                'plate_number' => 'CBT-4912',
                'status' => 'rented',
                'meetup_location' => 'Victory Mall Tanauan',
                'features' => ['Reverse Sensors', 'Leather Seats', 'Spacious Cargo', 'Dual Aircon', 'Bluetooth'],
                'images' => [
                    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
                ],
                'description' => 'Spacious 7-seater family MPV with strong diesel engine power, excellent for long group trips.',
            ]
        );

        $montero = Vehicle::updateOrCreate(
            ['name' => 'Mitsubishi Montero Sport 2024'],
            [
                'type' => 'SUV',
                'seats' => 7,
                'transmission' => 'Automatic',
                'fuel_type' => 'Diesel',
                'price_per_day' => 3500.00,
                'purchase_cost' => 1950000.00,
                'plate_number' => 'NGG-5019',
                'status' => 'available',
                'meetup_location' => 'SM Calamba',
                'features' => ['4WD', 'Premium Leather Seats', 'Sunroof', 'Adaptive Cruise Control', 'Lane Assist'],
                'images' => [
                    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'
                ],
                'description' => 'Heavy duty and rugged Mitsubishi Montero Sport SUV, built for highway comfort and highland roadtrips.',
            ]
        );

        $ranger = Vehicle::updateOrCreate(
            ['name' => 'Ford Ranger Wildtrak 2024'],
            [
                'type' => 'Pickup',
                'seats' => 5,
                'transmission' => 'Automatic',
                'fuel_type' => 'Diesel',
                'price_per_day' => 3800.00,
                'purchase_cost' => 1850000.00,
                'plate_number' => 'NFF-7711',
                'status' => 'available',
                'meetup_location' => 'SM Sto Tomas',
                'features' => ['4x4 Offroad', 'Bed Liner', 'SYNC 4 Infotainment', '360 Camera', 'Towing Hitch'],
                'images' => [
                    'https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=800'
                ],
                'description' => 'Powerful Ford Ranger 4x4 pickup truck ready for tough cargo transport and outdoor adventures.',
            ]
        );

        // 3. Seed Promos & Add-ons
        Promo::updateOrCreate(
            ['promo_code' => 'EARLYBIRD10'],
            [
                'title' => 'Early Bird Discount',
                'description' => 'Book 2 weeks in advance to receive 10% off your total rental price.',
                'discount_text' => '10% OFF Total Price',
                'image_url' => 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800',
                'status' => 'active',
                'discount_value' => 10.00,
                'discount_type' => 'percentage',
            ]
        );

        Promo::updateOrCreate(
            ['promo_code' => 'ROADTRIP500'],
            [
                'title' => 'Weekend Roadtrip Deal',
                'description' => 'Special promotion for 3-day weekend road tours starting from Friday.',
                'discount_text' => 'PHP 500 Flat Discount',
                'image_url' => 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800',
                'status' => 'active',
                'discount_value' => 500.00,
                'discount_type' => 'flat',
            ]
        );

        ExtraGood::updateOrCreate(
            ['name' => 'GPS Navigation Device'],
            ['price_per_day' => 150.00, 'description' => 'Pre-installed GPS navigation device.', 'status' => 'available']
        );
        ExtraGood::updateOrCreate(
            ['name' => 'Child Safety Seat'],
            ['price_per_day' => 200.00, 'description' => 'Comfortable booster child safety seat.', 'status' => 'available']
        );

        // 4. Seed Settings
        Setting::updateOrCreate(['key' => 'site_logo'], ['value' => 'ELFAA CAR RENTAL']);
        Setting::updateOrCreate(['key' => 'home_hero_title'], ['value' => 'Premium Self-Drive Car Rentals']);
        Setting::updateOrCreate(['key' => 'home_hero_subtitle'], ['value' => 'Serving SM Sto Tomas, Victory Mall Tanauan, SM Calamba & Metro Laguna.']);
        Setting::updateOrCreate(['key' => 'contact_email'], ['value' => 'elfaacarrental@gmail.com']);
        Setting::updateOrCreate(['key' => 'contact_phone'], ['value' => '0917-888-9999']);

        // 5. Seed Realistic Bookings with Inspections, Surcharges & Price Histories
        
        // Booking 1: Completed Booking with Pickup & Return Inspections + Approved Surcharge + Price History
        $booking1 = Booking::create([
            'user_id' => $customer1->id,
            'vehicle_id' => $vios->id,
            'start_datetime' => now()->subDays(10),
            'end_datetime' => now()->subDays(7),
            'pickup_location' => 'SM Sto Tomas',
            'dropoff_location' => 'SM Sto Tomas',
            'original_price' => 4500.00,
            'location_fee' => 0.00,
            'discount_amount' => 500.00,
            'security_deposit' => 2000.00,
            'total_price' => 4600.00, // Adjusted total (4000 + 600 fuel charge)
            'amount_paid' => 4600.00,
            'payment_method' => 'gcash',
            'payment_status' => 'paid',
            'payment_reference' => 'GCASH-992019283',
            'status' => 'completed',
        ]);

        // Pickup Inspection for Booking 1
        $pickup1 = VehicleInspection::create([
            'booking_id' => $booking1->id,
            'vehicle_id' => $vios->id,
            'inspector_id' => $staff->id,
            'type' => 'pickup',
            'fuel_bars' => 8,
            'odometer_reading' => 14250,
            'notes' => 'Vehicle handed over in pristine condition. All clean inside out.',
            'photos' => [
                'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
            ],
            'inspected_at' => now()->subDays(10),
        ]);

        // Return Inspection for Booking 1 (Returned with 6 fuel bars -> deficit)
        $return1 = VehicleInspection::create([
            'booking_id' => $booking1->id,
            'vehicle_id' => $vios->id,
            'inspector_id' => $staff->id,
            'type' => 'return',
            'fuel_bars' => 6,
            'odometer_reading' => 14580,
            'notes' => 'Vehicle returned safely. Fuel level returned at 6/8 bars (2 fuel bars below agreed pickup level).',
            'photos' => [
                'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600'
            ],
            'inspected_at' => now()->subDays(7),
        ]);

        // Approved Inspection Charge for Fuel Deficit
        $charge1 = InspectionCharge::create([
            'booking_id' => $booking1->id,
            'inspection_id' => $return1->id,
            'created_by' => $staff->id,
            'approved_by' => $admin->id,
            'charge_type' => 'fuel_shortage',
            'amount' => 600.00,
            'description' => 'Fuel Refill Charge: 2 bars deficit @ PHP 300 per fuel bar.',
            'evidence_photos' => [$return1->photos[0]],
            'status' => 'approved',
        ]);

        // Audit Trail Record for Booking 1 Price Adjustment
        BookingPriceHistory::create([
            'booking_id' => $booking1->id,
            'changed_by_id' => $admin->id,
            'previous_total' => 4000.00,
            'new_total' => 4600.00,
            'change_amount' => 600.00,
            'reason' => 'Added approved return inspection charge: 2 fuel bars deficit.',
            'breakdown_snapshot' => [
                'original_price' => 4500.00,
                'location_fee' => 0.00,
                'discount_amount' => 500.00,
                'security_deposit' => 2000.00,
                'amount_paid' => 4600.00,
                'approved_charges' => 600.00,
            ],
            'created_at' => now()->subDays(7),
        ]);

        // Booking 2: Active / Rented Booking (Toyota Innova)
        $booking2 = Booking::create([
            'user_id' => $customer2->id,
            'vehicle_id' => $innova->id,
            'start_datetime' => now()->subDays(1),
            'end_datetime' => now()->addDays(2),
            'pickup_location' => 'Victory Mall Tanauan',
            'dropoff_location' => 'Victory Mall Tanauan',
            'original_price' => 7500.00,
            'location_fee' => 250.00,
            'discount_amount' => 0.00,
            'security_deposit' => 3000.00,
            'total_price' => 7750.00,
            'amount_paid' => 7750.00,
            'payment_method' => 'bank_transfer',
            'payment_status' => 'paid',
            'payment_reference' => 'BDO-TRX-881029',
            'status' => 'confirmed',
        ]);

        VehicleInspection::create([
            'booking_id' => $booking2->id,
            'vehicle_id' => $innova->id,
            'inspector_id' => $staff->id,
            'type' => 'pickup',
            'fuel_bars' => 8,
            'odometer_reading' => 28400,
            'notes' => 'Pickup inspection completed at Victory Mall Tanauan. Vehicle clean.',
            'photos' => [
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600'
            ],
            'inspected_at' => now()->subDays(1),
        ]);

        // Booking 3: Confirmed Upcoming Booking (Montero Sport at SM Calamba)
        $booking3 = Booking::create([
            'user_id' => $customer3->id,
            'vehicle_id' => $montero->id,
            'start_datetime' => now()->addDays(3),
            'end_datetime' => now()->addDays(6),
            'pickup_location' => 'SM Calamba',
            'dropoff_location' => 'SM Calamba',
            'original_price' => 10500.00,
            'location_fee' => 300.00,
            'discount_amount' => 1000.00,
            'security_deposit' => 4000.00,
            'total_price' => 9800.00,
            'amount_paid' => 9800.00,
            'payment_method' => 'gcash',
            'payment_status' => 'paid',
            'payment_reference' => 'GCASH-44102931',
            'status' => 'confirmed',
        ]);

        // 6. Seed Bill Records & Vehicle Expenses for Profit Analytics
        BillRecord::create([
            'biller_name' => 'Shop Hub Monthly Rent - Sto Tomas',
            'bill_category' => 'Rent',
            'amount' => 18000.00,
            'due_date' => now()->addDays(5)->toDateString(),
            'status' => 'pending',
            'notes' => 'Main garage & staff station office monthly rental fee.',
        ]);

        BillRecord::create([
            'biller_name' => 'Meralco Utility Electricity Bill',
            'bill_category' => 'Electricity',
            'account_number' => '9981-1209-4411',
            'amount' => 4250.00,
            'due_date' => now()->subDays(2)->toDateString(),
            'status' => 'paid',
            'payment_date' => now()->subDays(2)->toDateString(),
            'notes' => 'Office aircon & garage lighting power bill.',
        ]);

        VehicleExpense::create([
            'vehicle_id' => $vios->id,
            'expense_type' => 'maintenance',
            'amount' => 3800.00,
            'expense_date' => now()->subDays(15)->toDateString(),
            'description' => 'PMS 15,000 KM Periodic Maintenance: Replaced engine oil, oil filter, air filter, and brake pad inspection.',
        ]);

        VehicleExpense::create([
            'vehicle_id' => $innova->id,
            'expense_type' => 'repair',
            'amount' => 11200.00,
            'expense_date' => now()->subDays(20)->toDateString(),
            'description' => 'New Heavy Duty All-Terrain Tires Replacement: Installed 2 brand new Bridgestone rear tires.',
        ]);
    }
}
