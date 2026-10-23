<?php

namespace Tests\Feature\Auth;

use App\Models\Setting;
use App\Models\User;
use App\Models\UserBackupCode;
use App\Services\MfaService;
use App\Services\TotpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class MultiFactorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_without_mfa_logs_in_directly_when_policy_is_optional(): void
    {
        Setting::updateOrCreate(['key' => 'mfa_policy'], ['value' => 'optional']);

        $user = User::factory()->create([
            'role' => 'client',
            'mfa_enabled' => false,
        ]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('client.dashboard'));
    }

    public function test_user_with_mfa_enabled_is_redirected_to_mfa_challenge(): void
    {
        Setting::updateOrCreate(['key' => 'mfa_policy'], ['value' => 'optional']);

        $user = User::factory()->create([
            'role' => 'client',
            'mfa_enabled' => true,
            'mfa_type' => 'email',
        ]);

        Notification::fake();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        // User is not authenticated in full web guard yet
        $this->assertGuest();

        // Redirected to challenge
        $response->assertRedirect(route('mfa.challenge'));
        $this->assertEquals($user->id, session('mfa:user_id'));
    }

    public function test_admin_is_redirected_to_mfa_challenge_when_policy_is_enforced_admin(): void
    {
        Setting::updateOrCreate(['key' => 'mfa_policy'], ['value' => 'enforced_admin']);

        $admin = User::factory()->create([
            'role' => 'admin',
            'mfa_enabled' => false, // Not individually enabled, but enforced by policy
        ]);

        Notification::fake();

        $response = $this->post('/login', [
            'email' => $admin->email,
            'password' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect(route('mfa.challenge'));
    }

    public function test_user_can_verify_email_otp_and_complete_login(): void
    {
        Notification::fake();

        $user = User::factory()->create([
            'role' => 'client',
            'mfa_enabled' => true,
            'mfa_type' => 'email',
        ]);

        $mfaService = app(MfaService::class);
        $mfaService->sendEmailOtp($user);

        // Put user in pending MFA session
        $this->withSession([
            'mfa:user_id' => $user->id,
            'mfa:remember' => false,
            'mfa:method' => 'email',
        ]);

        // Refresh user to get hashed code and test with valid code
        $user->refresh();
        $rawCode = '123456';
        $user->mfa_email_otp = Hash::make($rawCode);
        $user->mfa_otp_expires_at = now()->addMinutes(10);
        $user->save();

        $response = $this->post(route('mfa.verify'), [
            'method' => 'email',
            'code' => '123456',
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('client.dashboard'));
        $this->assertNull(session('mfa:user_id'));
    }

    public function test_invalid_email_otp_fails_verification_and_increments_attempts(): void
    {
        $user = User::factory()->create([
            'role' => 'client',
            'mfa_enabled' => true,
            'mfa_type' => 'email',
            'mfa_email_otp' => Hash::make('654321'),
            'mfa_otp_expires_at' => now()->addMinutes(10),
            'mfa_failed_attempts' => 0,
        ]);

        $this->withSession([
            'mfa:user_id' => $user->id,
            'mfa:method' => 'email',
        ]);

        $response = $this->post(route('mfa.verify'), [
            'method' => 'email',
            'code' => '000000',
        ]);

        $this->assertGuest();
        $response->assertSessionHasErrors('code');
        $this->assertEquals(1, $user->fresh()->mfa_failed_attempts);
    }

    public function test_user_can_verify_using_authenticator_totp(): void
    {
        $totpService = app(TotpService::class);
        $secret = $totpService->generateSecret();
        $currentCode = $totpService->calculateCode($secret);

        $user = User::factory()->create([
            'role' => 'client',
            'mfa_enabled' => true,
            'mfa_type' => 'authenticator',
            'mfa_secret' => $secret,
        ]);

        $this->withSession([
            'mfa:user_id' => $user->id,
            'mfa:remember' => false,
            'mfa:method' => 'authenticator',
        ]);

        $response = $this->post(route('mfa.verify'), [
            'method' => 'authenticator',
            'code' => $currentCode,
        ]);

        $this->assertAuthenticatedAs($user);
        $response->assertRedirect(route('client.dashboard'));
    }

    public function test_user_can_recover_account_using_backup_code(): void
    {
        $user = User::factory()->create([
            'role' => 'client',
            'mfa_enabled' => true,
            'mfa_type' => 'authenticator',
        ]);

        $mfaService = app(MfaService::class);
        $codes = $mfaService->generateBackupCodes($user, 4);
        $backupCodeToUse = $codes[0];

        $this->withSession([
            'mfa:user_id' => $user->id,
            'mfa:remember' => false,
            'mfa:method' => 'backup_code',
        ]);

        $response = $this->post(route('mfa.verify'), [
            'method' => 'backup_code',
            'code' => $backupCodeToUse,
        ]);

        $this->assertAuthenticatedAs($user);
        $this->assertEquals(3, $mfaService->getRemainingBackupCodesCount($user));

        // Attempting to reuse the same backup code must now fail
        auth()->logout();
        $this->withSession([
            'mfa:user_id' => $user->id,
            'mfa:remember' => false,
            'mfa:method' => 'backup_code',
        ]);

        $failResponse = $this->post(route('mfa.verify'), [
            'method' => 'backup_code',
            'code' => $backupCodeToUse,
        ]);

        $this->assertGuest();
        $failResponse->assertSessionHasErrors('code');
    }

    public function test_admin_can_update_mfa_settings(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin)->post(route('admin.mfa_settings.update'), [
            'mfa_policy' => 'enforced_all',
            'mfa_allow_email' => '1',
            'mfa_allow_totp' => '1',
            'mfa_otp_expiration' => '15',
            'mfa_resend_cooldown' => '45',
            'mfa_max_attempts' => '6',
            'mfa_max_resends' => '4',
        ]);

        $response->assertSessionHas('success');
        $this->assertEquals('enforced_all', Setting::where('key', 'mfa_policy')->value('value'));
        $this->assertEquals('15', Setting::where('key', 'mfa_otp_expiration')->value('value'));
        $this->assertEquals('45', Setting::where('key', 'mfa_resend_cooldown')->value('value'));
    }

    public function test_admin_can_emergency_reset_user_mfa(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $client = User::factory()->create([
            'role' => 'client',
            'mfa_enabled' => true,
            'mfa_type' => 'authenticator',
            'mfa_secret' => 'TESTSECRETKEY123',
        ]);

        app(MfaService::class)->generateBackupCodes($client, 4);
        $this->assertEquals(4, $client->backupCodes()->count());

        $response = $this->actingAs($admin)->post(route('admin.users.reset_mfa', $client->id));

        $response->assertSessionHas('success');

        $client->refresh();
        $this->assertFalse((bool) $client->mfa_enabled);
        $this->assertNull($client->mfa_secret);
        $this->assertEquals(0, $client->backupCodes()->count());
    }
}
