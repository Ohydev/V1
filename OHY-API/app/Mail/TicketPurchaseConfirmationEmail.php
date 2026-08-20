<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketPurchaseConfirmationEmail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Order number
     */
    public $orderNumber;

    /**
     * Event title
     */
    public $eventTitle;

    /**
     * Total amount paid
     */
    public $totalAmount;

    /**
     * Full name of purchaser
     */
    public $fullName;

    /**
     * Create a new message instance.
     * 
     * @param string $orderNumber Order number
     * @param string $eventTitle Event title
     * @param float $totalAmount Total amount paid
     * @param string $fullName Full name of purchaser
     */
    public function __construct($orderNumber, $eventTitle, $totalAmount, $fullName)
    {
        $this->orderNumber = $orderNumber;
        $this->eventTitle = $eventTitle;
        $this->totalAmount = $totalAmount;
        $this->fullName = $fullName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Ticket Purchase Confirmation - OHY Platform',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            htmlString: $this->getTicketPurchaseEmailTemplate(),
        );
    }

    /**
     * Get HTML email template for ticket purchase confirmation
     * 
     * @return string HTML email content
     */
    private function getTicketPurchaseEmailTemplate()
    {
        $formattedAmount = number_format((float)$this->totalAmount, 2, '.', '');
        
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ticket Purchase Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
        <h2 style="color: #333; margin-top: 0;">Thank You for Your Purchase!</h2>
        <p>Hello ' . htmlspecialchars($this->fullName) . ',</p>
        <p>Thank you for using OHY Platform to purchase your ticket. Your order has been confirmed and your payment has been processed successfully.</p>
        
        <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> ' . htmlspecialchars($this->orderNumber) . '</p>
            <p style="margin: 5px 0;"><strong>Event:</strong> ' . htmlspecialchars($this->eventTitle) . '</p>
            <p style="margin: 5px 0;"><strong>Total Amount:</strong> $' . htmlspecialchars($formattedAmount) . '</p>
        </div>
        
        <p>Your tickets have been confirmed. You will receive additional details about the event closer to the date.</p>
        <p>If you have any questions or need assistance, please don\'t hesitate to contact our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; margin: 0;">This is an automated message from OHY Platform. Please do not reply to this email.</p>
    </div>
</body>
</html>';

        return $html;
    }
}
