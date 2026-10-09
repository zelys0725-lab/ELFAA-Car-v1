<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BookingPriceHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'changed_by_id',
        'previous_total',
        'new_total',
        'change_amount',
        'reason',
        'breakdown_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'previous_total' => 'decimal:2',
            'new_total' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'breakdown_snapshot' => 'array',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_id');
    }
}
