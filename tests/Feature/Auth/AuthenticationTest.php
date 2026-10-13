<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('client.dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    /**
     * Feature 1: Login Rate Limiter — locked account cannot log in.
     */
    public function test_locked_account_cannot_login(): void
    {
        $user = User::factory()->create(['status' => 'locked']);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('email');
        $this->assertStringContainsString(
            'locked',
            $response->getSession()->get('errors')->first('email')
        );
    }

    /**
     * Feature 3: Admin can lock a non-admin user account.
     */
    public function test_admin_can_lock_a_user_account(): void
    {
        $admin  = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $client = User::factory()->create(['role' => 'client', 'status' => 'active']);

        $response = $this->actingAs($admin)->post(route('admin.users.lock', $client->id));

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertDatabaseHas('users', ['id' => $client->id, 'status' => 'locked']);
    }

    /**
     * Feature 3: Admin can unlock a locked user account.
     */
    public function test_admin_can_unlock_a_locked_user_account(): void
    {
        $admin  = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $client = User::factory()->create(['role' => 'client', 'status' => 'locked']);

        $response = $this->actingAs($admin)->post(route('admin.users.unlock', $client->id));

        $response->assertRedirect(route('admin.dashboard'));
        $this->assertDatabaseHas('users', ['id' => $client->id, 'status' => 'active']);
    }

    /**
     * Feature 3: Locked user accessing protected route is logged out and redirected.
     */
    public function test_locked_user_accessing_protected_route_is_redirected(): void
    {
        $user = User::factory()->create(['role' => 'client', 'status' => 'locked']);

        $response = $this->actingAs($user)->get('/client/dashboard');

        $this->assertGuest();
        $response->assertRedirect(route('login'));
        $response->assertSessionHasErrors('email');
    }

    /**
     * Feature 2: Client user cannot access admin routes (URL access prevention).
     */
    public function test_client_cannot_access_admin_dashboard(): void
    {
        $client = User::factory()->create(['role' => 'client', 'status' => 'active']);

        $response = $this->actingAs($client)->get('/admin/dashboard');

        $response->assertStatus(403);
    }

    /**
     * Feature 3: Admin accounts cannot be locked by another admin.
     */
    public function test_admin_cannot_lock_another_admin(): void
    {
        $admin1 = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $admin2 = User::factory()->create(['role' => 'admin', 'status' => 'active']);

        $this->actingAs($admin1)->post(route('admin.users.lock', $admin2->id));

        $this->assertDatabaseHas('users', ['id' => $admin2->id, 'status' => 'active']);
    }
}
