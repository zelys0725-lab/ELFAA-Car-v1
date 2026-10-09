<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'collector_id',
        'amount_collected',
        'payment_method',
        'payment_type',
        'reference_number',
        'notes',
    ];

    protected $casts = [
        'amount_collected' => 'float',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }

    public function collector()
    {
        return $this->belongsTo(User::class, 'collector_id');
    }
}
