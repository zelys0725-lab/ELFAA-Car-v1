<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BillRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'biller_name',
        'bill_category',
        'account_number',
        'amount',
        'due_date',
        'payment_date',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'due_date' => 'date:Y-m-d',
        'payment_date' => 'date:Y-m-d',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
