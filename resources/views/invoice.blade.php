<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rental Statement & Invoice - #{{ $booking->id }} | ELFAA Car Rental</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; color: #18181b; background: #fff; margin: 0; padding: 40px; }
        .invoice-box { max-width: 800px; margin: auto; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid #e4e4e7; padding-bottom: 24px; margin-bottom: 24px; }
        .logo { font-size: 24px; font-weight: 900; color: #FF3B30; letter-spacing: -0.5px; }
        .sublogo { font-size: 11px; text-transform: uppercase; color: #71717a; font-weight: 700; margin-top: 2px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; text-transform: uppercase; border: 1px solid; }
        .badge-paid { background: #ecfdf5; color: #059669; border-color: #a7f3d0; }
        .badge-pending { background: #fffbeb; color: #d97706; border-color: #fde68a; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #71717a; letter-spacing: 0.05em; margin-bottom: 6px; }
        .info-text { font-size: 13px; font-weight: 600; color: #27272a; margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; }
        th { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #71717a; background: #f4f4f5; padding: 10px 12px; text-align: left; border-bottom: 1px solid #e4e4e7; }
        td { font-size: 13px; padding: 12px; border-bottom: 1px solid #f4f4f5; font-weight: 500; }
        .amount { text-align: right; font-family: monospace; font-weight: 700; }
        .total-row { font-size: 16px; font-weight: 900; background: #fafafa; }
        .total-row td { border-top: 2px solid #e4e4e7; border-bottom: none; }
        .history-box { background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; margin-top: 24px; }
        .print-btn { display: inline-block; background: #18181b; color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 12px; text-decoration: none; cursor: pointer; margin-bottom: 20px; }
        @media print { .no-print { display: none !important; } body { padding: 0; } .invoice-box { border: none; box-shadow: none; padding: 0; } }
    </style>
</head>
<body>

    <div class="no-print" style="max-width: 800px; margin: 0 auto 10px; text-align: right;">
        <button onclick="window.print()" class="print-btn">🖨️ Print / Save PDF</button>
    </div>

    <div class="invoice-box">
        <!-- Header -->
        <div class="header">
            <div>
                <div class="logo">ELFAA CAR RENTAL</div>
                <div class="sublogo">Official Rental Statement & Final Invoice</div>
            </div>
            <div style="text-align: right;">
                <div class="badge {{ $booking->payment_status === 'paid' ? 'badge-paid' : 'badge-pending' }}">
                    Payment: {{ strtoupper($booking->payment_status ?? 'Pending') }}
                </div>
                <div style="font-size: 11px; color: #71717a; margin-top: 6px;">Invoice No: #INV-{{ str_pad($booking->id, 5, '0', STR_PAD_LEFT) }}</div>
                <div style="font-size: 11px; color: #71717a;">Date: {{ now()->format('M d, Y') }}</div>
            </div>
        </div>

        <!-- Details Grid -->
        <div class="grid">
            <div>
                <div class="section-title">Customer Information</div>
                <div class="info-text">{{ $booking->user->name }}</div>
                <div class="info-text" style="color: #71717a; font-weight: 400;">{{ $booking->user->email }}</div>
                <div class="info-text" style="color: #71717a; font-weight: 400;">Phone: {{ $booking->user->phone_number ?? 'N/A' }}</div>
            </div>
            <div>
                <div class="section-title">Vehicle & Rental Period</div>
                <div class="info-text">{{ $booking->vehicle->name }} ({{ $booking->vehicle->plate_number }})</div>
                <div class="info-text" style="color: #71717a; font-weight: 400;">Pickup: {{ \Carbon\Carbon::parse($booking->start_datetime)->format('M d, Y h:i A') }}</div>
                <div class="info-text" style="color: #71717a; font-weight: 400;">Return: {{ \Carbon\Carbon::parse($booking->end_datetime)->format('M d, Y h:i A') }}</div>
            </div>
        </div>

        <!-- Itemized Breakdown Table -->
        <table>
            <thead>
                <tr>
                    <th>Item Description</th>
                    <th>Rate / Base</th>
                    <th class="amount">Amount (PHP)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Base Vehicle Rental</strong>
                        <div style="font-size: 11px; color: #71717a;">{{ $booking->vehicle->name }}</div>
                    </td>
                    <td>PHP {{ number_format($booking->vehicle->price_per_day, 2) }} / day</td>
                    <td class="amount">PHP {{ number_format($booking->original_price, 2) }}</td>
                </tr>

                @if($booking->location_fee > 0)
                <tr>
                    <td>
                        <strong>Location & Out-of-Bounds Delivery Fee</strong>
                        <div style="font-size: 11px; color: #71717a;">Pickup/Dropoff: {{ $booking->pickup_location }}</div>
                    </td>
                    <td>Standard Hub Fee</td>
                    <td class="amount">PHP {{ number_format($booking->location_fee, 2) }}</td>
                </tr>
                @endif

                @if($booking->discount_amount > 0)
                <tr>
                    <td>
                        <strong>Promo Discount Applied</strong>
                        <div style="font-size: 11px; color: #059669;">Code: {{ $booking->promo_code }}</div>
                    </td>
                    <td>Discount Deduction</td>
                    <td class="amount" style="color: #059669;">- PHP {{ number_format($booking->discount_amount, 2) }}</td>
                </tr>
                @endif

                @foreach($booking->inspectionCharges as $charge)
                    @if($charge->status === 'approved')
                    <tr>
                        <td>
                            <strong>Return Surcharge: {{ strtoupper(str_replace('_', ' ', $charge->charge_type)) }}</strong>
                            <div style="font-size: 11px; color: #dc2626;">{{ $charge->description }}</div>
                        </td>
                        <td>Inspection Fee</td>
                        <td class="amount" style="color: #dc2626;">+ PHP {{ number_format($charge->amount, 2) }}</td>
                    </tr>
                    @endif
                @endforeach

                @if($booking->security_deposit > 0)
                <tr>
                    <td>
                        <strong>Refundable Security Deposit</strong>
                        <div style="font-size: 11px; color: #2563eb;">Subject to post-return vehicle check</div>
                    </td>
                    <td>Security Deposit</td>
                    <td class="amount">PHP {{ number_format($booking->security_deposit, 2) }}</td>
                </tr>
                @endif

                <tr class="total-row">
                    <td colspan="2">TOTAL AGREED RENTAL AMOUNT</td>
                    <td class="amount">PHP {{ number_format($booking->total_price, 2) }}</td>
                </tr>

                <tr>
                    <td colspan="2" style="color: #059669; font-weight: 700;">Amount Received / Paid to Date</td>
                    <td class="amount" style="color: #059669;">- PHP {{ number_format($booking->amount_paid ?? 0, 2) }}</td>
                </tr>

                <tr style="font-size: 15px; font-weight: 900; background: #fff1f2; color: #991b1b;">
                    <td colspan="2">REMAINING UNPAID BALANCE</td>
                    <td class="amount">PHP {{ number_format(max(0, $booking->total_price - ($booking->amount_paid ?? 0)), 2) }}</td>
                </tr>
            </tbody>
        </table>

        <!-- Itemized Payment Transaction Logs (Feature #8) -->
        @if($booking->payments && $booking->payments->count() > 0)
        <div class="history-box" style="margin-bottom: 24px;">
            <div class="section-title" style="margin-bottom: 10px;">Itemized Payment & Cash/COD Collections History</div>
            <table style="margin: 0; font-size: 12px;">
                <thead>
                    <tr>
                        <th style="background: #fff;">Date & Time</th>
                        <th style="background: #fff;">Method / Type</th>
                        <th style="background: #fff;">Collector / Reference</th>
                        <th style="background: #fff;" class="amount">Amount Collected</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($booking->payments as $payment)
                    <tr>
                        <td>{{ $payment->created_at->format('M d, Y h:i A') }}</td>
                        <td>
                            <strong style="text-transform: uppercase;">{{ $payment->payment_method }}</strong>
                            <div style="font-size: 10px; color: #71717a;">{{ ucfirst(str_replace('_', ' ', $payment->payment_type)) }}</div>
                        </td>
                        <td>
                            {{ $payment->collector->name ?? 'Staff' }}
                            @if($payment->reference_number)
                                <div style="font-size: 10px; font-family: monospace; color: #71717a;">Ref: #{{ $payment->reference_number }}</div>
                            @endif
                        </td>
                        <td class="amount" style="color: #059669; font-weight: 700;">
                            + PHP {{ number_format($payment->amount_collected, 2) }}
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        <!-- Price Change History Log (Feature #7 Audit Log) -->
        @if($booking->priceHistories && $booking->priceHistories->count() > 0)
        <div class="history-box">
            <div class="section-title" style="margin-bottom: 10px;">Audit Log - Statement Adjustment History</div>
            @foreach($booking->priceHistories as $history)
                <div style="font-size: 11px; padding: 6px 0; border-bottom: 1px border-dashed #e4e4e7; display: flex; justify-content: space-between;">
                    <div>
                        <strong>{{ $history->created_at->format('M d, Y h:i A') }}</strong> — 
                        Adjusted by {{ $history->changedBy->name ?? 'Staff' }}
                        <div style="color: #71717a; margin-top: 2px;">Reason: {{ $history->reason }}</div>
                    </div>
                    <div style="text-align: right; font-family: monospace;">
                        <span style="color: #71717a;">PHP {{ number_format($history->previous_total, 2) }} &rarr;</span>
                        <strong style="color: {{ $history->change_amount >= 0 ? '#dc2626' : '#059669' }};">
                            PHP {{ number_format($history->new_total, 2) }}
                        </strong>
                    </div>
                </div>
            @endforeach
        </div>
        @endif

        <div style="margin-top: 32px; font-size: 11px; color: #71717a; text-align: center; border-t: 1px solid #f4f4f5; padding-top: 16px;">
            Thank you for choosing ELFAA Car Rental! For inquiries regarding this invoice, contact support at <strong>elfaacarrental@gmail.com</strong>.
        </div>
    </div>

</body>
</html>
