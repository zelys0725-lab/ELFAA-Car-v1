<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->boolean('is_legacy')->default(false)->after('status');
            $table->text('legacy_notes')->nullable()->after('is_legacy');
            $table->string('import_batch_id')->nullable()->after('legacy_notes'); // Groups records from same import session
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['is_legacy', 'legacy_notes', 'import_batch_id']);
        });
    }
};
