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
        if (!Schema::hasTable('vehicle_gps_logs')) {
            Schema::create('vehicle_gps_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
                $table->decimal('latitude', 10, 7);
                $table->decimal('longitude', 10, 7);
                $table->decimal('speed', 5, 2)->default(0); // km/h
                $table->decimal('heading', 5, 2)->nullable(); // 0-360 degrees
                $table->timestamp('recorded_at')->useCurrent();
                $table->timestamps();

                $table->index(['vehicle_id', 'recorded_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicle_gps_logs');
    }
};
