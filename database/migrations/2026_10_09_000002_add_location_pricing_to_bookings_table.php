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
        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'dropoff_location')) {
                $table->string('dropoff_location')->nullable()->after('pickup_location');
            }
            if (!Schema::hasColumn('bookings', 'original_price')) {
                $table->decimal('original_price', 10, 2)->default(0.00)->after('dropoff_location');
            }
            if (!Schema::hasColumn('bookings', 'location_fee')) {
                $table->decimal('location_fee', 10, 2)->default(0.00)->after('original_price');
            }
            if (!Schema::hasColumn('bookings', 'is_out_of_bounds')) {
                $table->boolean('is_out_of_bounds')->default(false)->after('location_fee');
            }
            if (!Schema::hasColumn('bookings', 'promo_code')) {
                $table->string('promo_code')->nullable()->after('is_out_of_bounds');
            }
            if (!Schema::hasColumn('bookings', 'discount_amount')) {
                $table->decimal('discount_amount', 10, 2)->default(0.00)->after('promo_code');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn([
                'dropoff_location',
                'original_price',
                'location_fee',
                'is_out_of_bounds',
                'promo_code',
                'discount_amount',
            ]);
        });
    }
};
