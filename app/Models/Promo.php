<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Promo extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'promo_code',
        'discount_type',
        'discount_value',
        'discount_text',
        'image_url',
        'status',
    ];
}
