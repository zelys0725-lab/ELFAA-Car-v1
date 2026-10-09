@extends('emails.layout')

@section('content')

@if($type === 'booking_created')
    <div class="greeting">Booking Request Received!</div>
    <p class="text">
        Hello <strong>{{ $booking->user->name ?? 'Valued Customer' }}</strong>,
    </p>
    <p class="text">
        Thank you for choosing ELFAA Car Rental! Your booking request has been submitted successfully. Our team will review your details and confirm your reservation shortly.
    </p>
    <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-warning">Status: Pending Review</span>
    </div>

@elseif($type === 'booking_approved' || $type === 'booking_confirmed')
    <div class="greeting" style="color: #16a34a;">🎉 Booking Approved & Confirmed!</div>
    <p class="text">
        Great news, <strong>{{ $booking->user->name ?? 'Valued Customer' }}</strong>!
    </p>
    <p class="text">
        Your vehicle reservation has been <strong>approved and confirmed</strong>. Your car is reserved and will be ready for pickup/delivery as requested.
    </p>
    <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-success">Status: Confirmed</span>
    </div>

@elseif($type === 'booking_rejected')
    <div class="greeting" style="color: #dc2626;">Booking Request Update</div>
    <p class="text">
        Hello <strong>{{ $booking->user->name ?? 'Valued Customer' }}</strong>,
    </p>
    <p class="text">
        We regret to inform you that your booking request <strong>#{{ $booking->id }}</strong> could not be approved at this time.
    </p>
    @if(!empty($reason))
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: bold;">Reason for Rejection:</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #7f1d1d;">{{ $reason }}</p>
        </div>
    @endif
    <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-danger">Status: Rejected</span>
    </div>

@elseif($type === 'booking_cancelled')
    <div class="greeting" style="color: #4b5563;">Booking Cancelled</div>
    <p class="text">
        Hello <strong>{{ $booking->user->name ?? 'Valued Customer' }}</strong>,
    </p>
    <p class="text">
        Your reservation <strong>#{{ $booking->id }}</strong> has been officially cancelled.
    </p>
    <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-danger">Status: Cancelled</span>
    </div>

@elseif($type === 'admin_booking_alert')
    <div class="greeting">🚨 New Booking Submission Alert</div>
    <p class="text">
        A new rental booking has been submitted on the ELFAA Car Rental Platform and requires admin review.
    </p>
    <div style="text-align: center; margin-bottom: 20px;">
        <span class="badge badge-info">Action Required</span>
    </div>
@endif

<!-- Booking Summary Box -->
<div class="details-card">
    <div style="font-size: 14px; font-weight: 800; text-transform: uppercase; color: #09090b; margin-bottom: 12px; border-bottom: 2px solid #09090b; padding-bottom: 6px; letter-spacing: 0.5px;">
        Reservation Details (#{{ $booking->id }})
    </div>
    
    <div class="details-row">
        <span class="details-label">Vehicle</span>
        <span class="details-value">{{ $booking->vehicle->make ?? '' }} {{ $booking->vehicle->model ?? 'Rental Vehicle' }} ({{ $booking->vehicle->year ?? '' }})</span>
    </div>

    <div class="details-row">
        <span class="details-label">Pickup Date & Time</span>
        <span class="details-value">{{ \Carbon\Carbon::parse($booking->start_datetime)->format('M d, Y - h:i A') }}</span>
    </div>

    <div class="details-row">
        <span class="details-label">Drop-off Date & Time</span>
        <span class="details-value">{{ \Carbon\Carbon::parse($booking->end_datetime)->format('M d, Y - h:i A') }}</span>
    </div>

    <div class="details-row">
        <span class="details-label">Pickup Location</span>
        <span class="details-value">{{ $booking->pickup_location ?? 'Main HQ / Station' }}</span>
    </div>

    <div class="details-row">
        <span class="details-label">Drop-off Location</span>
        <span class="details-value">{{ $booking->dropoff_location ?: ($booking->pickup_location ?? 'Main HQ / Station') }}</span>
    </div>

    <div class="details-row">
        <span class="details-label">Total Amount</span>
        <span class="details-value" style="color: #FF3B30; font-size: 15px;">₱{{ number_format($booking->total_price ?? 0, 2) }}</span>
    </div>

    <div class="details-row">
        <span class="details-label">Payment Method</span>
        <span class="details-value" style="text-transform: uppercase;">{{ $booking->payment_method ?? 'Cash' }}</span>
    </div>
</div>

<div class="btn-container">
    <a href="{{ config('app.url') }}/my-bookings" class="btn" target="_blank">View Booking Details</a>
</div>

<p class="text" style="font-size: 13px; color: #71717a;">
    If you have any questions or need to make modifications to your trip, please contact our support desk or reply directly to this email.
</p>
@endsection
