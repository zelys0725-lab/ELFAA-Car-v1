<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Vehicle;
use App\Models\Promo;
use App\Models\ExtraGood;
use App\Models\Setting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Seed Users (Admin, Staff, Client/Customer)
        User::create([
            'name' => 'ELFAA Admin User',
            'email' => 'admin@elfaa.com',
            'phone' => '09171234567',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'status' => 'active',
        ]);

        User::create([
            'name' => 'ELFAA Staff Officer',
            'email' => 'staff@elfaa.com',
            'phone' => '09177654321',
            'password' => Hash::make('password'),
            'role' => 'staff',
            'status' => 'active',
        ]);

        User::create([
            'name' => 'Demo Client Customer',
            'email' => 'customer@gmail.com',
            'phone' => '09223334444',
            'password' => Hash::make('password'),
            'role' => 'client', // client role represents renter customer
            'status' => 'active',
        ]);

        // 2. Seed Fleet Vehicles
        Vehicle::create([
            'name' => 'Toyota Vios 2024',
            'type' => 'Sedan',
            'seats' => 5,
            'transmission' => 'Automatic',
            'fuel_type' => 'Gasoline',
            'price_per_day' => 1500.00,
            'status' => 'available',
            'meetup_location' => 'Metropolitan Manila',
            'features' => ['GPS Navigation', 'Bluetooth Audio', 'Backup Camera', 'USB Charging Port'],
            'images' => [
                'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'
            ],
            'description' => 'A clean and fuel-efficient Toyota Vios ideal for city drives.',
        ]);

        Vehicle::create([
            'name' => 'Toyota Innova 2023',
            'type' => 'MPV',
            'seats' => 7,
            'transmission' => 'Automatic',
            'fuel_type' => 'Diesel',
            'price_per_day' => 2500.00,
            'status' => 'available',
            'meetup_location' => 'Metropolitan Manila',
            'features' => ['Reverse Sensors', 'Leather Seats', 'Spacious Cargo', 'Bluetooth'],
            'images' => [
                'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800'
            ],
            'description' => 'Spacious family MPV with diesel engine power, excellent for long trips.',
        ]);

        Vehicle::create([
            'name' => 'Mitsubishi Montero Sport 2024',
            'type' => 'SUV',
            'seats' => 7,
            'transmission' => 'Automatic',
            'fuel_type' => 'Diesel',
            'price_per_day' => 3500.00,
            'status' => 'available',
            'meetup_location' => 'Metropolitan Manila',
            'features' => ['4WD', 'Premium Leather Seats', 'Sunroof', 'Adaptive Cruise Control', 'Lane Assist'],
            'images' => [
                'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800'
            ],
            'description' => 'Heavy duty and rugged Mitsubishi Montero Sport, perfect for long highland adventures.',
        ]);

        // 3. Seed active Promos
        Promo::create([
            'title' => 'Early Bird Discount',
            'description' => 'Book your vehicle 2 weeks in advance to receive an instant discount on your package booking.',
            'discount_text' => '10% OFF Total Price',
            'image_url' => 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800',
            'status' => 'active',
            'promo_code' => 'EARLYBIRD10',
            'discount_value' => 10.00,
            'discount_type' => 'percentage',
        ]);

        Promo::create([
            'title' => 'Weekend Roadtrip Deal',
            'description' => 'Special promotion for 3-day weekend road tours starting from Friday afternoon.',
            'discount_text' => 'PHP 500 Flat Discount',
            'image_url' => 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800',
            'status' => 'active',
            'promo_code' => 'ROADTRIP500',
            'discount_value' => 500.00,
            'discount_type' => 'flat',
        ]);

        // 4. Seed Add-ons / Extra Goods
        ExtraGood::create([
            'name' => 'GPS Navigation Device',
            'price_per_day' => 150.00,
            'description' => 'Pre-installed GPS navigation device with high-accuracy routing maps for local destinations.',
            'status' => 'available',
        ]);

        ExtraGood::create([
            'name' => 'Infant/Child Safety Seat',
            'price_per_day' => 200.00,
            'description' => 'Comfortable booster/infant car safety seat with secure ISOFIX harness anchors.',
            'status' => 'available',
        ]);

        ExtraGood::create([
            'name' => 'Waterproof Roof Cargo Box',
            'price_per_day' => 300.00,
            'description' => 'Secure rooftop carrier storage box for heavy luggage on family roadtrips.',
            'status' => 'available',
        ]);

        // 5. Seed Dynamic Branding / Settings Configurations
        Setting::create([
            'key' => 'site_logo',
            'value' => 'CARKONO',
        ]);

        Setting::create([
            'key' => 'home_hero_title',
            'value' => 'Premium Self-Tour Car Rentals',
        ]);

        Setting::create([
            'key' => 'home_hero_subtitle',
            'value' => 'Sleek, transparent, and flexible self-drive car rentals across the country.',
        ]);

        Setting::create([
            'key' => 'contact_email',
            'value' => 'support@carkono.com',
        ]);

        Setting::create([
            'key' => 'contact_phone',
            'value' => '0917-123-4567',
        ]);

        // 6. Seed completed Bookings for Analytics charts
        $customer = User::where('role', 'client')->first();
        $vehiclesList = Vehicle::all();

        if ($customer && $vehiclesList->count() >= 3) {
            \App\Models\Booking::create([
                'user_id' => $customer->id,
                'vehicle_id' => $vehiclesList[0]->id, // Toyota Vios
                'start_datetime' => date('Y-m-d H:i:s', strtotime('-2 months')),
                'end_datetime' => date('Y-m-d H:i:s', strtotime('-2 months +3 days')),
                'pickup_location' => 'Metropolitan Manila',
                'total_price' => 4500.00,
                'payment_method' => 'cod',
                'status' => 'completed',
            ]);

            \App\Models\Booking::create([
                'user_id' => $customer->id,
                'vehicle_id' => $vehiclesList[1]->id, // Toyota Innova
                'start_datetime' => date('Y-m-d H:i:s', strtotime('-1 month')),
                'end_datetime' => date('Y-m-d H:i:s', strtotime('-1 month +4 days')),
                'pickup_location' => 'Metropolitan Manila',
                'total_price' => 10000.00,
                'payment_method' => 'cod',
                'status' => 'completed',
            ]);

            \App\Models\Booking::create([
                'user_id' => $customer->id,
                'vehicle_id' => $vehiclesList[2]->id, // Montero Sport
                'start_datetime' => date('Y-m-d H:i:s'),
                'end_datetime' => date('Y-m-d H:i:s', strtotime('+2 days')),
                'pickup_location' => 'Metropolitan Manila',
                'total_price' => 7000.00,
                'payment_method' => 'cod',
                'status' => 'completed',
            ]);
        }
    }
}
