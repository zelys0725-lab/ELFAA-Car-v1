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
        Schema::table('vehicle_unavailable_dates', function (Blueprint $table) {
            if (!Schema::hasColumn('vehicle_unavailable_dates', 'reason')) {
                $table->string('reason')->nullable()->after('end_date');
            }
            if (!Schema::hasColumn('vehicle_unavailable_dates', 'type')) {
                $table->string('type')->default('maintenance')->after('reason'); // maintenance, unavailable, out_of_service
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicle_unavailable_dates', function (Blueprint $table) {
            $table->dropColumn(['reason', 'type']);
        });
    }
};
