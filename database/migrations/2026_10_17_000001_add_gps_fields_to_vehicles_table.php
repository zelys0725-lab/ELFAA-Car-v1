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
        Schema::table('vehicles', function (Blueprint $table) {
            if (!Schema::hasColumn('vehicles', 'gps_enabled')) {
                $table->boolean('gps_enabled')->default(false)->after('status');
            }
            if (!Schema::hasColumn('vehicles', 'gps_device_id')) {
                $table->string('gps_device_id')->nullable()->unique()->after('gps_enabled');
            }
            if (!Schema::hasColumn('vehicles', 'gps_tracker_key')) {
                $table->string('gps_tracker_key', 64)->nullable()->unique()->after('gps_device_id');
            }
            if (!Schema::hasColumn('vehicles', 'last_latitude')) {
                $table->decimal('last_latitude', 10, 7)->nullable()->after('gps_tracker_key');
            }
            if (!Schema::hasColumn('vehicles', 'last_longitude')) {
                $table->decimal('last_longitude', 10, 7)->nullable()->after('last_latitude');
            }
            if (!Schema::hasColumn('vehicles', 'current_speed')) {
                $table->decimal('current_speed', 5, 2)->default(0)->after('last_longitude');
            }
            if (!Schema::hasColumn('vehicles', 'last_gps_updated_at')) {
                $table->timestamp('last_gps_updated_at')->nullable()->after('current_speed');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehicles', function (Blueprint $table) {
            $columns = [
                'gps_enabled',
                'gps_device_id',
                'gps_tracker_key',
                'last_latitude',
                'last_longitude',
                'current_speed',
                'last_gps_updated_at',
            ];
            foreach ($columns as $column) {
                if (Schema::hasColumn('vehicles', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
