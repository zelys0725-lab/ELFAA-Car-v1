<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add purchase cost to vehicles
        Schema::table('vehicles', function (Blueprint $table) {
            if (!Schema::hasColumn('vehicles', 'purchase_cost')) {
                $table->decimal('purchase_cost', 12, 2)->nullable()->after('price_per_day');
            }
        });

        // Vehicle operating expenses (maintenance, repair, other)
        Schema::create('vehicle_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vehicle_id')->constrained('vehicles')->onDelete('cascade');
            $table->string('expense_type')->default('maintenance'); // maintenance, repair, other
            $table->decimal('amount', 12, 2);
            $table->string('description')->nullable();
            $table->date('expense_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_expenses');

        Schema::table('vehicles', function (Blueprint $table) {
            if (Schema::hasColumn('vehicles', 'purchase_cost')) {
                $table->dropColumn('purchase_cost');
            }
        });
    }
};
