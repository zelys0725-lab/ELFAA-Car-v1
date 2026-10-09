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
        Schema::create('bill_records', function (Blueprint $table) {
            $table->id();
            $table->string('biller_name'); // e.g., Meralco, Maynilad, PLDT, Globe, Fleet Maintenance, HOA, Insurance
            $table->string('bill_category'); // Electricity, Water, Internet, Vehicle Fleet, Maintenance, Other
            $table->string('account_number')->nullable();
            $table->decimal('amount', 10, 2);
            $table->date('due_date');
            $table->date('payment_date')->nullable();
            $table->string('status')->default('pending'); // pending, paid, overdue, cancelled
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bill_records');
    }
};
