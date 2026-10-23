<?php

namespace App\Notifications;

use App\Services\NotificationConfigService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MfaOtpNotification extends Notification
{
    use Queueable;

    public string $code;
    public int $expiresInMinutes;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $code, int $expiresInMinutes = 10)
    {
        $this->code = $code;
        $this->expiresInMinutes = $expiresInMinutes;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @param mixed $notifiable
     * @return array
     */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     *
     * @param mixed $notifiable
     * @return MailMessage
     */
    public function toMail($notifiable): MailMessage
    {
        // Dynamically configure SMTP credentials from admin settings
        NotificationConfigService::applyMailConfig();

        return (new MailMessage)
            ->subject("Your ELFAA Verification Code: {$this->code}")
            ->view('emails.mfa_otp', [
                'user' => $notifiable,
                'code' => $this->code,
                'expiresInMinutes' => $this->expiresInMinutes,
            ]);
    }
}
