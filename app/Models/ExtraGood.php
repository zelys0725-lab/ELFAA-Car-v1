<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ExtraGood extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price_per_day',
        'description',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'price_per_day' => 'decimal:2',
        ];
    }
}
