@extends('emails.layout')

@section('content')
<div class="greeting">Your Security Verification Code</div>

<p class="text">
    Hello <strong>{{ $user->name }}</strong>,
</p>

<p class="text">
    A login or security verification attempt was made for your ELFAA Car Rental account (<strong>{{ $user->email }}</strong>).
    Please use the single-use verification code below to complete your authentication.
</p>

<div style="text-align: center; margin: 32px 0;">
    <div style="display: inline-block; background-color: #09090b; border: 2px solid #FF3B30; border-radius: 12px; padding: 18px 36px; box-shadow: 0 4px 20px rgba(255, 59, 48, 0.15);">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff;">{{ $code }}</span>
    </div>
</div>

<div class="details-card">
    <div class="details-row">
        <span class="details-label">Code Expiration</span>
        <span class="details-value" style="color: #FF3B30;">Valid for {{ $expiresInMinutes }} minutes</span>
    </div>
    <div class="details-row">
        <span class="details-label">Security Protocol</span>
        <span class="details-value">Multi-Factor Authentication (MFA)</span>
    </div>
    <div class="details-row">
        <span class="details-label">Single-Use Only</span>
        <span class="details-value" style="font-weight: normal; color: #71717a;">Invalidated immediately upon entry</span>
    </div>
</div>

<p class="text" style="font-size: 13px; color: #71717a; margin-top: 24px; line-height: 1.6;">
    <strong style="color: #ef4444;">Important:</strong> Never share this code with anyone, including ELFAA staff. If you did not initiate this login request, your password may be compromised. Please change your password immediately or contact support.
</p>
@endsection
