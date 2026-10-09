<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class NotificationConfigService
{
    /**
     * Get a setting by key with fallback.
     */
    public static function getSetting(string $key, $default = null)
    {
        return Setting::where('key', $key)->value('value') ?? $default;
    }

    /**
     * Apply DB settings dynamically to Laravel's runtime mail configuration.
     */
    public static function applyMailConfig(?array $overrides = null): void
    {
        $driver     = $overrides['mail_driver'] ?? self::getSetting('mail_driver', 'smtp');
        $host       = $overrides['mail_host'] ?? self::getSetting('mail_host', config('mail.mailers.smtp.host'));
        $port       = $overrides['mail_port'] ?? self::getSetting('mail_port', config('mail.mailers.smtp.port', 587));
        $encryption = $overrides['mail_encryption'] ?? self::getSetting('mail_encryption', 'tls');
        $username   = $overrides['mail_username'] ?? self::getSetting('mail_username', config('mail.mailers.smtp.username'));
        $password   = $overrides['mail_password'] ?? self::getSetting('mail_password', config('mail.mailers.smtp.password'));
        $fromEmail  = $overrides['mail_from_address'] ?? self::getSetting('mail_from_address', config('mail.from.address'));
        $fromName   = $overrides['mail_from_name'] ?? self::getSetting('mail_from_name', config('mail.from.name', 'ELFAA Car Rental'));

        // Handle 'none' or 'null' string encryption setting
        if (in_array(strtolower((string)$encryption), ['none', 'null', ''], true)) {
            $encryption = null;
        }

        Config::set('mail.default', $driver);
        Config::set('mail.mailers.smtp.host', $host);
        Config::set('mail.mailers.smtp.port', (int) $port);
        Config::set('mail.mailers.smtp.encryption', $encryption);
        Config::set('mail.mailers.smtp.username', $username);
        Config::set('mail.mailers.smtp.password', $password);

        if (!empty($fromEmail)) {
            Config::set('mail.from.address', $fromEmail);
            Config::set('mail.from.name', $fromName ?: 'ELFAA Car Rental');
        }

        // Purge resolved mailer so Laravel instantiates a fresh instance with updated config
        Mail::purge($driver);
    }

    /**
     * Send a test email.
     */
    public static function sendTestEmail(string $recipientEmail, ?array $overrides = null): array
    {
        try {
            self::applyMailConfig($overrides);

            $fromName  = $overrides['mail_from_name'] ?? self::getSetting('mail_from_name', 'ELFAA Car Rental');
            $fromEmail = $overrides['mail_from_address'] ?? self::getSetting('mail_from_address', 'no-reply@elfaacar.com');

            Mail::raw(
                "Hello!\n\nThis is a test notification email from your ELFAA Car Rental Platform.\n\n" .
                "If you received this email, your SMTP settings are configured correctly!\n\n" .
                "Timestamp: " . now()->toDayDateTimeString() . "\n\n" .
                "Best regards,\nELFAA Platform Team",
                function ($message) use ($recipientEmail, $fromName, $fromEmail) {
                    $message->to($recipientEmail)
                            ->from($fromEmail, $fromName)
                            ->subject('✅ ELFAA SMTP Configuration Test Email');
                }
            );

            return [
                'success' => true,
                'message' => "Test email successfully sent to {$recipientEmail}!",
            ];
        } catch (\Throwable $e) {
            Log::error('SMTP Test Mail Failed: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'SMTP Test Failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Send SMS via configured gateway (Semaphore, Twilio, or Generic HTTP API).
     */
    public static function sendSms(string $recipientPhone, string $messageText, ?array $overrides = null): array
    {
        $provider   = $overrides['sms_provider'] ?? self::getSetting('sms_provider', 'semaphore');
        $apiKey     = $overrides['sms_api_key'] ?? self::getSetting('sms_api_key', '');
        $senderId   = $overrides['sms_sender_id'] ?? self::getSetting('sms_sender_id', 'ELFAACAR');
        $accountSid = $overrides['sms_account_sid'] ?? self::getSetting('sms_account_sid', '');
        $apiUrl     = $overrides['sms_api_url'] ?? self::getSetting('sms_api_url', '');

        $enabled = ($overrides['sms_notifications_enabled'] ?? self::getSetting('sms_notifications_enabled', '1')) === '1';
        if (!$enabled && empty($overrides)) {
            return [
                'success' => false,
                'message' => 'SMS Notifications are currently disabled in Admin Settings.',
            ];
        }

        try {
            if ($provider === 'semaphore') {
                if (empty($apiKey)) {
                    return ['success' => false, 'message' => 'Semaphore API Key is missing.'];
                }

                $url = $apiUrl ?: 'https://api.semaphore.co/api/v4/messages';
                $response = Http::asForm()->post($url, [
                    'apikey'     => $apiKey,
                    'number'     => $recipientPhone,
                    'message'    => $messageText,
                    'sendername' => $senderId ?: 'ELFAACAR',
                ]);

                if ($response->successful()) {
                    return [
                        'success'  => true,
                        'message'  => 'SMS sent successfully via Semaphore!',
                        'response' => $response->json(),
                    ];
                }

                return [
                    'success' => false,
                    'message' => 'Semaphore Error: ' . ($response->json('message') ?? $response->body()),
                ];
            }

            if ($provider === 'twilio') {
                if (empty($accountSid) || empty($apiKey)) {
                    return ['success' => false, 'message' => 'Twilio Account SID or Auth Token/API Key is missing.'];
                }

                $url = $apiUrl ?: "https://api.twilio.com/2010-04-01/Accounts/{$accountSid}/Messages.json";
                $response = Http::withBasicAuth($accountSid, $apiKey)
                    ->asForm()
                    ->post($url, [
                        'To'   => $recipientPhone,
                        'From' => $senderId ?: '+1234567890',
                        'Body' => $messageText,
                    ]);

                if ($response->successful()) {
                    return [
                        'success'  => true,
                        'message'  => 'SMS sent successfully via Twilio!',
                        'response' => $response->json(),
                    ];
                }

                return [
                    'success' => false,
                    'message' => 'Twilio Error: ' . ($response->json('message') ?? $response->body()),
                ];
            }

            // Generic Custom HTTP API Gateway
            if ($provider === 'generic_http') {
                if (empty($apiUrl)) {
                    return ['success' => false, 'message' => 'Custom API Endpoint URL is required for Generic HTTP Provider.'];
                }

                $response = Http::withHeaders([
                    'Authorization' => 'Bearer ' . $apiKey,
                    'Content-Type'  => 'application/json',
                ])->post($apiUrl, [
                    'to'       => $recipientPhone,
                    'message'  => $messageText,
                    'sender'   => $senderId,
                ]);

                if ($response->successful()) {
                    return [
                        'success'  => true,
                        'message'  => 'SMS sent successfully via Custom HTTP API!',
                        'response' => $response->json() ?? $response->body(),
                    ];
                }

                return [
                    'success' => false,
                    'message' => 'Custom Gateway Error (' . $response->status() . '): ' . $response->body(),
                ];
            }

            return ['success' => false, 'message' => "Unsupported SMS provider: {$provider}"];
        } catch (\Throwable $e) {
            Log::error('SMS Dispatch Exception: ' . $e->getMessage());
            return ['success' => false, 'message' => 'SMS Gateway Exception: ' . $e->getMessage()];
        }
    }

    /**
     * Send a test SMS.
     */
    public static function sendTestSms(string $recipientPhone, ?array $overrides = null): array
    {
        $message = "ELFAA CAR RENTAL: Your SMS notification service is working properly! Time: " . now()->format('h:i A, M d');
        return self::sendSms($recipientPhone, $message, $overrides);
    }

    /**
     * Send booking lifecycle email notification using configured dynamic SMTP settings.
     */
    public static function sendBookingNotification($booking, string $type, ?string $reason = null): bool
    {
        try {
            self::applyMailConfig();

            // Ensure vehicle relationship is loaded
            if (!$booking->relationLoaded('vehicle')) {
                $booking->load('vehicle');
            }
            if (!$booking->relationLoaded('user')) {
                $booking->load('user');
            }

            $recipientEmail = $booking->user->email ?? null;
            if (empty($recipientEmail) && $type !== 'admin_booking_alert') {
                Log::warning("Cannot send booking email for Booking #{$booking->id}: User email is missing.");
                return false;
            }

            $subjects = [
                'booking_created'     => "🚗 Booking Request Submitted - #{$booking->id}",
                'booking_approved'    => "✅ Booking Approved & Confirmed! - #{$booking->id}",
                'booking_confirmed'   => "✅ Booking Approved & Confirmed! - #{$booking->id}",
                'booking_rejected'    => "❌ Booking Request Update - #{$booking->id}",
                'booking_cancelled'   => "⚠️ Booking Cancelled - #{$booking->id}",
                'admin_booking_alert' => "🚨 New Booking Submitted - #{$booking->id}",
            ];

            $subject = $subjects[$type] ?? "ELFAA Booking Notification - #{$booking->id}";
            $fromName  = self::getSetting('mail_from_name', 'ELFAA Car Rental');
            $fromEmail = self::getSetting('mail_from_address', config('mail.from.address', 'no-reply@elfaacar.com'));

            // Send to admin email for admin alerts, customer email for customer notifications
            $toEmail = ($type === 'admin_booking_alert') 
                ? self::getSetting('admin_contact_email', $fromEmail)
                : $recipientEmail;

            Mail::send('emails.booking_notification', [
                'booking' => $booking,
                'type'    => $type,
                'reason'  => $reason,
            ], function ($message) use ($toEmail, $subject, $fromEmail, $fromName) {
                $message->to($toEmail)
                        ->from($fromEmail, $fromName)
                        ->subject($subject);
            });

            Log::info("Booking email '{$type}' successfully dispatched for Booking #{$booking->id} to {$toEmail}.");
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send booking email notification ('{$type}') for Booking #{$booking->id}: " . $e->getMessage());
            return false;
        }
    }
}
