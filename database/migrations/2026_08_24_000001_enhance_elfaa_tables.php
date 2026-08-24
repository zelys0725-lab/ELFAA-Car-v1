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
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'drivers_license_number')) {
                $table->string('drivers_license_number')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('users', 'id_number')) {
                $table->string('id_number')->nullable()->after('drivers_license_number');
            }
            if (!Schema::hasColumn('users', 'id_type')) {
                $table->string('id_type')->nullable()->after('id_number');
            }
            if (!Schema::hasColumn('users', 'terms_accepted_at')) {
                $table->timestamp('terms_accepted_at')->nullable()->after('remember_token');
            }
        });

        Schema::table('bookings', function (Blueprint $table) {
            if (!Schema::hasColumn('bookings', 'archived_at')) {
                $table->timestamp('archived_at')->nullable()->after('status');
            }
        });

        Schema::table('vehicles', function (Blueprint $table) {
            if (!Schema::hasColumn('vehicles', 'damage_notes')) {
                $table->text('damage_notes')->nullable()->after('features');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['drivers_license_number', 'id_number', 'id_type', 'terms_accepted_at']);
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['archived_at']);
        });

        Schema::table('vehicles', function (Blueprint $table) {
            $table->dropColumn(['damage_notes']);
        });
    }
};
