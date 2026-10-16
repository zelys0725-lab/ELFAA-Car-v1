<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'file_path',
        'storage_disk',
        'original_filename',
        'mime_type',
        'file_size',
        'status',
        'reject_reason',
        'resubmission_notes',
        'verified_by',
        'verified_at',
        'ocr_status',
        'ocr_raw_text',
        'ocr_confidence',
        'ocr_word_count',
        'ocr_char_count',
        'ocr_extracted_data',
        'verification_summary',
        'ocr_processed_at',
        'ocr_error',
    ];

    protected $appends = [
        'secure_url',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
            'ocr_processed_at' => 'datetime',
            'ocr_confidence' => 'float',
            'ocr_word_count' => 'integer',
            'ocr_char_count' => 'integer',
            'ocr_extracted_data' => 'array',
            'verification_summary' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verifiedByAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(DocumentAuditLog::class)->orderBy('created_at', 'desc');
    }

    /**
     * Generate secure route URL for accessing this document's file
     */
    public function getSecureUrlAttribute(): string
    {
        return route('documents.file', $this->id);
    }

    public function isVerified(): bool
    {
        return $this->status === 'verified';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function needsResubmission(): bool
    {
        return $this->status === 'resubmission_requested';
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }
}
