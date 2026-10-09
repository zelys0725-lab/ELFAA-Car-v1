@extends('emails.layout')

@section('content')
<div class="greeting">Reset Your Password</div>

<p class="text">
    Hello <strong>{{ $user->name }}</strong>,
</p>

<p class="text">
    We received a request to reset the password for your ELFAA Car Rental account associated with <strong>{{ $user->email }}</strong>.
</p>

<p class="text">
    Click the button below to reset your password. This password reset link is valid for <strong>60 minutes</strong>.
</p>

<div class="btn-container">
    <a href="{{ $resetUrl }}" class="btn" target="_blank">Reset Account Password</a>
</div>

<div class="details-card">
    <div class="details-row">
        <span class="details-label">Security Notice</span>
        <span class="details-value" style="color: #71717a; font-weight: normal;">If you did not request a password reset, no further action is required. Your account remains secure.</span>
    </div>
</div>

<p class="text" style="font-size: 12px; color: #a1a1aa; margin-top: 24px;">
    If you're having trouble clicking the "Reset Account Password" button, copy and paste the URL below into your web browser:<br>
    <a href="{{ $resetUrl }}" style="color: #FF3B30; word-break: break-all;">{{ $resetUrl }}</a>
</p>
@endsection
