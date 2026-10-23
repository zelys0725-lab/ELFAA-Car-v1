<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vehicle;
use App\Services\Payments\PaymentManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OnlinePaymentIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $client;
    protected Vehicle $vehicle;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->client = User::factory()->create([
            'role' => 'client',
            'status' => 'active',
        ]);

        $this->vehicle = Vehicle::create([
            'name' => 'Toyota Vios 1.3 XLE',
            'plate_number' => 'ABC-1234',
            'type' => 'Sedan',
            'seats' => 5,
            'transmission' => 'Auto',
            'fuel_type' => 'Gasoline',
            'price_per_day' => 1800,
            'meetup_location' => 'Main Garage',
            'status' => 'available',
            'is_approved' => true,
        ]);
    }

    public function test_admin_can_update_payment_settings_and_persist_to_database(): void
    {
        $response = $this->actingAs($this->admin)->post(route('admin.payment_settings.update'), [
            'payment_stripe_enabled' => '1',
            'payment_stripe_mode' => 'test',
            'payment_stripe_test_pk' => 'pk_test_sample_stripe_pk_123',
            'payment_stripe_test_sk' => 'sk_test_sample_stripe_sk_123',
            'payment_stripe_test_webhook_secret' => 'whsec_sample_stripe_webhook_123',

            'payment_gcash_enabled' => '1',
            'payment_gcash_mode' => 'test',
            'payment_gcash_test_pk' => 'pk_test_sample_gcash_pk_123',
            'payment_gcash_test_sk' => 'sk_test_sample_gcash_sk_123',
            'payment_gcash_test_webhook_secret' => 'whsec_sample_gcash_webhook_123',

            'payment_auto_confirm' => '1',
            'payment_currency' => 'PHP',
        ]);

        $response->assertStatus(302);

        $this->assertDatabaseHas('settings', [
            'key' => 'payment_stripe_enabled',
            'value' => '1',
        ]);

        $this->assertDatabaseHas('settings', [
            'key' => 'payment_stripe_test_pk',
            'value' => 'pk_test_sample_stripe_pk_123',
        ]);

        $this->assertDatabaseHas('settings', [
            'key' => 'payment_gcash_enabled',
            'value' => '1',
        ]);

        $this->assertDatabaseHas('settings', [
            'key' => 'payment_gcash_test_sk',
            'value' => 'sk_test_sample_gcash_sk_123',
        ]);
    }

    public function test_unauthorized_user_cannot_update_payment_settings(): void
    {
        $response = $this->actingAs($this->client)->post(route('admin.payment_settings.update'), [
            'payment_stripe_enabled' => '1',
        ]);

        $response->assertStatus(403);
    }

    public function test_payment_manager_processes_successful_payment_and_updates_booking(): void
    {
        $booking = Booking::create([
            'user_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => now()->addDay(),
            'end_datetime' => now()->addDays(3),
            'pickup_location' => 'Main Garage',
            'total_price' => 3600.00,
            'payment_method' => 'online',
            'payment_status' => 'unpaid',
            'status' => 'pending',
        ]);

        $manager = app(PaymentManager::class);

        $transaction = $manager->processSuccessfulPayment(
            $booking,
            'stripe',
            'cs_test_sample_checkout_session_999',
            3600.00,
            ['id' => 'cs_test_sample_checkout_session_999'],
            'client@test.com',
            'Test Client'
        );

        $this->assertNotNull($transaction);
        $this->assertEquals('paid', $transaction->status);
        $this->assertEquals(3600.00, $transaction->amount);

        $booking->refresh();
        $this->assertEquals('paid', $booking->payment_status);
        $this->assertEquals(3600.00, $booking->amount_paid);
        $this->assertEquals('confirmed', $booking->status); // Auto-confirmed!

        // Also assert that standard BookingPayment ledger was created
        $this->assertDatabaseHas('booking_payments', [
            'booking_id' => $booking->id,
            'reference_number' => 'cs_test_sample_checkout_session_999',
            'amount_collected' => 3600.00,
        ]);
    }

    public function test_client_can_view_transaction_history_for_their_booking(): void
    {
        $booking = Booking::create([
            'user_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => now()->addDay(),
            'end_datetime' => now()->addDays(2),
            'pickup_location' => 'Main Garage',
            'total_price' => 1800.00,
            'payment_method' => 'online',
            'payment_status' => 'unpaid',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->client)->get(route('bookings.transactions', $booking->id));

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'transactions',
            'payments',
            'booking',
        ]);
    }

    public function test_paymongo_webhook_updates_booking_automatically(): void
    {
        $booking = Booking::create([
            'user_id' => $this->client->id,
            'vehicle_id' => $this->vehicle->id,
            'start_datetime' => now()->addDay(),
            'end_datetime' => now()->addDays(2),
            'pickup_location' => 'Main Garage',
            'total_price' => 1800.00,
            'payment_method' => 'online',
            'payment_status' => 'unpaid',
            'status' => 'pending',
        ]);

        $payload = [
            'data' => [
                'attributes' => [
                    'type' => 'checkout_session.payment.paid',
                    'data' => [
                        'id' => 'pay_test_pm_987654',
                        'attributes' => [
                            'amount' => 180000, // 1800.00 PHP in centavos
                            'currency' => 'PHP',
                            'billing' => [
                                'email' => 'juan@example.ph',
                                'name' => 'Juan Dela Cruz',
                            ],
                            'metadata' => [
                                'booking_id' => (string) $booking->id,
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson(route('webhooks.paymongo'), $payload);

        $response->assertStatus(200);
        $response->assertJson(['received' => true]);

        $booking->refresh();
        $this->assertEquals('paid', $booking->payment_status);
        $this->assertEquals(1800.00, $booking->amount_paid);
        $this->assertEquals('confirmed', $booking->status);
        $this->assertEquals('gcash_paymongo', $booking->payment_gateway);

        $this->assertDatabaseHas('payment_transactions', [
            'booking_id' => $booking->id,
            'gateway_transaction_id' => 'pay_test_pm_987654',
            'status' => 'paid',
            'amount' => 1800.00,
        ]);
    }
}
