<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->foreignId('inspector_id')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('type', ['pickup', 'return']);
            $table->integer('fuel_bars')->default(8); // 0 to 8 fuel bars
            $table->bigInteger('odometer_reading')->default(0); // Odometer reading in KM
            $table->text('notes')->nullable(); // Existing or new damages, scratches, dents
            $table->json('photos')->nullable(); // Array of image file paths
            $table->timestamp('inspected_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('inspection_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('inspection_id')->nullable()->constrained('vehicle_inspections')->onDelete('set null');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('charge_type')->default('damage'); // damage, fuel_deficit, cleaning, late_return, other
            $table->text('description');
            $table->decimal('amount', 10, 2);
            $table->json('evidence_photos')->nullable();
            $table->enum('status', ['proposed', 'approved', 'rejected', 'paid'])->default('proposed');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_charges');
        Schema::dropIfExists('vehicle_inspections');
    }
};
