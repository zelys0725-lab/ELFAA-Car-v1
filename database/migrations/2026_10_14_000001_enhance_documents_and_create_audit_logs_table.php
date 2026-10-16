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
        // 1. Enhance documents table with OCR metadata, confidence, and resubmission tracking
        Schema::table('documents', function (Blueprint $table) {
            if (!Schema::hasColumn('documents', 'resubmission_notes')) {
                $table->text('resubmission_notes')->nullable()->after('reject_reason');
            }
            if (!Schema::hasColumn('documents', 'ocr_status')) {
                $table->string('ocr_status')->default('pending')->after('resubmission_notes'); // pending, completed, failed, skipped
            }
            if (!Schema::hasColumn('documents', 'ocr_raw_text')) {
                $table->longText('ocr_raw_text')->nullable()->after('ocr_status');
            }
            if (!Schema::hasColumn('documents', 'ocr_confidence')) {
                $table->decimal('ocr_confidence', 5, 2)->nullable()->after('ocr_raw_text');
            }
            if (!Schema::hasColumn('documents', 'ocr_word_count')) {
                $table->integer('ocr_word_count')->nullable()->after('ocr_confidence');
            }
            if (!Schema::hasColumn('documents', 'ocr_char_count')) {
                $table->integer('ocr_char_count')->nullable()->after('ocr_word_count');
            }
            if (!Schema::hasColumn('documents', 'ocr_extracted_data')) {
                $table->json('ocr_extracted_data')->nullable()->after('ocr_char_count');
            }
            if (!Schema::hasColumn('documents', 'verification_summary')) {
                $table->json('verification_summary')->nullable()->after('ocr_extracted_data');
            }
            if (!Schema::hasColumn('documents', 'ocr_processed_at')) {
                $table->timestamp('ocr_processed_at')->nullable()->after('verification_summary');
            }
            if (!Schema::hasColumn('documents', 'ocr_error')) {
                $table->text('ocr_error')->nullable()->after('ocr_processed_at');
            }
            if (!Schema::hasColumn('documents', 'storage_disk')) {
                $table->string('storage_disk')->default('local')->after('file_path');
            }
            if (!Schema::hasColumn('documents', 'original_filename')) {
                $table->string('original_filename')->nullable()->after('storage_disk');
            }
            if (!Schema::hasColumn('documents', 'mime_type')) {
                $table->string('mime_type')->nullable()->after('original_filename');
            }
            if (!Schema::hasColumn('documents', 'file_size')) {
                $table->unsignedBigInteger('file_size')->nullable()->after('mime_type');
            }
        });

        // 2. Create document verification audit logs table
        Schema::create('document_audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('documents')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('action'); // uploaded, ocr_processed, approved, rejected, resubmission_requested, ocr_reprocessed
            $table->string('previous_status')->nullable();
            $table->string('new_status')->nullable();
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_audit_logs');

        Schema::table('documents', function (Blueprint $table) {
            $columns = [
                'resubmission_notes',
                'ocr_status',
                'ocr_raw_text',
                'ocr_confidence',
                'ocr_word_count',
                'ocr_char_count',
                'ocr_extracted_data',
                'verification_summary',
                'ocr_processed_at',
                'ocr_error',
                'storage_disk',
                'original_filename',
                'mime_type',
                'file_size',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('documents', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
