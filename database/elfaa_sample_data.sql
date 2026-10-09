-- ============================================================
--  ELFAA CAR RENTAL — Comprehensive Sample Data
--  Compatible with: MySQL / MariaDB
--  Run AFTER: php artisan migrate (fresh database)
--  Passwords are bcrypt of "password"
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- 1. USERS  (admin, staff + 6 clients)
-- ------------------------------------------------------------
TRUNCATE TABLE users;

INSERT INTO users (id, name, email, phone, drivers_license_number, id_number, id_type, password, role, status, email_verified_at, terms_accepted_at, created_at, updated_at) VALUES
(1,  'ELFAA Admin Officer',   'admin@elfaa.com',              '09171234567', NULL,          NULL,          NULL,         '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin',  'active', NOW(), NULL,  NOW(), NOW()),
(2,  'Mark Staff Inspector',  'staff@elfaa.com',              '09177654321', NULL,          NULL,          NULL,         '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff',  'active', NOW(), NULL,  NOW(), NOW()),
(3,  'Juan Dela Cruz',        'juan.delacruz@gmail.com',      '09223334444', 'N03-20-123456', 'PS-123456', 'Passport',  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'active', NOW(), NOW(), NOW(), NOW()),
(4,  'Maria Santos',          'maria.santos@gmail.com',       '09189876543', NULL,           NULL,        NULL,         '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'active', NOW(), NOW(), NOW(), NOW()),
(5,  'Alexander Reyes',       'alexander.reyes@yahoo.com',    '09995551234', 'D01-22-789101', NULL,        NULL,        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'active', NOW(), NOW(), NOW(), NOW()),
(6,  'Kristina Lim',          'kristina.lim@gmail.com',       '09281112222', 'D02-19-654321', 'SC-987654', 'SSS ID',    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'active', NOW(), NOW(), NOW(), NOW()),
(7,  'Ramon Buenaventura',    'ramon.buena@gmail.com',        '09501238888', NULL,           NULL,        NULL,         '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'active', NOW(), NULL,  NOW(), NOW()),
(8,  'Sophia Villanueva',     'sophia.villanueva@gmail.com',  '09276667777', 'A03-23-112233', NULL,        NULL,        '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'client', 'active', NOW(), NOW(), NOW(), NOW());


-- ------------------------------------------------------------
-- 2. VEHICLES  (6 units — Sedan, MPV, SUV, Pickup, Van, Hatchback)
-- ------------------------------------------------------------
TRUNCATE TABLE vehicles;

INSERT INTO vehicles (id, name, type, seats, transmission, fuel_type, price_per_day, purchase_cost, plate_number, status, meetup_location, features, images, description, damage_notes, created_at, updated_at) VALUES
(1, 'Toyota Vios 2024',              'Sedan',    5, 'Automatic', 'Gasoline', 1500.00, 850000.00,  'NDA-8821', 'available', 'SM Sto Tomas',
    '["GPS Navigation","Bluetooth Audio","Backup Camera","USB Charging Port"]',
    '["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800"]',
    'A fuel-efficient Toyota Vios sedan perfect for city commutes and quick weekend getaways.', NULL, NOW(), NOW()),

(2, 'Toyota Innova 2023',            'MPV',      7, 'Automatic', 'Diesel',   2500.00, 1350000.00, 'CBT-4912', 'rented',    'Victory Mall Tanauan',
    '["Reverse Sensors","Leather Seats","Spacious Cargo","Dual Aircon","Bluetooth"]',
    '["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800"]',
    'Spacious 7-seater family MPV with strong diesel engine power, excellent for long group trips.', NULL, NOW(), NOW()),

(3, 'Mitsubishi Montero Sport 2024', 'SUV',      7, 'Automatic', 'Diesel',   3500.00, 1950000.00, 'NGG-5019', 'available', 'SM Calamba',
    '["4WD","Premium Leather Seats","Sunroof","Adaptive Cruise Control","Lane Assist"]',
    '["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"]',
    'Heavy duty and rugged Mitsubishi Montero Sport SUV, built for highway comfort and highland road trips.', NULL, NOW(), NOW()),

(4, 'Ford Ranger Wildtrak 2024',     'Pickup',   5, 'Automatic', 'Diesel',   3800.00, 1850000.00, 'NFF-7711', 'available', 'SM Sto Tomas',
    '["4x4 Offroad","Bed Liner","SYNC 4 Infotainment","360 Camera","Towing Hitch"]',
    '["https://images.unsplash.com/photo-1559416523-140ddc3d238c?auto=format&fit=crop&q=80&w=800"]',
    'Powerful Ford Ranger 4x4 pickup truck ready for tough cargo transport and outdoor adventures.', NULL, NOW(), NOW()),

(5, 'Toyota Hi-Ace GL 2022',         'Van',     10, 'Manual',    'Diesel',   4500.00, 2200000.00, 'AAB-3344', 'available', 'Lipa City Hall',
    '["Dual Aircon","Rear Curtains","High Roof","Foldable Seats","Cargo Rails"]',
    '["https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&q=80&w=800"]',
    'Roomy 10-seater Hi-Ace van ideal for family trips, corporate transport, and group events.', NULL, NOW(), NOW()),

(6, 'Honda City Hatchback 2023',     'Hatchback',5, 'Automatic', 'Gasoline', 1200.00, 780000.00,  'WXS-9901', 'maintenance','SM San Pablo',
    '["Touchscreen Infotainment","Lane Watch","Honda Sensing","Apple CarPlay","LED Headlights"]',
    '["https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?auto=format&fit=crop&q=80&w=800"]',
    'Stylish and fuel-efficient Honda City Hatchback. Ideal for solo travelers and city drives.', 'Minor scratch on rear bumper — pending paint touch-up.', NOW(), NOW());


-- ------------------------------------------------------------
-- 3. VEHICLE_UNAVAILABLE_DATES
-- ------------------------------------------------------------
TRUNCATE TABLE vehicle_unavailable_dates;

INSERT INTO vehicle_unavailable_dates (vehicle_id, start_date, end_date, created_at, updated_at) VALUES
(6, DATE_ADD(CURDATE(), INTERVAL 0 DAY),  DATE_ADD(CURDATE(), INTERVAL 4 DAY),  NOW(), NOW()),   -- Honda City in maintenance
(3, DATE_ADD(CURDATE(), INTERVAL 15 DAY), DATE_ADD(CURDATE(), INTERVAL 17 DAY), NOW(), NOW()),   -- Montero pre-blocked for LTO renewal
(5, DATE_ADD(CURDATE(), INTERVAL 20 DAY), DATE_ADD(CURDATE(), INTERVAL 21 DAY), NOW(), NOW());   -- Hi-Ace annual PMS block


-- ------------------------------------------------------------
-- 4. PROMOS
-- ------------------------------------------------------------
TRUNCATE TABLE promos;

INSERT INTO promos (id, title, description, discount_text, image_url, status, promo_code, discount_value, discount_type, created_at, updated_at) VALUES
(1, 'Early Bird Discount',     'Book 2 weeks in advance to receive 10% off your total rental price.',                      '10% OFF Total Price',      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&q=80&w=800', 'active',   'EARLYBIRD10',  10.00,  'percentage', NOW(), NOW()),
(2, 'Weekend Roadtrip Deal',   'Special promotion for 3-day weekend road tours starting from Friday.',                     'PHP 500 Flat Discount',    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800', 'active',   'ROADTRIP500',  500.00, 'flat',       NOW(), NOW()),
(3, 'First-Timer Welcome',     'New registrant exclusive: enjoy PHP 300 off your very first booking.',                     'PHP 300 OFF First Booking','https://images.unsplash.com/photo-1530521954074-e64f6810b32d?auto=format&fit=crop&q=80&w=800', 'active',   'NEWRENTER300', 300.00, 'flat',       NOW(), NOW()),
(4, 'Loyalty 5% Rebate',       'Returning customers with 3+ completed bookings get 5% rebate on their next rental.',       '5% Loyalty Rebate',        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800', 'active',   'LOYAL5',        5.00,  'percentage', NOW(), NOW()),
(5, 'Holiday Season Special',  'Exclusive holiday rate: book any SUV or MPV for the holidays and save PHP 1,000.',         'PHP 1,000 Holiday OFF',    'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?auto=format&fit=crop&q=80&w=800', 'inactive', 'HOLIDAY1K',  1000.00, 'flat',       NOW(), NOW()),
(6, 'Corporate Fleet Promo',   'Businesses booking 2 or more vehicles simultaneously receive 15% off combined total.',     '15% Corporate Discount',   'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=800', 'active',   'CORP15',       15.00,  'percentage', NOW(), NOW());


-- ------------------------------------------------------------
-- 5. EXTRA_GOODS  (Add-ons)
-- ------------------------------------------------------------
TRUNCATE TABLE extra_goods;

INSERT INTO extra_goods (id, name, price_per_day, description, status, created_at, updated_at) VALUES
(1, 'GPS Navigation Device', 150.00, 'Pre-installed portable GPS navigation device with latest Philippine maps.',   'available', NOW(), NOW()),
(2, 'Child Safety Seat',     200.00, 'FMVSS-certified booster child safety seat, fits toddlers up to 18kg.',        'available', NOW(), NOW()),
(3, 'Dash Camera',           100.00, 'Front & rear dual dashcam with loop recording — peace of mind on every drive.','available', NOW(), NOW()),
(4, 'Emergency Road Kit',    75.00,  'Includes reflective triangles, jumper cables, tire repair kit & first-aid box.','available', NOW(), NOW()),
(5, 'Roof Rack / Carrier',   350.00, 'Universal aluminum roof rack for luggage, bikes, surfboards, and bulk cargo.',  'available', NOW(), NOW()),
(6, 'Wi-Fi Mobile Hotspot',  120.00, 'Unlimited LTE data pocket Wi-Fi for the entire rental duration.',               'available', NOW(), NOW());


-- ------------------------------------------------------------
-- 6. SETTINGS
-- ------------------------------------------------------------
DELETE FROM settings;

INSERT INTO settings (`key`, `value`, created_at, updated_at) VALUES
('site_logo',          'ELFAA CAR RENTAL',                                                   NOW(), NOW()),
('home_hero_title',    'Premium Self-Drive Car Rentals',                                      NOW(), NOW()),
('home_hero_subtitle', 'Serving SM Sto Tomas, Victory Mall Tanauan, SM Calamba & Metro Laguna.', NOW(), NOW()),
('contact_email',      'elfaacarrental@gmail.com',                                           NOW(), NOW()),
('contact_phone',      '0917-888-9999',                                                       NOW(), NOW()),
('facebook_url',       'https://facebook.com/elfaacarrental',                                NOW(), NOW()),
('booking_deposit_pct','30',                                                                  NOW(), NOW()),
('max_booking_days',   '30',                                                                  NOW(), NOW());


-- ------------------------------------------------------------
-- 7. DOCUMENTS  (verification docs per client)
-- ------------------------------------------------------------
TRUNCATE TABLE documents;

INSERT INTO documents (id, user_id, type, file_path, status, reject_reason, verified_by, verified_at, created_at, updated_at) VALUES
-- Juan Dela Cruz (user 3) — fully verified
(1,  3, 'gov_id_1',          '/uploads/documents/sample_id_license.jpg',       'verified', NULL,                          'Mark Staff Inspector', DATE_SUB(NOW(), INTERVAL 5 DAY),  NOW(), NOW()),
(2,  3, 'gov_id_2',          '/uploads/documents/sample_id_license.jpg',       'verified', NULL,                          'Mark Staff Inspector', DATE_SUB(NOW(), INTERVAL 5 DAY),  NOW(), NOW()),
(3,  3, 'proof_of_billing',   '/uploads/documents/sample_proof_of_billing.jpg', 'verified', NULL,                          'Mark Staff Inspector', DATE_SUB(NOW(), INTERVAL 5 DAY),  NOW(), NOW()),
-- Maria Santos (user 4) — pending
(4,  4, 'gov_id_1',          '/uploads/documents/sample_id_license.jpg',       'pending',  NULL,                          NULL,                  NULL,                              NOW(), NOW()),
-- Alexander Reyes (user 5) — one rejected, one verified
(5,  5, 'gov_id_1',          '/uploads/documents/sample_id_license.jpg',       'verified', NULL,                          'Mark Staff Inspector', DATE_SUB(NOW(), INTERVAL 3 DAY),  NOW(), NOW()),
(6,  5, 'proof_of_billing',   '/uploads/documents/sample_proof_of_billing.jpg', 'rejected', 'Document is blurry and unreadable. Please re-upload a clearer copy.', 'Mark Staff Inspector', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW(), NOW()),
-- Kristina Lim (user 6) — fully verified
(7,  6, 'gov_id_1',          '/uploads/documents/sample_id_license.jpg',       'verified', NULL,                          'Mark Staff Inspector', DATE_SUB(NOW(), INTERVAL 7 DAY),  NOW(), NOW()),
(8,  6, 'proof_of_billing',   '/uploads/documents/sample_proof_of_billing.jpg', 'verified', NULL,                          'Mark Staff Inspector', DATE_SUB(NOW(), INTERVAL 7 DAY),  NOW(), NOW()),
-- Sophia Villanueva (user 8) — just uploaded, pending review
(9,  8, 'gov_id_1',          '/uploads/documents/sample_id_license.jpg',       'pending',  NULL,                          NULL,                  NULL,                              NOW(), NOW()),
(10, 8, 'proof_of_billing',   '/uploads/documents/sample_proof_of_billing.jpg', 'pending',  NULL,                          NULL,                  NULL,                              NOW(), NOW());


-- ------------------------------------------------------------
-- 8. BOOKINGS  (6 bookings — all statuses represented)
-- ------------------------------------------------------------
TRUNCATE TABLE bookings;

INSERT INTO bookings (
    id, user_id, vehicle_id,
    start_datetime, end_datetime,
    pickup_location, dropoff_location,
    original_price, location_fee, is_out_of_bounds, promo_code, discount_amount,
    security_deposit, total_price, amount_paid, final_total,
    payment_method, payment_status, payment_reference, payment_proof_path,
    status, archived_at, created_at, updated_at
) VALUES

-- Booking 1: COMPLETED — Juan (Vios, 3 days) with fuel surcharge applied
(1, 3, 1,
 DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY),
 'SM Sto Tomas', 'SM Sto Tomas',
 4500.00, 0.00, 0, 'ROADTRIP500', 500.00,
 2000.00, 4600.00, 4600.00, 4600.00,
 'gcash', 'paid', 'GCASH-992019283', NULL,
 'completed', NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),

-- Booking 2: CONFIRMED / ACTIVE — Maria (Innova, 3 days) pickup done
(2, 4, 2,
 DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY),
 'Victory Mall Tanauan', 'Victory Mall Tanauan',
 7500.00, 250.00, 0, NULL, 0.00,
 3000.00, 7750.00, 7750.00, NULL,
 'bank_transfer', 'paid', 'BDO-TRX-881029', NULL,
 'confirmed', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),

-- Booking 3: CONFIRMED / UPCOMING — Alexander (Montero, 3 days) advance booking
(3, 5, 3,
 DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_ADD(NOW(), INTERVAL 6 DAY),
 'SM Calamba', 'SM Calamba',
 10500.00, 300.00, 0, 'EARLYBIRD10', 1050.00,
 4000.00, 9750.00, 9750.00, NULL,
 'gcash', 'paid', 'GCASH-44102931', NULL,
 'confirmed', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

-- Booking 4: PENDING CONFIRMATION — Kristina (Ranger, 2 days)
(4, 6, 4,
 DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY),
 'SM Sto Tomas', 'SM Sto Tomas',
 7600.00, 0.00, 0, NULL, 0.00,
 3000.00, 7600.00, 0.00, NULL,
 'gcash', 'pending_verification', 'GCASH-55209341', '/uploads/documents/sample_proof_of_billing.jpg',
 'pending', NULL, NOW(), NOW()),

-- Booking 5: COMPLETED — Kristina (Vios, 5 days) older completed booking
(5, 6, 1,
 DATE_SUB(NOW(), INTERVAL 25 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY),
 'SM Sto Tomas', 'SM Sto Tomas',
 7500.00, 0.00, 0, 'NEWRENTER300', 300.00,
 2000.00, 7200.00, 7200.00, 7200.00,
 'cod', 'paid', NULL, NULL,
 'completed', NULL, DATE_SUB(NOW(), INTERVAL 28 DAY), NOW()),

-- Booking 6: CANCELLED — Sophia (Hi-Ace, 4 days)
(6, 8, 5,
 DATE_ADD(NOW(), INTERVAL 8 DAY), DATE_ADD(NOW(), INTERVAL 12 DAY),
 'Lipa City Hall', 'Lipa City Hall',
 18000.00, 500.00, 1, NULL, 0.00,
 5000.00, 18500.00, 5000.00, NULL,
 'gcash', 'refunded', 'GCASH-77839201', NULL,
 'cancelled', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW());


-- ------------------------------------------------------------
-- 9. VEHICLE_INSPECTIONS
-- ------------------------------------------------------------
TRUNCATE TABLE vehicle_inspections;

INSERT INTO vehicle_inspections (id, booking_id, vehicle_id, inspector_id, type, fuel_bars, odometer_reading, notes, photos, inspected_at, created_at, updated_at) VALUES
-- Booking 1 pickup
(1, 1, 1, 2, 'pickup', 8, 14250,
 'Vehicle handed over in pristine condition. All systems go, interior clean.',
 '["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"]',
 DATE_SUB(NOW(), INTERVAL 10 DAY), NOW(), NOW()),
-- Booking 1 return (fuel deficit)
(2, 1, 1, 2, 'return', 6, 14580,
 'Returned safely. Fuel at 6/8 bars. 2 bars below agreed pickup level. Minor dust on exterior.',
 '["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"]',
 DATE_SUB(NOW(), INTERVAL 7 DAY), NOW(), NOW()),
-- Booking 2 pickup (active booking)
(3, 2, 2, 2, 'pickup', 8, 28400,
 'Pickup inspection completed at Victory Mall Tanauan. Vehicle fully clean and fueled.',
 '["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600"]',
 DATE_SUB(NOW(), INTERVAL 1 DAY), NOW(), NOW()),
-- Booking 5 pickup
(4, 5, 1, 2, 'pickup', 8, 13800,
 'Vehicle clean and fueled to full. Pre-rental check passed.',
 '["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"]',
 DATE_SUB(NOW(), INTERVAL 25 DAY), NOW(), NOW()),
-- Booking 5 return (all good)
(5, 5, 1, 2, 'return', 8, 14050,
 'Vehicle returned in great condition. Fuel full. No damage noted. Odometer +250 km.',
 '["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"]',
 DATE_SUB(NOW(), INTERVAL 20 DAY), NOW(), NOW()),
-- Booking 3 pickup (not yet, future — just placeholder)
(6, 3, 3, 2, 'pickup', 8, 32100,
 'Pre-booking inspection completed. Vehicle at full tank, no prior damage noted.',
 '["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=600"]',
 NOW(), NOW(), NOW());


-- ------------------------------------------------------------
-- 10. INSPECTION_CHARGES
-- ------------------------------------------------------------
TRUNCATE TABLE inspection_charges;

INSERT INTO inspection_charges (id, booking_id, inspection_id, created_by, approved_by, charge_type, description, amount, evidence_photos, status, created_at, updated_at) VALUES
-- Fuel deficit from Booking 1
(1, 1, 2, 2, 1, 'fuel_shortage',
 'Fuel Refill Charge: 2 bars deficit @ PHP 300 per fuel bar.',
 600.00,
 '["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"]',
 'approved', DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),
-- Late return on Booking 2 (proposed, not yet approved)
(2, 2, 3, 2, NULL, 'late_return',
 'Vehicle was returned 1 hour past agreed return time. Late charge of PHP 500 applied.',
 500.00,
 '["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600"]',
 'proposed', NOW(), NOW()),
-- Damage charge on a rejected case (for testing)
(3, 5, 4, 2, 1, 'damage',
 'Scratch reported on left side mirror upon pickup. Client disputed. Charge rejected after review.',
 1500.00,
 '["https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=600"]',
 'rejected', DATE_SUB(NOW(), INTERVAL 22 DAY), NOW());


-- ------------------------------------------------------------
-- 11. BOOKING_PRICE_HISTORIES  (audit trail)
-- ------------------------------------------------------------
TRUNCATE TABLE booking_price_histories;

INSERT INTO booking_price_histories (id, booking_id, changed_by_id, previous_total, new_total, change_amount, reason, breakdown_snapshot, created_at, updated_at) VALUES
(1, 1, 1, 4000.00, 4600.00, 600.00,
 'Added approved return inspection charge: 2 fuel bars deficit.',
 '{"original_price":4500,"location_fee":0,"discount_amount":500,"security_deposit":2000,"amount_paid":4600,"approved_charges":600}',
 DATE_SUB(NOW(), INTERVAL 7 DAY), NOW()),

(2, 3, 1, 10800.00, 9750.00, -1050.00,
 'Applied promo EARLYBIRD10 (10% early bird discount) at customer request.',
 '{"original_price":10500,"location_fee":300,"discount_amount":1050,"security_deposit":4000,"amount_paid":9750,"approved_charges":0}',
 DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),

(3, 6, 1, 18500.00, 5000.00, -13500.00,
 'Booking cancelled by client. Refund processed minus non-refundable deposit.',
 '{"original_price":18000,"location_fee":500,"discount_amount":0,"security_deposit":5000,"amount_paid":5000,"refunded":13500}',
 DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());


-- ------------------------------------------------------------
-- 12. BOOKING_PAYMENTS  (payment installment records)
-- ------------------------------------------------------------
TRUNCATE TABLE booking_payments;

INSERT INTO booking_payments (id, booking_id, collector_id, amount_collected, payment_method, payment_type, reference_number, notes, created_at, updated_at) VALUES
-- Booking 1: full payment via GCash
(1, 1, 2, 4600.00, 'gcash',         'final_settlement', 'GCASH-992019283',  'Full payment including fuel surcharge collected.',          DATE_SUB(NOW(), INTERVAL 7 DAY),  NOW()),
-- Booking 2: bank transfer full payment
(2, 2, 2, 7750.00, 'bank_transfer', 'final_settlement', 'BDO-TRX-881029',   'Full amount settled via BDO bank transfer.',                DATE_SUB(NOW(), INTERVAL 3 DAY),  NOW()),
-- Booking 3: downpayment then balance
(3, 3, 2, 3000.00, 'gcash',         'downpayment',      'GCASH-11029301',   '30% downpayment collected to confirm booking.',            DATE_SUB(NOW(), INTERVAL 2 DAY),  NOW()),
(4, 3, 2, 6750.00, 'gcash',         'final_settlement', 'GCASH-44102931',   'Remaining balance paid 3 days before start date.',         DATE_SUB(NOW(), INTERVAL 1 DAY),  NOW()),
-- Booking 4: pending payment (no collection record yet)
-- Booking 5: COD collected on pickup
(5, 5, 2, 7200.00, 'cash',          'final_settlement', NULL,               'Cash on delivery collected at SM Sto Tomas meetup point.', DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
-- Booking 6: deposit collected then refunded
(6, 6, 2, 5000.00, 'gcash',         'downpayment',      'GCASH-77839201-DP','Deposit collected. Later refunded due to cancellation.',    DATE_SUB(NOW(), INTERVAL 3 DAY),  NOW());


-- ------------------------------------------------------------
-- 13. RATINGS  (for completed bookings)
-- ------------------------------------------------------------
TRUNCATE TABLE ratings;

INSERT INTO ratings (id, booking_id, user_id, vehicle_id, stars, comment, created_at, updated_at) VALUES
(1, 1, 3, 1, 5, 'Excellent experience! The Vios was spotless and very fuel efficient. Pick-up was smooth at SM Sto Tomas. Highly recommend ELFAA!', DATE_SUB(NOW(), INTERVAL 6 DAY),  NOW()),
(2, 5, 6, 1, 4, 'Great service overall. The car was clean and well-maintained. Minor delay on meetup time but staff was very polite and accommodating.', DATE_SUB(NOW(), INTERVAL 19 DAY), NOW());


-- ------------------------------------------------------------
-- 14. BILL_RECORDS  (operational expenses)
-- ------------------------------------------------------------
TRUNCATE TABLE bill_records;

INSERT INTO bill_records (id, biller_name, bill_category, account_number, amount, due_date, payment_date, status, notes, created_by, created_at, updated_at) VALUES
(1, 'Shop Hub Monthly Rent - Sto Tomas',  'Rent',         NULL,           18000.00, DATE_ADD(CURDATE(), INTERVAL 5 DAY),   NULL,         'pending', 'Main garage & staff station office monthly rental fee.',             1, NOW(), NOW()),
(2, 'Meralco Utility Electricity Bill',   'Electricity',  '9981-1209-4411', 4250.00, DATE_SUB(CURDATE(), INTERVAL 2 DAY),   DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'paid',    'Office aircon & garage lighting power bill.',                        1, NOW(), NOW()),
(3, 'PLDT Fiber Internet - Office Line',  'Internet',     'PLDTFiber-0112', 1899.00, DATE_ADD(CURDATE(), INTERVAL 10 DAY),  NULL,         'pending', 'Monthly office fiber broadband subscription.',                       1, NOW(), NOW()),
(4, 'GSIS Vehicle Insurance Premium',    'Insurance',    'GS-VH-202411',  22500.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY),   NULL,         'overdue', 'Annual fleet comprehensive insurance. OVERDUE — needs immediate payment!', 1, NOW(), NOW()),
(5, 'Maynilad Water Bill',               'Water',        '1234-5678-9012',  680.00, DATE_ADD(CURDATE(), INTERVAL 8 DAY),   NULL,         'pending', 'Monthly water bill for office comfort rooms & garage area.',         1, NOW(), NOW()),
(6, 'Carwash Service Contract - March',  'Maintenance',  NULL,            5500.00, DATE_SUB(CURDATE(), INTERVAL 15 DAY),  DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'paid',    'Monthly bulk vehicle exterior wash & interior detailing contract.',  2, NOW(), NOW());


-- ------------------------------------------------------------
-- 15. VEHICLE_EXPENSES  (per-unit maintenance & repair costs)
-- ------------------------------------------------------------
TRUNCATE TABLE vehicle_expenses;

INSERT INTO vehicle_expenses (id, vehicle_id, expense_type, amount, description, expense_date, created_at, updated_at) VALUES
(1,  1, 'maintenance', 3800.00,  'PMS 15,000 KM: Engine oil, oil filter, air filter & brake pad inspection.',                          DATE_SUB(CURDATE(), INTERVAL 15 DAY), NOW(), NOW()),
(2,  2, 'repair',      11200.00, 'Two brand-new Bridgestone all-terrain rear tires installed.',                                         DATE_SUB(CURDATE(), INTERVAL 20 DAY), NOW(), NOW()),
(3,  3, 'maintenance', 5200.00,  '4WD fluid flush and differential oil change at 30,000 KM PMS.',                                       DATE_SUB(CURDATE(), INTERVAL 30 DAY), NOW(), NOW()),
(4,  4, 'repair',      8400.00,  'Front suspension bushing replacement + wheel alignment & balancing.',                                 DATE_SUB(CURDATE(), INTERVAL 8 DAY),  NOW(), NOW()),
(5,  5, 'maintenance', 4100.00,  'Van PMS: engine oil change, coolant flush, fan belt replacement.',                                    DATE_SUB(CURDATE(), INTERVAL 45 DAY), NOW(), NOW()),
(6,  6, 'repair',      2500.00,  'Rear bumper scratch — sanding, filler and paint touch-up at authorized body shop.',                  DATE_SUB(CURDATE(), INTERVAL 3 DAY),  NOW(), NOW()),
(7,  1, 'other',        900.00,  'LTO registration renewal processing fee and documentary stamps.',                                      DATE_SUB(CURDATE(), INTERVAL 60 DAY), NOW(), NOW()),
(8,  2, 'maintenance', 1200.00,  'Air-conditioning system check, refrigerant refill, and blower cleaning.',                             DATE_SUB(CURDATE(), INTERVAL 10 DAY), NOW(), NOW());


-- ------------------------------------------------------------
-- 16. OPERATIONAL_TASKS  (staff task board)
-- ------------------------------------------------------------
TRUNCATE TABLE operational_tasks;

INSERT INTO operational_tasks (id, title, task_type, due_datetime, assigned_staff_id, vehicle_id, booking_id, status, notes, created_at, updated_at) VALUES
(1, 'Deliver & Hand Over Vios to Client — Booking #4',      'delivery_pickup',      DATE_ADD(NOW(), INTERVAL 5 DAY), 2, 4, 4, 'pending',     'Coordinate exact meetup time at SM Sto Tomas gate entrance.',                       NOW(), NOW()),
(2, 'Inspect Innova Return — Booking #2',                   'vehicle_return',       DATE_ADD(NOW(), INTERVAL 2 DAY), 2, 2, 2, 'pending',     'Perform full return inspection before client leaves parking lot.',                  NOW(), NOW()),
(3, 'GSIS Insurance Bill Payment — OVERDUE',                'inspection_pending',   DATE_SUB(NOW(), INTERVAL 5 DAY), 1, NULL, NULL, 'in_progress', 'Contact GSIS agent. Immediate payment required to avoid policy lapse.', NOW(), NOW()),
(4, 'Honda City Rear Bumper Paint Repair',                  'maintenance',          DATE_ADD(NOW(), INTERVAL 4 DAY), 2, 6, NULL, 'pending',    'Vehicle at body shop. Collect after repair — confirm pickup with shop.',           NOW(), NOW()),
(5, 'Process Sophia Cancelled Booking Refund',              'unpaid_balance',       DATE_SUB(NOW(), INTERVAL 1 DAY), 1, NULL, 6, 'completed',  'Refund of PHP 13,500 processed via GCash to client. Booking archived.',           NOW(), NOW()),
(6, 'Approve Fuel Surcharge for Booking #2 Late Return',    'surcharge_approval',   DATE_ADD(NOW(), INTERVAL 1 DAY), 1, 2, 2, 'pending',     'Review proposed PHP 500 late-return charge. Verify with CCTV footage if needed.', NOW(), NOW());

-- ------------------------------------------------------------
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
--  QUICK VERIFICATION QUERIES — run these after import
-- ============================================================
-- SELECT * FROM users              ORDER BY id;
-- SELECT * FROM vehicles           ORDER BY id;
-- SELECT * FROM promos             ORDER BY id;
-- SELECT * FROM extra_goods        ORDER BY id;
-- SELECT * FROM bookings           ORDER BY id;
-- SELECT * FROM documents          ORDER BY id;
-- SELECT * FROM ratings            ORDER BY id;
-- SELECT * FROM vehicle_inspections ORDER BY id;
-- SELECT * FROM inspection_charges  ORDER BY id;
-- SELECT * FROM booking_payments    ORDER BY id;
-- SELECT * FROM bill_records        ORDER BY id;
-- SELECT * FROM vehicle_expenses    ORDER BY id;
-- SELECT * FROM operational_tasks   ORDER BY id;
-- ============================================================
