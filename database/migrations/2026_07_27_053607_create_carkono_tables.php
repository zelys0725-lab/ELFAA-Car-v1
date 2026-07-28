<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Vehicles: managed by ELFAA CAR RENTAL admin/staff
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // SUV, Sedan, Van, Hatchback, etc.
            $table->integer('seats');
            $table->string('transmission'); // Automatic, Manual
            $table->string('fuel_type'); // Gas, Diesel, Electric, Hybrid
            $table->decimal('price_per_day', 10, 2);
            $table->text('description')->nullable();
            $table->json('features')->nullable(); // JSON array of features
            $table->string('status')->default('available'); // available, unavailable
            $table->string('meetup_location')->nullable();
            $table->json('images')->nullable(); // JSON array of image file paths
            $table->timestamps();
        });

        // Manual block/maintenance/unavailable intervals
        Schema::create('vehicle_unavailable_dates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->date('start_date');
            $table->date('end_date');
            $table->timestamps();
        });

        // Promos: displayed on homepage, managed by admin/staff
        Schema::create('promos', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('description');
            $table->string('discount_text');
            $table->string('image_url')->nullable();
            $table->string('status')->default('active'); // active, inactive
            $table->timestamps();
        });

        // Extra Goods / Add-ons: displayed on homepage, managed by admin/staff
        Schema::create('extra_goods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('price_per_day', 10, 2);
            $table->text('description')->nullable();
            $table->string('status')->default('available'); // available, unavailable
            $table->timestamps();
        });

        // Bookings: linked to unified users table (role = client/renter)
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->dateTime('start_datetime');
            $table->dateTime('end_datetime');
            $table->string('pickup_location')->nullable();
            $table->decimal('total_price', 10, 2);
            $table->string('payment_method')->default('cod'); // online, cod
            $table->string('status')->default('pending'); // pending, confirmed, rejected, cancelled, completed
            $table->timestamps();
        });

        // Verification documents uploaded by customers (renters/users)
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('type'); // gov_id_1, gov_id_2, proof_of_billing
            $table->string('file_path');
            $table->string('status')->default('pending'); // pending, verified, rejected
            $table->string('reject_reason')->nullable();
            $table->string('verified_by')->nullable(); // Operator identifier/name
            $table->dateTime('verified_at')->nullable();
            $table->timestamps();
        });

        // Ratings for completed reservations
        Schema::create('ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->integer('stars'); // 1 to 5
            $table->text('comment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ratings');
        Schema::dropIfExists('documents');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('extra_goods');
        Schema::dropIfExists('promos');
        Schema::dropIfExists('vehicle_unavailable_dates');
        Schema::dropIfExists('vehicles');
    }
};
