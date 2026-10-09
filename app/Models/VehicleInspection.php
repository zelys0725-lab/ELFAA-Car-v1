<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VehicleInspection extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'vehicle_id',
        'inspector_id',
        'type',
        'fuel_bars',
        'odometer_reading',
        'notes',
        'photos',
        'inspected_at',
    ];

    protected function casts(): array
    {
        return [
            'fuel_bars' => 'integer',
            'odometer_reading' => 'integer',
            'photos' => 'array',
            'inspected_at' => 'datetime',
        ];
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function vehicle(): BelongsTo
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    public function charges(): HasMany
    {
        return $this->hasMany(InspectionCharge::class, 'inspection_id');
    }
}
