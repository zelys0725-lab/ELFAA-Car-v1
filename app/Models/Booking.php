<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'vehicle_id',
        'start_datetime',
        'end_datetime',
        'pickup_location',
        'dropoff_location',
        'original_price',
        'location_fee',
        'is_out_of_bounds',
        'promo_code',
        'discount_amount',
        'total_price',
        'payment_method',
        'payment_status',
        'payment_reference',
        'payment_proof_path',
        'status',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'start_datetime' => 'datetime',
            'end_datetime' => 'datetime',
            'archived_at' => 'datetime',
            'original_price' => 'decimal:2',
            'location_fee' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'total_price' => 'decimal:2',
            'is_out_of_bounds' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function rating(): HasOne
    {
        return $this->hasOne(Rating::class);
    }
}
