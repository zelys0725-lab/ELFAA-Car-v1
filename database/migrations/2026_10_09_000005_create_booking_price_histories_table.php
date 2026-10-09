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
        // 1. Add deposit and security fields to bookings table if not exists
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'security_deposit')) {
                $table->decimal('security_deposit', 10, 2)->default(0.00)->after('discount_amount');
            }
            if (!Schema::hasColumn('bookings', 'amount_paid')) {
                $table->decimal('amount_paid', 10, 2)->default(0.00)->after('total_price');
            }
            if (!Schema::hasColumn('bookings', 'final_total')) {
                $table->decimal('final_total', 10, 2)->nullable()->after('amount_paid');
            }
        });

        // 2. Create price history audit trail table
        Schema::create('booking_price_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained('bookings')->onDelete('cascade');
            $table->foreignId('changed_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->decimal('previous_total', 10, 2);
            $table->decimal('new_total', 10, 2);
            $table->decimal('change_amount', 10, 2);
            $table->string('reason');
            $table->json('breakdown_snapshot')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_price_histories');
        Schema::table('bookings', function (Blueprint $table) {
            if (Schema::hasColumn('bookings', 'security_deposit')) {
                $table->dropColumn('security_deposit');
            }
            if (Schema::hasColumn('bookings', 'amount_paid')) {
                $table->dropColumn('amount_paid');
            }
            if (Schema::hasColumn('bookings', 'final_total')) {
                $table->dropColumn('final_total');
            }
        });
    }
};
