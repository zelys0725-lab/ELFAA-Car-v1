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
        Schema::create('operational_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('task_type')->default('delivery_pickup'); // delivery_pickup, vehicle_return, overdue_return, inspection_pending, unpaid_balance, surcharge_approval, maintenance
            $table->dateTime('due_datetime');
            $table->foreignId('assigned_staff_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('vehicle_id')->nullable()->constrained('vehicles')->onDelete('cascade');
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->onDelete('cascade');
            $table->string('status')->default('pending'); // pending, in_progress, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operational_tasks');
    }
};
