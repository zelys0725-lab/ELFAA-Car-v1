<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vehicle extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'plate_number',
        'type',
        'seats',
        'transmission',
        'fuel_type',
        'price_per_day',
        'purchase_cost',
        'description',
        'features',
        'status',
        'damage_notes',
        'meetup_location',
        'images',
        'created_by',
        'owner_role',
        'is_approved',
        'gps_enabled',
        'gps_device_id',
        'gps_tracker_key',
        'last_latitude',
        'last_longitude',
        'current_speed',
        'last_gps_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'images' => 'array',
            'price_per_day' => 'decimal:2',
            'purchase_cost' => 'decimal:2',
            'is_approved' => 'boolean',
            'gps_enabled' => 'boolean',
            'last_latitude' => 'decimal:7',
            'last_longitude' => 'decimal:7',
            'current_speed' => 'decimal:2',
            'last_gps_updated_at' => 'datetime',
        ];
    }

    public function gpsLogs(): HasMany
    {
        return $this->hasMany(VehicleGpsLog::class)->orderBy('recorded_at', 'desc');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopePrioritized($query)
    {
        // Priority 1: Admin-published vehicles
        // Priority 2: Staff-published vehicles
        return $query->orderByRaw("CASE WHEN owner_role = 'admin' THEN 1 WHEN owner_role = 'staff' THEN 2 ELSE 3 END");
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function unavailableDates(): HasMany
    {
        return $this->hasMany(VehicleUnavailableDate::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(VehicleExpense::class);
    }

    public function ratings(): HasMany
    {
        return $this->hasMany(Rating::class);
    }
}
