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
            $table->boolean('mfa_enabled')->default(false)->after('status');
            $table->string('mfa_type', 30)->nullable()->after('mfa_enabled'); // 'email', 'authenticator', 'both'
            $table->text('mfa_secret')->nullable()->after('mfa_type'); // TOTP secret (encrypted)
            $table->string('mfa_email_otp', 255)->nullable()->after('mfa_secret'); // Hashed email OTP
            $table->timestamp('mfa_otp_expires_at')->nullable()->after('mfa_email_otp');
            $table->timestamp('mfa_resend_available_at')->nullable()->after('mfa_otp_expires_at');
            $table->unsignedInteger('mfa_resend_count')->default(0)->after('mfa_resend_available_at');
            $table->unsignedInteger('mfa_failed_attempts')->default(0)->after('mfa_resend_count');
        });

        Schema::create('user_backup_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('code_hash', 255);
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'used_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_backup_codes');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'mfa_enabled',
                'mfa_type',
                'mfa_secret',
                'mfa_email_otp',
                'mfa_otp_expires_at',
                'mfa_resend_available_at',
                'mfa_resend_count',
                'mfa_failed_attempts',
            ]);
        });
    }
};
