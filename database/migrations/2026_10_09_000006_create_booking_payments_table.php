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
        Schema::create('booking_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('collector_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('amount_collected', 10, 2);
            $table->string('payment_method')->default('cash'); // cash, cod, gcash, bank_transfer, credit_card
            $table->string('payment_type')->default('partial'); // downpayment, partial, final_settlement, surcharge_payment
            $table->string('reference_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_payments');
    }
};
