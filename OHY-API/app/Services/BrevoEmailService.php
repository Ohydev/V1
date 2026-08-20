<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Mail\OtpEmail;
use App\Mail\RegistrationOtpEmail;
use App\Mail\TicketPurchaseConfirmationEmail;

class BrevoEmailService
{
    /**
     * Brevo API endpoint for sending transactional emails via HTTP API
     */
    private $brevoApiUrl = 'https://api.brevo.com/v3/smtp/email';

    /**
     * Get Brevo API key from configuration
     * 
     * @return string Brevo API key
     */
    private function getApiKey()
    {
        return config('services.brevo.api_key');
    }

    /**
     * Get sender email from configuration
     * 
     * @return string Sender email address
     */
    private function getSenderEmail()
    {
        return config('services.brevo.sender_email');
    }

    /**
     * Get sender name from configuration
     * 
     * @return string Sender name
     */
    private function getSenderName()
    {
        return config('services.brevo.sender_name', 'OHY Platform');
    }

    /**
     * Send email via Brevo HTTP API (HTTPS - port 443, not blocked by cPanel)
     * 
     * @param string $to Recipient email address
     * @param string $subject Email subject
     * @param string $htmlContent HTML email content
     * @return array Returns array with 'success' boolean and optional 'error' message
     */
    private function sendEmailViaApi($to, $subject, $htmlContent)
    {
        try {
            // Get API credentials from configuration
            $apiKey = $this->getApiKey();
            $senderEmail = $this->getSenderEmail();
            $senderName = $this->getSenderName();

            // Validate API credentials are configured
            if (empty($apiKey) || empty($senderEmail)) {
                Log::error('BrevoEmailService: API credentials not configured', array(
                    'api_key_set' => !empty($apiKey),
                    'sender_email_set' => !empty($senderEmail)
                ));

                return array(
                    'success' => false,
                    'error' => 'Email service configuration error. Please contact support.'
                );
            }

            // Prepare API request payload according to Brevo API v3 specification
            // Extract name from email address (part before @) as fallback if no name provided
            $recipientName = explode('@', $to)[0];
            
            $payload = array(
                'sender' => array(
                    'name' => $senderName,
                    'email' => $senderEmail
                ),
                'to' => array(
                    array(
                        'email' => $to,
                        'name' => $recipientName
                    )
                ),
                'subject' => $subject,
                'htmlContent' => $htmlContent
            );

            // Send HTTP POST request to Brevo API using Laravel HTTP client (uses HTTPS port 443)
            // Note: Laravel Http facade response object has status(), json(), and body() methods
            $response = Http::withoutVerifying()
                ->withHeaders([
                    'api-key' => $apiKey,
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json'
                ])
                ->timeout(30)
                ->post($this->brevoApiUrl, $payload);

            // Linter may show warnings but these methods are valid at runtime
            // $response = Http::withHeaders(array(
            //     'api-key' => $apiKey,
            //     'Content-Type' => 'application/json',
            //     'Accept' => 'application/json'
            // ))->timeout(30)->post($this->brevoApiUrl, $payload);

            // Get response status code (Laravel Http response has status() method)
            $statusCode = $response->status();

            // Check if request was successful (status code 200-299)
            if ($statusCode >= 200 && $statusCode < 300) {
                // Get response body as JSON array (Laravel Http response has json() method)
                $responseData = $response->json();

                // Log successful email send
                Log::info('BrevoEmailService: Email sent successfully via API', array(
                    'email' => $to,
                    'subject' => $subject,
                    'status' => $statusCode,
                    'response' => $responseData
                ));

                return array(
                    'success' => true
                );
            } else {
                // Get response body as string (Laravel Http response has body() method)
                $responseBody = $response->body();

                // Log API error response
                Log::error('BrevoEmailService: API request failed', array(
                    'email' => $to,
                    'status' => $statusCode,
                    'response' => $responseBody
                ));

                return array(
                    'success' => false,
                    'error' => 'An error occurred while sending email. Please try again later.'
                );
            }
        } catch (\Exception $e) {
            // Log exception details
            Log::error('BrevoEmailService: Exception occurred while sending email via API', array(
                'email' => $to,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ));

            return array(
                'success' => false,
                'error' => 'An error occurred while sending email. Please try again later.'
            );
        }
    }

    /**
     * Extract HTML content from Mailable class
     * 
     * @param object $mailable Mailable instance
     * @return string HTML email content
     */
    private function extractHtmlContent($mailable)
    {
        // Get the content definition from mailable
        $content = $mailable->content();

        // Extract HTML string from content
        $htmlContent = $content->htmlString;

        return $htmlContent;
    }

    /**
     * Extract subject from Mailable class
     * 
     * @param object $mailable Mailable instance
     * @return string Email subject
     */
    private function extractSubject($mailable)
    {
        // Get the envelope definition from mailable
        $envelope = $mailable->envelope();

        // Extract subject from envelope
        $subject = $envelope->subject;

        return $subject;
    }

    /**
     * Send OTP email via Brevo HTTP API
     * 
     * @param string $email Recipient email address
     * @param string $otpCode 6-digit OTP code (plain text, will be sent as-is)
     * @param string $userType User type ('user' or 'host')
     * @return array Returns array with 'success' boolean and optional 'error' message
     */
    public function sendOtpEmail($email, $otpCode, $userType = 'user')
    {
        try {
            // Determine user type label for email content
            $userTypeLabel = $userType === 'host' ? 'Host' : 'User';

            // Create OtpEmail mailable instance to extract HTML content and subject
            $mailable = new OtpEmail($otpCode, $userTypeLabel);

            // Extract HTML content and subject from mailable
            $htmlContent = $this->extractHtmlContent($mailable);
            $subject = $this->extractSubject($mailable);

            // Send email via Brevo HTTP API
            return $this->sendEmailViaApi($email, $subject, $htmlContent);
        } catch (\Exception $e) {
            // Log exception
            Log::error('BrevoEmailService: Exception occurred while sending OTP email', array(
                'email' => $email,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ));

            return array(
                'success' => false,
                'error' => 'An error occurred while sending email. Please try again later.'
            );
        }
    }

    /**
     * Send registration OTP email via Brevo HTTP API
     * 
     * @param string $email Recipient email address
     * @param string $otpCode 6-digit OTP code (plain text, will be sent as-is)
     * @param string $userType User type ('user' or 'host')
     * @return array Returns array with 'success' boolean and optional 'error' message
     */
    public function sendRegistrationOtpEmail($email, $otpCode, $userType = 'user')
    {
        try {
            // Determine user type label for email content
            $userTypeLabel = $userType === 'host' ? 'Host' : 'User';

            // Create RegistrationOtpEmail mailable instance to extract HTML content and subject
            $mailable = new RegistrationOtpEmail($otpCode, $userTypeLabel);

            // Extract HTML content and subject from mailable
            $htmlContent = $this->extractHtmlContent($mailable);
            $subject = $this->extractSubject($mailable);

            // Send email via Brevo HTTP API
            return $this->sendEmailViaApi($email, $subject, $htmlContent);
        } catch (\Exception $e) {
            // Log exception
            Log::error('BrevoEmailService: Exception occurred while sending registration OTP email', array(
                'email' => $email,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ));

            return array(
                'success' => false,
                'error' => 'An error occurred while sending email. Please try again later.'
            );
        }
    }

    /**
     * Send ticket purchase confirmation email via Brevo HTTP API
     * 
     * @param string $email Recipient email address
     * @param string $orderNumber Order number
     * @param string $eventTitle Event title
     * @param float $totalAmount Total amount paid
     * @param string $fullName Full name of purchaser
     * @return array Returns array with 'success' boolean and optional 'error' message
     */
    public function sendTicketPurchaseConfirmationEmail($email, $orderNumber, $eventTitle, $totalAmount, $fullName)
    {
        try {
            // Create TicketPurchaseConfirmationEmail mailable instance to extract HTML content and subject
            $mailable = new TicketPurchaseConfirmationEmail($orderNumber, $eventTitle, $totalAmount, $fullName);

            // Extract HTML content and subject from mailable
            $htmlContent = $this->extractHtmlContent($mailable);
            $subject = $this->extractSubject($mailable);

            // Send email via Brevo HTTP API
            return $this->sendEmailViaApi($email, $subject, $htmlContent);
        } catch (\Exception $e) {
            // Log exception
            Log::error('BrevoEmailService: Exception occurred while sending ticket purchase confirmation email', array(
                'email' => $email,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ));

            return array(
                'success' => false,
                'error' => 'An error occurred while sending email. Please try again later.'
            );
        }
    }
}
