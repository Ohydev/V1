<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RegistrationOtpEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * OTP code to be sent
     */
    public $otpCode;

    /**
     * User type label for personalization
     */
    public $userTypeLabel;

    /**
     * Create a new message instance.
     * 
     * @param string $otpCode 6-digit OTP code
     * @param string $userTypeLabel User type label ('User' or 'Host')
     */
    public function __construct($otpCode, $userTypeLabel = 'User')
    {
        $this->otpCode = $otpCode;
        $this->userTypeLabel = $userTypeLabel;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Email Verification OTP - OHY Platform',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: $this->getRegistrationOtpEmailTemplate(),
        );
    }

    /**
     * Get HTML email template for registration OTP
     * 
     * @return string HTML email content
     */
    private function getRegistrationOtpEmailTemplate()
    {
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verification OTP</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Welcome to OHY Platform!</h2>
        <p>Hello ' . htmlspecialchars($this->userTypeLabel) . ',</p>
        <p>Thank you for registering with OHY Platform. To complete your registration and verify your email address, please use the following OTP code:</p>
        <div style="background-color: #fff; border: 2px solid #007bff; border-radius: 6px; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 0;">' . htmlspecialchars($this->otpCode) . '</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <p style="color: #666; font-size: 14px;">If you did not create an account with OHY Platform, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message from OHY Platform. Please do not reply to this email.</p>
    </div>
</body>
</html>';

        return $html;
    }
}
