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
        Schema::table('promos', function (Blueprint $table) {
            $table->string('promo_code')->nullable()->unique();
            $table->decimal('discount_value', 10, 2)->default(0.00);
            $table->string('discount_type')->default('flat'); // flat, percentage
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->decimal('original_price', 10, 2)->default(0.00);
            $table->string('promo_code')->nullable();
            $table->decimal('discount_amount', 10, 2)->default(0.00);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['original_price', 'promo_code', 'discount_amount']);
        });

        Schema::table('promos', function (Blueprint $table) {
            $table->dropColumn(['promo_code', 'discount_value', 'discount_type']);
        });
    }
};
