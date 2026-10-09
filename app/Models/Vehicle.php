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
    ];

    protected function casts(): array
    {
        return [
            'features' => 'array',
            'images' => 'array',
            'price_per_day' => 'decimal:2',
            'purchase_cost' => 'decimal:2',
        ];
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
