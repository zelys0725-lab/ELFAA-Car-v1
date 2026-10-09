<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'ELFAA Car Rental Notification' }}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f4f4f5;
            color: #18181b;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #f4f4f5;
            padding: 30px 15px;
            box-sizing: border-box;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            border: 1px solid #e4e4e7;
        }
        .header {
            background-color: #09090b;
            padding: 24px 30px;
            text-align: center;
        }
        .header img {
            max-height: 48px;
            width: auto;
        }
        .header-title {
            color: #ffffff;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 1px;
            margin: 8px 0 0 0;
            text-transform: uppercase;
        }
        .header-sub {
            color: #a1a1aa;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 4px;
        }
        .content {
            padding: 32px 30px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            color: #09090b;
            margin-bottom: 16px;
        }
        .text {
            font-size: 14px;
            line-height: 1.6;
            color: #52525b;
            margin-bottom: 20px;
        }
        .btn-container {
            text-align: center;
            margin: 28px 0;
        }
        .btn {
            display: inline-block;
            background-color: #FF3B30;
            color: #ffffff !important;
            text-decoration: none;
            font-size: 13px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 14px 28px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(255, 59, 48, 0.25);
        }
        .badge {
            display: inline-block;
            padding: 6px 14px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .badge-success { background-color: #dcfce7; color: #15803d; }
        .badge-warning { background-color: #fef9c3; color: #a16207; }
        .badge-danger { background-color: #fee2e2; color: #b91c1c; }
        .badge-info { background-color: #e0f2fe; color: #0369a1; }

        .details-card {
            background-color: #fafafa;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }
        .details-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px dashed #e4e4e7;
            font-size: 13px;
        }
        .details-row:last-child {
            border-bottom: none;
        }
        .details-label {
            color: #71717a;
            font-weight: 600;
        }
        .details-value {
            color: #09090b;
            font-weight: 700;
            text-align: right;
        }
        .footer {
            background-color: #f4f4f5;
            padding: 24px 30px;
            text-align: center;
            border-top: 1px solid #e4e4e7;
        }
        .footer-text {
            font-size: 12px;
            color: #71717a;
            line-height: 1.5;
            margin: 4px 0;
        }
        .footer-links a {
            color: #FF3B30;
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
            margin: 0 8px;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-title">ELFAA CAR RENTAL</div>
                <div class="header-sub">Self-Drive & Luxury Fleet Services</div>
            </div>

            <!-- Content Area -->
            <div class="content">
                @yield('content')
            </div>

            <!-- Footer -->
            <div class="footer">
                <p class="footer-text">Need assistance? Contact our 24/7 Support Team.</p>
                <p class="footer-text">&copy; {{ date('Y') }} ELFAA Car Rental Services. All rights reserved.</p>
                <div class="footer-links" style="margin-top: 10px;">
                    <a href="{{ config('app.url') }}">Visit Website</a> &bull;
                    <a href="{{ config('app.url') }}/my-bookings">My Bookings</a>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
