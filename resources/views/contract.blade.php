<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ELFAA Car Rental Agreement - Booking #{{ $booking->id }}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 8mm 10mm;
        }

        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }

        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1a1a1a;
            background: #f4f4f5;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            line-height: 1.35;
        }

        .no-print-bar {
            max-width: 820px;
            margin: 0 auto 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 12px;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }

        .btn-print {
            background: #b91c1c;
            color: #ffffff;
        }

        .btn-print:hover {
            background: #991b1b;
        }

        .btn-close {
            background: #27272a;
            color: #ffffff;
        }

        .btn-close:hover {
            background: #3f3f46;
        }

        .contract-container {
            max-width: 820px;
            margin: 0 auto;
            background: #ffffff;
            padding: 16px 20px;
            border: 1px solid #d4d4d8;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        }

        /* HEADER */
        .contract-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #b91c1c;
            padding-bottom: 8px;
            margin-bottom: 10px;
        }

        .brand-title {
            font-size: 22px;
            font-weight: 900;
            color: #b91c1c;
            letter-spacing: -0.5px;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.1;
        }

        .brand-subtitle {
            font-size: 11px;
            color: #52525b;
            font-weight: 600;
            margin-top: 2px;
        }

        .logo-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            text-align: right;
        }

        .logo-text {
            font-size: 16px;
            font-weight: 900;
            color: #b91c1c;
            letter-spacing: 0.5px;
        }

        .logo-sub {
            font-size: 8px;
            color: #71717a;
            text-transform: uppercase;
            font-weight: bold;
        }

        /* PARTIES (LESSOR / LESSEE) */
        .parties-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 10px;
        }

        .party-box {
            border: 1px solid #e4e4e7;
            padding: 8px 10px;
            border-radius: 4px;
            background: #fafafa;
        }

        .party-tag {
            font-size: 12px;
            font-weight: 900;
            color: #b91c1c;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            display: inline-block;
            border-bottom: 1.5px solid #b91c1c;
            padding-bottom: 1px;
        }

        .party-details {
            font-size: 10.5px;
            line-height: 1.35;
            color: #27272a;
        }

        .party-details strong {
            color: #09090b;
        }

        .field-row {
            display: flex;
            margin-bottom: 3px;
        }

        .field-label {
            font-weight: 700;
            min-width: 55px;
            color: #52525b;
            font-size: 10px;
        }

        .field-value {
            font-weight: 600;
            color: #09090b;
            border-bottom: 1px dotted #a1a1aa;
            flex: 1;
            padding-left: 4px;
        }

        /* SECTION BARS */
        .section-bar {
            background: #b91c1c;
            color: #ffffff;
            font-weight: 900;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 4px 8px;
            margin-top: 8px;
            margin-bottom: 6px;
            border-radius: 2px;
        }

        /* SECTION 1: 3-COLUMNS */
        .sec1-grid {
            display: grid;
            grid-template-columns: 1.1fr 1.1fr 1fr;
            gap: 8px;
            margin-bottom: 6px;
        }

        .sec1-col {
            background: #ffffff;
            border: 1px solid #e4e4e7;
            padding: 6px 8px;
            border-radius: 3px;
        }

        .sec1-col-title {
            font-size: 9.5px;
            font-weight: 800;
            color: #b91c1c;
            text-transform: uppercase;
            border-bottom: 1px solid #fecaca;
            padding-bottom: 3px;
            margin-bottom: 5px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-bottom: 3px;
            line-height: 1.25;
        }

        .info-row .lbl {
            color: #52525b;
            font-weight: 600;
        }

        .info-row .val {
            color: #09090b;
            font-weight: 700;
            text-align: right;
        }

        .drivers-subrow {
            display: grid;
            grid-template-columns: 1.1fr 1.1fr;
            gap: 10px;
            background: #fafafa;
            border: 1px solid #e4e4e7;
            padding: 5px 8px;
            margin-top: 4px;
            border-radius: 3px;
            font-size: 9.5px;
        }

        .driver-notice {
            font-size: 8.5px;
            color: #b91c1c;
            font-style: italic;
            font-weight: 700;
            margin-top: 2px;
        }

        /* SECTION 2: POLICIES */
        .policies-list {
            margin: 0;
            padding: 0;
            list-style: none;
            font-size: 9.25px;
            line-height: 1.35;
        }

        .policies-list li {
            position: relative;
            padding-left: 14px;
            margin-bottom: 4.5px;
            color: #27272a;
            text-align: justify;
        }

        .policies-list li::before {
            content: "•";
            position: absolute;
            left: 3px;
            top: -1px;
            color: #b91c1c;
            font-size: 12px;
            font-weight: 900;
        }

        .policies-list strong {
            color: #09090b;
            font-weight: 800;
        }

        .highlight-red {
            color: #b91c1c;
            font-weight: 800;
        }

        /* SECTION 3: INSPECTION DIAGRAM */
        .inspection-guide {
            font-size: 9px;
            color: #3f3f46;
            margin-bottom: 6px;
            background: #fff1f2;
            padding: 3px 6px;
            border-left: 3px solid #b91c1c;
            font-weight: 600;
        }

        .diagram-container {
            display: flex;
            justify-content: space-around;
            align-items: center;
            background: #ffffff;
            border: 1px solid #e4e4e7;
            padding: 8px 4px;
            border-radius: 4px;
            margin-bottom: 8px;
        }

        .diagram-box {
            text-align: center;
            flex: 1;
        }

        .diagram-box svg {
            max-width: 130px;
            max-height: 75px;
            stroke: #374151;
            fill: none;
            display: block;
            margin: 0 auto;
        }

        .diagram-label {
            font-size: 8px;
            font-weight: 800;
            text-transform: uppercase;
            color: #71717a;
            margin-top: 3px;
        }

        /* SIGNATURES */
        .signatures-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-top: 14px;
            padding-top: 8px;
            border-top: 1px solid #e4e4e7;
        }

        .sig-block {
            text-align: center;
        }

        .sig-line {
            border-bottom: 1.5px solid #09090b;
            width: 85%;
            margin: 24px auto 4px;
        }

        .sig-name {
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            color: #09090b;
            letter-spacing: 0.5px;
        }

        .sig-role {
            font-size: 9px;
            color: #52525b;
            font-weight: 600;
        }

        .footer-note {
            text-align: center;
            font-size: 8.5px;
            color: #71717a;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        @media print {
            .no-print-bar {
                display: none !important;
            }
            body {
                background: #ffffff !important;
                padding: 0 !important;
                margin: 0 !important;
            }
            .contract-container {
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                max-width: 100% !important;
            }
        }
    </style>
</head>
<body>

    @php
        $pickupInspection = $booking->inspections ? $booking->inspections->firstWhere('type', 'pickup') : null;
        $returnInspection = $booking->inspections ? $booking->inspections->firstWhere('type', 'return') : null;
        
        $startDate = \Carbon\Carbon::parse($booking->start_datetime);
        $endDate = \Carbon\Carbon::parse($booking->end_datetime);
        $totalHours = $startDate->diffInHours($endDate);
        $totalDays = max(1, (int) ceil($totalHours / 24));
        
        $rentalRate = (float) ($booking->original_price ?? 0);
        $deliveryFee = (float) ($booking->location_fee ?? 0);
        $downpayment = (float) ($booking->amount_paid ?? 0);
        $totalPayment = (float) ($booking->total_price ?? 0);
        $remainingBal = max(0, $totalPayment - $downpayment);

        $primaryDriver = $booking->user->name ?? 'N/A';
        $licenseNo = $booking->user->drivers_license_number ?? ($booking->user->id_number ?? 'ON FILE / SUBMITTED');
        $phone = $booking->user->phone ?? 'N/A';
        $address = $booking->pickup_location ?? 'Sto. Tomas, Batangas';
    @endphp

    <!-- Screen Control Buttons (Hidden when printing) -->
    <div class="no-print-bar">
        <div>
            <span style="font-weight: 800; font-size: 13px; color: #27272a;">ELFAA Official Car Rental Contract</span>
            <span style="font-size: 11px; color: #71717a; margin-left: 8px;">Reservation #{{ $booking->id }}</span>
        </div>
        <div style="display: flex; gap: 8px;">
            <button onclick="window.print()" class="btn btn-print">
                🖨️ Print Agreement / Save PDF
            </button>
            <button onclick="window.close()" class="btn btn-close">
                ✕ Close Window
            </button>
        </div>
    </div>

    <!-- Printable Legal Contract Document (A4 Fit) -->
    <div class="contract-container">
        
        <!-- HEADER -->
        <div class="contract-header">
            <div>
                <h1 class="brand-title">ELFAA CAR RENTAL AGREEMENT</h1>
                <div class="brand-subtitle">Sto. Tomas, Batangas, Philippines</div>
            </div>
            <div class="logo-badge">
                <div>
                    <div class="logo-text">ELFAA</div>
                    <div class="logo-sub">Car Rental • Batangas</div>
                </div>
            </div>
        </div>

        <!-- PARTIES: LESSOR & LESSEE -->
        <div class="parties-grid">
            <!-- LESSOR -->
            <div class="party-box">
                <span class="party-tag">LESSOR</span>
                <div class="party-details">
                    <div style="font-weight: 800; font-size: 11px; color: #09090b;">Mika Jane A. Aranzanso</div>
                    <div>B4 L5 Mercedes Homes Brgy. San Isidro Norte, Sto. Tomas, Batangas</div>
                    <div><strong>Phone:</strong> 09171808228</div>
                </div>
            </div>

            <!-- LESSEE -->
            <div class="party-box">
                <span class="party-tag">LESSEE</span>
                <div class="party-details">
                    <div class="field-row">
                        <span class="field-label">Name:</span>
                        <span class="field-value">{{ $primaryDriver }}</span>
                    </div>
                    <div class="field-row">
                        <span class="field-label">Address:</span>
                        <span class="field-value">{{ $address }}</span>
                    </div>
                    <div class="field-row">
                        <span class="field-label">Phone:</span>
                        <span class="field-value">{{ $phone }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- SECTION 1: VEHICLE, RENTAL PERIOD & FINANCIALS -->
        <div class="section-bar">
            1. VEHICLE, RENTAL PERIOD & FINANCIALS
        </div>

        <div class="sec1-grid">
            <!-- Vehicle Information -->
            <div class="sec1-col">
                <div class="sec1-col-title">Vehicle Information</div>
                <div class="info-row">
                    <span class="lbl">Model / Year:</span>
                    <span class="val">{{ $booking->vehicle->name ?? 'Vehicle' }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">Color / Type:</span>
                    <span class="val">{{ $booking->vehicle->type ?? 'Standard' }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">Plate No:</span>
                    <span class="val" style="font-family: monospace;">{{ $booking->vehicle->plate_number ?? 'N/A' }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">Gas Level:</span>
                    <span class="val">{{ $pickupInspection && $pickupInspection->fuel_bars ? $pickupInspection->fuel_bars . '/8 Bars' : 'Full (Return Level)' }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">RFID Bal:</span>
                    <span class="val">Pre-loaded / Auto-debit</span>
                </div>
            </div>

            <!-- Rental Period -->
            <div class="sec1-col">
                <div class="sec1-col-title">Rental Period</div>
                <div class="info-row">
                    <span class="lbl">Start Date/Time:</span>
                    <span class="val">{{ $startDate->format('M d, Y h:i A') }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">End Date/Time:</span>
                    <span class="val">{{ $endDate->format('M d, Y h:i A') }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">Total Hrs/Days:</span>
                    <span class="val">{{ $totalDays }} Day(s) ({{ $totalHours }} Hrs)</span>
                </div>
                <div class="info-row">
                    <span class="lbl">Destination:</span>
                    <span class="val">{{ $booking->dropoff_location ?? ($booking->pickup_location ?? 'Standard Route') }}</span>
                </div>
            </div>

            <!-- Rental Financials -->
            <div class="sec1-col">
                <div class="sec1-col-title">Rental Financials</div>
                <div class="info-row">
                    <span class="lbl">Rental Rate:</span>
                    <span class="val">₱{{ number_format($rentalRate, 2) }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">Delivery Fee:</span>
                    <span class="val">₱{{ number_format($deliveryFee, 2) }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">Downpayment:</span>
                    <span class="val" style="color: #15803d;">₱{{ number_format($downpayment, 2) }}</span>
                </div>
                <div class="info-row">
                    <span class="lbl">Remaining Bal:</span>
                    <span class="val" style="color: #b91c1c;">₱{{ number_format($remainingBal, 2) }}</span>
                </div>
                <div class="info-row" style="border-top: 1px solid #fecaca; padding-top: 2px; margin-top: 2px;">
                    <span class="lbl" style="font-weight: 800; color: #09090b;">Total Payment:</span>
                    <span class="val" style="font-weight: 900; color: #b91c1c;">₱{{ number_format($totalPayment, 2) }}</span>
                </div>
            </div>
        </div>

        <!-- DRIVER DESIGNATION -->
        <div class="drivers-subrow">
            <div>
                <strong>Primary Driver:</strong> {{ $primaryDriver }}
                &nbsp;|&nbsp;
                <strong>Driver's License #:</strong> <span style="font-family: monospace;">{{ $licenseNo }}</span>
            </div>
            <div>
                <strong>Additional Driver:</strong> ____________________________
                &nbsp;|&nbsp;
                <strong>Driver's License #:</strong> ________________
            </div>
        </div>
        <div class="driver-notice">Only approved drivers may operate vehicle.</div>

        <!-- SECTION 2: PROHIBITED ACTIVITIES & NON-REFUNDABLE POLICIES -->
        <div class="section-bar">
            2. PROHIBITED ACTIVITIES & NON-REFUNDABLE POLICIES
        </div>

        <ul class="policies-list">
            <li>
                <strong>Prohibitions:</strong> Strict <span class="highlight-red">NO SMOKING</span> policy inside the vehicle at any time. The vehicle must not be used for any illegal transactions, transport of contraband, criminal activity, sub-leasing, or off-road/improper usage outside its original design.
            </li>
            <li>
                <strong>Non-Refundable:</strong> <span class="highlight-red">No refunds/credits</span> will be issued for excess fuel remaining in the tank, unused pre-loaded RFID balances, early vehicle returns, or unused hours. Cancellations must be made at least <strong>2 days prior</strong> to the start date, or a <strong>50% rental charge</strong> will apply.
            </li>
            <li>
                <strong>Contract Violations:</strong> Any breach of these rules gives the Owner the right to immediately terminate the agreement and demand instant repossession of the vehicle.
            </li>
            <li>
                <strong>Destination Deviation & Late Fees:</strong> A penalty of <span class="highlight-red">₱500.00</span> applies for driving beyond agreed limits. Unauthorized extensions incur <span class="highlight-red">₱200.00 per hour</span>; delays exceeding 6 hours trigger a full daily rental charge. A cleaning fee of <span class="highlight-red">₱200.00</span> applies for excessive dirt.
            </li>
            <li>
                <strong>Keys & Tires:</strong> Renter covers all tire vulcanizing/replacement costs and a minimum fee of <span class="highlight-red">₱7,500.00 and up</span> for lost or damaged keys.
            </li>
            <li>
                <strong>Body Damage Penalty:</strong> Any scratch, dent, scrape, or damage to the unit body—<span class="highlight-red">regardless of how minor or small it may be</span>—will automatically be charged at a flat rate of <span class="highlight-red">₱4,500.00 per affected panel</span>.
            </li>
            <li>
                <strong>Full Damage Liability:</strong> Renter assumes all financial risk for theft, collision, loss, or destruction. Renter agrees to pay 100% of the actual repair costs or the current full market value of the vehicle if it is deemed a total loss.
            </li>
            <li>
                <strong>Shop Participation & Negligence Fee:</strong> The Renter must pay <strong>100% of the daily rental rate</strong> for every single day the vehicle remains in the repair shop. In case of damage, Renter must secure a police report and provide a driver's license photocopy within 24 hours. Failure to do so makes the Renter entirely liable for 100% of parts and labor out-of-pocket, plus the standard daily rate during down-time.
            </li>
        </ul>

        <!-- SECTION 3: VEHICLE CONDITION INSPECTION REPORT -->
        <div class="section-bar">
            3. VEHICLE CONDITION INSPECTION REPORT
        </div>

        <div class="inspection-guide">
            Guide: Mark pre-existing marks using: <strong>[X] Scratch/Scrape</strong> | <strong>[D] Dent</strong> | <strong>[M] Missing</strong>. (*₱4,500/panel fee for new damage)
        </div>

        <!-- Vehicle Inspection Blueprint Diagram SVG -->
        <div class="diagram-container">
            <!-- Front View -->
            <div class="diagram-box">
                <svg viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg">
                    <rect x="15" y="15" width="70" height="40" rx="8" stroke-width="2" />
                    <line x1="22" y1="23" x2="78" y2="23" stroke-width="1.5" />
                    <rect x="25" y="42" width="50" height="8" rx="2" stroke-width="1.5" />
                    <circle cx="25" cy="30" r="5" stroke-width="1.5" />
                    <circle cx="75" cy="30" r="5" stroke-width="1.5" />
                    <line x1="10" y1="28" x2="15" y2="28" stroke-width="2" />
                    <line x1="85" y1="28" x2="90" y2="28" stroke-width="2" />
                </svg>
                <div class="diagram-label">Front</div>
            </div>

            <!-- Left Side View -->
            <div class="diagram-box">
                <svg viewBox="0 0 120 55" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 10 35 L 25 35 Q 32 20 40 20 L 75 20 Q 85 20 95 35 L 110 35 L 110 42 L 10 42 Z" stroke-width="1.8" />
                    <circle cx="30" cy="42" r="8" stroke-width="2" fill="#fff" />
                    <circle cx="90" cy="42" r="8" stroke-width="2" fill="#fff" />
                    <line x1="60" y1="20" x2="60" y2="40" stroke-width="1.2" />
                    <rect x="42" y="23" width="16" height="10" stroke-width="1" />
                    <rect x="62" y="23" width="18" height="10" stroke-width="1" />
                </svg>
                <div class="diagram-label">Left Side</div>
            </div>

            <!-- Top View -->
            <div class="diagram-box">
                <svg viewBox="0 0 70 110" xmlns="http://www.w3.org/2000/svg">
                    <rect x="15" y="10" width="40" height="90" rx="10" stroke-width="2" />
                    <!-- Windshield -->
                    <line x1="20" y1="30" x2="50" y2="30" stroke-width="1.5" />
                    <!-- Roof -->
                    <rect x="20" y="34" width="30" height="42" rx="3" stroke-width="1.2" />
                    <!-- Rear Windshield -->
                    <line x1="20" y1="80" x2="50" y2="80" stroke-width="1.5" />
                    <!-- Mirrors -->
                    <rect x="8" y="32" width="6" height="4" rx="1" stroke-width="1.5" />
                    <rect x="56" y="32" width="6" height="4" rx="1" stroke-width="1.5" />
                </svg>
                <div class="diagram-label">Top / Roof</div>
            </div>

            <!-- Right Side View -->
            <div class="diagram-box">
                <svg viewBox="0 0 120 55" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 110 35 L 95 35 Q 88 20 80 20 L 45 20 Q 35 20 25 35 L 10 35 L 10 42 L 110 42 Z" stroke-width="1.8" />
                    <circle cx="90" cy="42" r="8" stroke-width="2" fill="#fff" />
                    <circle cx="30" cy="42" r="8" stroke-width="2" fill="#fff" />
                    <line x1="60" y1="20" x2="60" y2="40" stroke-width="1.2" />
                    <rect x="62" y="23" width="16" height="10" stroke-width="1" />
                    <rect x="40" y="23" width="18" height="10" stroke-width="1" />
                </svg>
                <div class="diagram-label">Right Side</div>
            </div>

            <!-- Rear View -->
            <div class="diagram-box">
                <svg viewBox="0 0 100 65" xmlns="http://www.w3.org/2000/svg">
                    <rect x="15" y="15" width="70" height="40" rx="8" stroke-width="2" />
                    <line x1="22" y1="23" x2="78" y2="23" stroke-width="1.5" />
                    <rect x="25" y="42" width="50" height="8" rx="2" stroke-width="1.5" />
                    <rect x="22" y="28" width="10" height="6" rx="1" stroke-width="1.5" fill="#fecaca" />
                    <rect x="68" y="28" width="10" height="6" rx="1" stroke-width="1.5" fill="#fecaca" />
                    <rect x="40" y="32" width="20" height="6" stroke-width="1" />
                </svg>
                <div class="diagram-label">Rear</div>
            </div>
        </div>

        @if($booking->vehicle->damage_notes)
        <div style="font-size: 8.5px; color: #71717a; margin-top: -4px; margin-bottom: 6px; padding: 2px 6px; background: #fafafa; border: 1px dashed #e4e4e7;">
            <strong>Pre-existing Notes on Record:</strong> {{ $booking->vehicle->damage_notes }}
        </div>
        @endif

        <!-- SIGNATURES -->
        <div class="signatures-grid">
            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-name">MIKA JANE A. ARANZANSO</div>
                <div class="sig-role">Lessor Signature | Date: {{ now()->format('M d, Y') }}</div>
            </div>

            <div class="sig-block">
                <div class="sig-line"></div>
                <div class="sig-name">{{ $primaryDriver }}</div>
                <div class="sig-role">Renter Signature over Printed Name / Lessee | Date: {{ now()->format('M d, Y') }}</div>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="footer-note">
            ELFAA Car Rental Agreement & Condition Report • B4 L5 Mercedes Homes, Sto. Tomas, Batangas • Phone: 09171808228
        </div>

    </div>

</body>
</html>
