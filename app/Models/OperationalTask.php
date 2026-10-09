<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OperationalTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'task_type',
        'due_datetime',
        'assigned_staff_id',
        'vehicle_id',
        'booking_id',
        'status',
        'notes',
    ];

    protected $casts = [
        'due_datetime' => 'datetime',
    ];

    public function assignedStaff()
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }

    public function vehicle()
    {
        return $this->belongsTo(Vehicle::class);
    }

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
}
