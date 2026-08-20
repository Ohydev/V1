<?php

namespace App\Services;

use App\Models\CartModel;
use App\Models\CouponModel;
use App\Models\EventModel;
use App\Models\OrderModel;
use App\Models\OrderTicketModel;
use App\Models\TicketModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;

class StripeService
{
    /**
     * Stripe client instance
     *
     * @var \Stripe\StripeClient
     */
    protected $stripe;

    /**
     * Initialize Stripe service with Super Admin's secret key
     */
    public function __construct()
    {
        $secretKey = config('services.stripe.secret');

        if (empty($secretKey)) {
            throw new \Exception('Stripe secret key is not configured. Please set STRIPE_SECRET in your .env file.');
        }

        $this->stripe = new StripeClient($secretKey);
    }

    /**
     * Create Stripe Express Connected Account for a host
     *
     * @param  array  $hostUserData  Host user data (email, first_name, last_name, etc.)
     * @return \Stripe\Account Stripe Account object with id (stripe_account_id)
     *
     * @throws \Stripe\Exception\ApiErrorException
     */
    public function createConnectedAccount(array $hostUserData)
    {
        try {
            $accountData = [
                'type' => 'express',
                'country' => $hostUserData['country'] ?? 'US', // Default to US, can be made configurable
                'email' => $hostUserData['email'] ?? null,
                'capabilities' => [
                    'card_payments' => ['requested' => true],
                    'transfers' => ['requested' => true],
                ],
            ];

            // Add metadata for webhook tracking
            if (isset($hostUserData['host_user_id'])) {
                $accountData['metadata'] = [
                    'host_user_id' => $hostUserData['host_user_id'],
                ];
            }

            // Add business profile if available
            if (isset($hostUserData['business_name'])) {
                $accountData['business_profile'] = [
                    'name' => $hostUserData['business_name'],
                ];
            }

            $account = $this->stripe->accounts->create($accountData);

            Log::info('Stripe Connected Account created successfully', [
                'method' => __METHOD__,
                'account_id' => $account->id,
                'host_user_id' => $hostUserData['host_user_id'] ?? null,
            ]);

            return $account;
        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: Failed to create Connected Account', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'stripe_error' => $e->getJsonBody(),
                'host_user_id' => $hostUserData['host_user_id'] ?? null,
            ]);
            throw $e;
        }
    }

    /**
     * Generate onboarding link for host to complete Stripe Express setup
     *
     * @param  string  $stripeAccountId  The Connected Account ID
     * @param  string  $returnUrl  URL to redirect after onboarding completion
     * @param  string  $refreshUrl  URL to redirect if link expires
     * @return \Stripe\AccountLink AccountLink object with url property
     *
     * @throws \Stripe\Exception\ApiErrorException
     */
    public function createAccountLink(string $stripeAccountId, string $returnUrl, string $refreshUrl)
    {
        try {
            $accountLink = $this->stripe->accountLinks->create([
                'account' => $stripeAccountId,
                'refresh_url' => $refreshUrl,
                'return_url' => $returnUrl,
                'type' => 'account_onboarding',
            ]);

            Log::info('Stripe Account Link created successfully', [
                'method' => __METHOD__,
                'account_id' => $stripeAccountId,
                'link_url' => $accountLink->url,
            ]);

            return $accountLink;
        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: Failed to create Account Link', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'stripe_error' => $e->getJsonBody(),
                'account_id' => $stripeAccountId,
            ]);
            throw $e;
        }
    }

    /**
     * Check if host account is ready for payouts
     *
     * @param  string  $stripeAccountId  The Connected Account ID
     * @return array Account status information (charges_enabled, payouts_enabled, details_submitted)
     *
     * @throws \Stripe\Exception\ApiErrorException
     */
    public function getAccountStatus(string $stripeAccountId)
    {
        try {
            $account = $this->stripe->accounts->retrieve($stripeAccountId);

            $status = [
                'charges_enabled' => $account->charges_enabled ?? false,
                'payouts_enabled' => $account->payouts_enabled ?? false,
                'details_submitted' => $account->details_submitted ?? false,
                'account_id' => $account->id,
            ];

            Log::info('Stripe Account Status retrieved', [
                'method' => __METHOD__,
                'account_id' => $stripeAccountId,
                'status' => $status,
            ]);

            return $status;
        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: Failed to get Account Status', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'stripe_error' => $e->getJsonBody(),
                'account_id' => $stripeAccountId,
            ]);
            throw $e;
        }
    }

    /**
     * Check if host has completed KYC/onboarding
     *
     * @param  string  $stripeAccountId  The Connected Account ID
     * @return bool True if charges_enabled and payouts_enabled are both true
     */
    public function isKycCompleted(string $stripeAccountId): bool
    {
        try {
            $status = $this->getAccountStatus($stripeAccountId);

            return $status['charges_enabled'] === true && $status['payouts_enabled'] === true;
        } catch (\Exception $e) {
            Log::error('Failed to check KYC completion status', [
                'method' => __METHOD__,
                'error_message' => $e->getMessage(),
                'account_id' => $stripeAccountId,
            ]);

            return false;
        }
    }

    /**
     * Create Stripe Checkout Session for visitor payment
     *
     * @param  array  $orderData  Order data with line_items, customer_email, metadata, success_url, cancel_url
     * @return \Stripe\Checkout\Session CheckoutSession object with id and url
     *
     * @throws \Stripe\Exception\ApiErrorException
     */
    public function createCheckoutSession(array $orderData)
    {
        try {
            $sessionData = [
                'payment_method_types' => ['card'],
                'mode' => 'payment',
                'line_items' => $orderData['line_items'] ?? [],
                'success_url' => $orderData['success_url'] ?? null,
                'cancel_url' => $orderData['cancel_url'] ?? null,
            ];

            // Add customer email if provided
            if (isset($orderData['customer_email'])) {
                $sessionData['customer_email'] = $orderData['customer_email'];
            }

            // Add metadata for order tracking
            if (isset($orderData['metadata'])) {
                $sessionData['metadata'] = $orderData['metadata'];
            }

            // Add payment intent data if needed (for future use)
            if (isset($orderData['payment_intent_data'])) {
                $sessionData['payment_intent_data'] = $orderData['payment_intent_data'];
            }

            $session = $this->stripe->checkout->sessions->create($sessionData);

            Log::info('Stripe Checkout Session created successfully', [
                'method' => __METHOD__,
                'session_id' => $session->id,
                'order_metadata' => $orderData['metadata'] ?? [],
            ]);

            return $session;
        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: Failed to create Checkout Session', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'stripe_error' => $e->getJsonBody(),
                'order_metadata' => $orderData['metadata'] ?? [],
            ]);
            throw $e;
        }
    }

    /**
     * Create Stripe Transfer to host's Connected Account
     *
     * @param  string  $stripeAccountId  Host's Connected Account ID
     * @param  int  $amount  Amount in cents (integer)
     * @param  string  $currency  Currency code (default: 'usd')
     * @param  array  $metadata  Transfer metadata (order_ids, settlement_id, etc.)
     * @return \Stripe\Transfer Transfer object with id
     *
     * @throws \Stripe\Exception\ApiErrorException
     */
    public function createTransfer(string $stripeAccountId, int $amount, string $currency = 'usd', array $metadata = [])
    {
        try {
            $transferData = [
                'amount' => $amount,
                'currency' => $currency,
                'destination' => $stripeAccountId,
            ];

            // Add metadata if provided
            if (! empty($metadata)) {
                $transferData['metadata'] = $metadata;
            }

            $transfer = $this->stripe->transfers->create($transferData);

            Log::info('Stripe Transfer created successfully', [
                'method' => __METHOD__,
                'transfer_id' => $transfer->id,
                'amount' => $amount,
                'currency' => $currency,
                'destination_account' => $stripeAccountId,
                'metadata' => $metadata,
            ]);

            return $transfer;
        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: Failed to create Transfer', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'stripe_error' => $e->getJsonBody(),
                'destination_account' => $stripeAccountId,
                'amount' => $amount,
                'currency' => $currency,
            ]);
            throw $e;
        }
    }

    /**
     * Get Stripe payment fee from PaymentIntent
     *
     * Retrieves the actual Stripe processing fee charged for a payment.
     *
     * @param  string  $paymentIntentId  Stripe Payment Intent ID
     * @return float|null Stripe fee amount in dollars, or null if retrieval fails
     */
    public function getPaymentFee(string $paymentIntentId): ?float
    {
        try {
            // Retrieve PaymentIntent from Stripe API
            $paymentIntent = $this->stripe->paymentIntents->retrieve($paymentIntentId);

            // Check if PaymentIntent has charges
            if (empty($paymentIntent->charges) || $paymentIntent->charges->data->count() === 0) {
                Log::warning('PaymentIntent has no charges', [
                    'method' => __METHOD__,
                    'payment_intent_id' => $paymentIntentId,
                ]);

                return null;
            }

            // Get the first charge (most recent charge)
            $charge = $paymentIntent->charges->data[0];

            // Check if charge has balance_transaction
            if (empty($charge->balance_transaction)) {
                Log::warning('Charge has no balance_transaction', [
                    'method' => __METHOD__,
                    'payment_intent_id' => $paymentIntentId,
                    'charge_id' => $charge->id ?? null,
                ]);

                return null;
            }

            // Retrieve Balance Transaction to get fee details
            $balanceTransactionId = is_string($charge->balance_transaction)
                ? $charge->balance_transaction
                : $charge->balance_transaction->id;

            $balanceTransaction = $this->stripe->balanceTransactions->retrieve($balanceTransactionId);

            // Extract fee (fee is in cents)
            $feeCents = $balanceTransaction->fee ?? 0;

            // Convert to dollars
            $feeDollars = $feeCents / 100;

            Log::info('Stripe payment fee retrieved successfully', [
                'method' => __METHOD__,
                'payment_intent_id' => $paymentIntentId,
                'fee_cents' => $feeCents,
                'fee_dollars' => $feeDollars,
            ]);

            return round($feeDollars, 2);
        } catch (ApiErrorException $e) {
            Log::error('Stripe API Error: Failed to retrieve payment fee', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'stripe_error' => $e->getJsonBody(),
                'payment_intent_id' => $paymentIntentId,
            ]);

            return null;
        } catch (\Exception $e) {
            Log::error('Error retrieving Stripe payment fee', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'payment_intent_id' => $paymentIntentId,
            ]);

            return null;
        }
    }

    /**
     * Verify webhook request authenticity
     *
     * @param  string  $payload  Raw request body (string)
     * @param  string  $signature  Stripe-Signature header value
     * @param  string|null  $secret  Webhook secret from config (optional, uses config if not provided)
     * @return \Stripe\Event Stripe Event object if valid
     *
     * @throws \Stripe\Exception\SignatureVerificationException
     */
    public function verifyWebhookSignature(string $payload, string $signature, ?string $secret = null)
    {
        try {
            $webhookSecret = $secret ?? config('services.stripe.webhook_secret');

            if (empty($webhookSecret)) {
                throw new \Exception('Stripe webhook secret is not configured. Please set STRIPE_WEBHOOK_SECRET in your .env file.');
            }

            $event = \Stripe\Webhook::constructEvent($payload, $signature, $webhookSecret);

            Log::info('Stripe Webhook signature verified successfully', [
                'method' => __METHOD__,
                'event_id' => $event->id,
                'event_type' => $event->type,
            ]);

            return $event;
        } catch (SignatureVerificationException $e) {
            Log::error('Stripe Webhook signature verification failed', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Stripe Webhook verification error', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Process webhook events and route to appropriate handlers
     *
     * @param  \Stripe\Event  $event  Stripe Event object
     * @return bool Boolean indicating success
     */
    public function handleWebhookEvent($event): bool
    {
        try {
            $eventType = $event->type;
            $eventData = $event->data->object;

            Log::info('Processing Stripe webhook event', [
                'method' => __METHOD__,
                'event_id' => $event->id,
                'event_type' => $eventType,
            ]);

            switch ($eventType) {
                case 'checkout.session.completed':
                    return $this->handleCheckoutSessionCompleted($eventData);

                case 'checkout.session.async_payment_succeeded':
                    return $this->handleCheckoutSessionAsyncPaymentSucceeded($eventData);

                case 'checkout.session.async_payment_failed':
                    return $this->handleCheckoutSessionAsyncPaymentFailed($eventData);

                case 'account.updated':
                    return $this->handleAccountUpdated($eventData);

                case 'transfer.created':
                    return $this->handleTransferCreated($eventData);

                case 'transfer.paid':
                    return $this->handleTransferPaid($eventData);

                case 'payment_intent.payment_failed':
                    return $this->handlePaymentIntentPaymentFailed($eventData);

                default:
                    Log::info('Unhandled Stripe webhook event type', [
                        'method' => __METHOD__,
                        'event_id' => $event->id,
                        'event_type' => $eventType,
                    ]);

                    return true; // Return true for unhandled events (not an error)
            }
        } catch (\Exception $e) {
            Log::error('Error processing Stripe webhook event', [
                'method' => __METHOD__,
                'error_type' => get_class($e),
                'error_message' => $e->getMessage(),
                'event_id' => $event->id ?? null,
                'event_type' => $event->type ?? null,
            ]);

            return false;
        }
    }

    /**
     * Handle checkout.session.completed event
     * Mark order as paid, create order tickets, update inventory, clear cart
     *
     * @param  object  $session  Checkout Session object
     */
    private function handleCheckoutSessionCompleted($session): bool
    {
        try {
            $sessionId = $session->id ?? null;
            $paymentStatus = $session->payment_status ?? null;
            $metadata = $session->metadata ?? [];

            Log::info('Handling checkout.session.completed event', [
                'method' => __METHOD__,
                'session_id' => $sessionId,
                'payment_status' => $paymentStatus,
                'metadata' => $metadata,
            ]);

            // Verify payment was successful
            if ($paymentStatus !== 'paid') {
                Log::warning('Checkout session completed but payment status is not paid', [
                    'method' => __METHOD__,
                    'session_id' => $sessionId,
                    'payment_status' => $paymentStatus,
                ]);

                return false;
            }

            // Process successful payment
            return $this->processSuccessfulPayment($session);
        } catch (\Exception $e) {
            Log::error('Error handling checkout.session.completed', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'session_id' => $session->id ?? null,
            ]);

            return false;
        }
    }

    /**
     * Handle checkout.session.async_payment_succeeded event
     * Mark order as paid (for async payment methods)
     *
     * @param  object  $session  Checkout Session object
     */
    private function handleCheckoutSessionAsyncPaymentSucceeded($session): bool
    {
        try {
            $sessionId = $session->id ?? null;
            $paymentStatus = $session->payment_status ?? null;

            Log::info('Handling checkout.session.async_payment_succeeded event', [
                'method' => __METHOD__,
                'session_id' => $sessionId,
                'payment_status' => $paymentStatus,
            ]);

            // Process successful payment (same logic as checkout.session.completed)
            return $this->processSuccessfulPayment($session);
        } catch (\Exception $e) {
            Log::error('Error handling checkout.session.async_payment_succeeded', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'session_id' => $session->id ?? null,
            ]);

            return false;
        }
    }

    /**
     * Handle checkout.session.async_payment_failed event
     * Mark order as failed
     *
     * @param  object  $session  Checkout Session object
     */
    private function handleCheckoutSessionAsyncPaymentFailed($session): bool
    {
        try {
            $sessionId = $session->id ?? null;
            $metadata = $session->metadata ?? [];

            Log::info('Handling checkout.session.async_payment_failed event', [
                'method' => __METHOD__,
                'session_id' => $sessionId,
                'payment_status' => $session->payment_status ?? null,
                'metadata' => $metadata,
            ]);

            // Find order by stripe_checkout_session_id
            $orderModel = new OrderModel;
            $order = $orderModel->get_order(['stripe_checkout_session_id' => $sessionId]);

            if (empty($order)) {
                // Try to find by order_id from metadata as backup
                if (isset($metadata['order_id'])) {
                    $order = $orderModel->get_order(['order_id' => $metadata['order_id']]);
                }
            }

            if (empty($order)) {
                Log::error('Order not found for failed payment', [
                    'method' => __METHOD__,
                    'session_id' => $sessionId,
                    'metadata' => $metadata,
                ]);

                return false;
            }

            // Update order status to failed
            $updateCondition = ['order_id' => $order->order_id];
            $updateData = ['order_status' => 'failed'];
            $orderModel->update_order_data($updateCondition, $updateData);

            Log::info('Order marked as failed', [
                'method' => __METHOD__,
                'order_id' => $order->order_id,
                'session_id' => $sessionId,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Error handling checkout.session.async_payment_failed', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'session_id' => $session->id ?? null,
            ]);

            return false;
        }
    }

    /**
     * Handle account.updated event
     * Update host onboarding status
     *
     * @param  object  $account  Account object
     */
    private function handleAccountUpdated($account): bool
    {
        Log::info('Handling account.updated event', [
            'method' => __METHOD__,
            'account_id' => $account->id ?? null,
            'charges_enabled' => $account->charges_enabled ?? null,
            'payouts_enabled' => $account->payouts_enabled ?? null,
            'details_submitted' => $account->details_submitted ?? null,
            'metadata' => $account->metadata ?? [],
        ]);

        // This will be implemented in Phase 3 when we create the webhook controller
        // For now, just log the event
        return true;
    }

    /**
     * Handle transfer.created event
     * Log transfer creation
     *
     * @param  object  $transfer  Transfer object
     */
    private function handleTransferCreated($transfer): bool
    {
        Log::info('Handling transfer.created event', [
            'method' => __METHOD__,
            'transfer_id' => $transfer->id ?? null,
            'amount' => $transfer->amount ?? null,
            'currency' => $transfer->currency ?? null,
            'destination' => $transfer->destination ?? null,
            'metadata' => $transfer->metadata ?? [],
        ]);

        // This will be implemented in Phase 3 when we create the webhook controller
        // For now, just log the event
        return true;
    }

    /**
     * Handle transfer.paid event
     * Mark orders as settled
     *
     * @param  object  $transfer  Transfer object
     */
    private function handleTransferPaid($transfer): bool
    {
        Log::info('Handling transfer.paid event', [
            'method' => __METHOD__,
            'transfer_id' => $transfer->id ?? null,
            'amount' => $transfer->amount ?? null,
            'currency' => $transfer->currency ?? null,
            'destination' => $transfer->destination ?? null,
            'metadata' => $transfer->metadata ?? [],
        ]);

        // This will be implemented in Phase 6 (Settlement Flow)
        // For now, just log the event
        return true;
    }

    /**
     * Process successful payment - shared logic for checkout.session.completed and async_payment_succeeded
     * Creates order tickets, updates inventory, clears cart, and marks order as paid
     *
     * @param  object  $session  Checkout Session object
     */
    private function processSuccessfulPayment($session): bool
    {
        try {
            $sessionId = $session->id ?? null;
            $metadata = $session->metadata ?? [];
            $paymentIntentId = $session->payment_intent ?? null;

            // Initialize models
            $orderModel = new OrderModel;
            $orderTicketModel = new OrderTicketModel;
            $cartModel = new CartModel;
            $ticketModel = new TicketModel;
            $couponModel = new CouponModel;

            // Find order by stripe_checkout_session_id (primary method)
            $order = $orderModel->get_order(['stripe_checkout_session_id' => $sessionId]);

            // Backup: Try to find by order_id from metadata
            if (empty($order) && isset($metadata['order_id'])) {
                $order = $orderModel->get_order(['order_id' => $metadata['order_id']]);
            }

            if (empty($order)) {
                Log::error('Order not found for successful payment', [
                    'method' => __METHOD__,
                    'session_id' => $sessionId,
                    'metadata' => $metadata,
                ]);

                return false;
            }

            // Check if order is already paid (idempotency check)
            if ($order->order_status === 'paid') {
                Log::info('Order already marked as paid, skipping processing', [
                    'method' => __METHOD__,
                    'order_id' => $order->order_id,
                    'session_id' => $sessionId,
                ]);

                return true; // Return true since order is already processed
            }

            // Verify order status is pending_payment
            if ($order->order_status !== 'pending_payment') {
                Log::warning('Order status is not pending_payment, cannot process payment', [
                    'method' => __METHOD__,
                    'order_id' => $order->order_id,
                    'order_status' => $order->order_status,
                    'session_id' => $sessionId,
                ]);

                return false;
            }

            // Get user_id and event_id from order
            $userId = $order->user_id;
            $eventId = $metadata['event_id'] ?? null;

            if (empty($eventId)) {
                Log::error('Event ID not found in session metadata', [
                    'method' => __METHOD__,
                    'order_id' => $order->order_id,
                    'session_id' => $sessionId,
                    'metadata' => $metadata,
                ]);

                return false;
            }

            // Query cart items for user and event
            $cartItems = CartModel::with(['ticket'])
                ->where('user_id', $userId)
                ->whereHas('ticket', function ($query) use ($eventId) {
                    $query->where('event_id', $eventId);
                })
                ->get();

            if ($cartItems->count() == 0) {
                Log::error('No cart items found for order', [
                    'method' => __METHOD__,
                    'order_id' => $order->order_id,
                    'user_id' => $userId,
                    'event_id' => $eventId,
                    'session_id' => $sessionId,
                ]);

                return false;
            }

            // Begin database transaction
            DB::beginTransaction();

            try {
                // Create order_tickets from cart items
                foreach ($cartItems as $cartItem) {
                    $ticket = $cartItem->ticket;

                    if (empty($ticket)) {
                        Log::warning('Ticket not found for cart item', [
                            'method' => __METHOD__,
                            'cart_id' => $cartItem->cart_id,
                            'ticket_id' => $cartItem->ticket_id,
                        ]);

                        continue; // Skip this cart item
                    }

                    $quantity = $cartItem->quantity;
                    $unitPrice = (float) $ticket->price;
                    $totalPrice = $quantity * $unitPrice;

                    // Create order ticket record
                    $orderTicketData = [
                        'order_id' => $order->order_id,
                        'ticket_id' => $ticket->ticket_id,
                        'quantity' => $quantity,
                        'unit_price' => round($unitPrice, 2),
                        'total_price' => round($totalPrice, 2),
                    ];

                    $orderTicketModel->create_order_ticket($orderTicketData);

                    // Update ticket sold_quantity atomically
                    TicketModel::where('ticket_id', $ticket->ticket_id)
                        ->increment('sold_quantity', $quantity);
                }

                // Update order status to paid
                $updateCondition = ['order_id' => $order->order_id];
                $updateData = [
                    'order_status' => 'paid',
                ];

                // Store payment_intent_id if available
                if (! empty($paymentIntentId)) {
                    $updateData['stripe_payment_intent_id'] = $paymentIntentId;

                    // Retrieve and store Stripe fee
                    $stripeFee = $this->getPaymentFee($paymentIntentId);

                    if ($stripeFee !== null) {
                        // Store actual Stripe fee retrieved from API
                        $updateData['stripe_fee'] = $stripeFee;
                    } else {
                        // Fallback: Calculate estimated Stripe fee if API fails
                        // Standard Stripe fee: 2.9% + $0.30
                        $estimatedFee = ($order->total_amount * 0.029) + 0.30;
                        $updateData['stripe_fee'] = round($estimatedFee, 2);

                        Log::warning('Failed to retrieve Stripe fee from API, using estimated fee', [
                            'method' => __METHOD__,
                            'order_id' => $order->order_id,
                            'payment_intent_id' => $paymentIntentId,
                            'estimated_fee' => $estimatedFee,
                        ]);
                    }
                } else {
                    // If no payment_intent_id, calculate estimated fee
                    $estimatedFee = ($order->total_amount * 0.029) + 0.30;
                    $updateData['stripe_fee'] = round($estimatedFee, 2);

                    Log::warning('No payment_intent_id available, using estimated Stripe fee', [
                        'method' => __METHOD__,
                        'order_id' => $order->order_id,
                        'session_id' => $sessionId,
                        'estimated_fee' => $estimatedFee,
                    ]);
                }

                $orderModel->update_order_data($updateCondition, $updateData);

                // Clear cart items for this event
                CartModel::where('user_id', $userId)
                    ->whereHas('ticket', function ($query) use ($eventId) {
                        $query->where('event_id', $eventId);
                    })
                    ->delete();

                // Update coupon times_used if coupon was applied
                if (! empty($order->coupon_id)) {
                    CouponModel::where('coupon_id', $order->coupon_id)
                        ->increment('times_used');
                }

                // Commit transaction
                DB::commit();

                // Reload order with event relationship for email
                $order = $orderModel->get_order(['order_id' => $order->order_id]);

                // Get event information from first order ticket
                $eventTitle = 'Event';
                if (! empty($eventId)) {
                    $event = EventModel::find($eventId);
                    if ($event) {
                        $eventTitle = $event->event_title;
                    }
                }

                // Send ticket purchase confirmation email (non-blocking - don't fail payment if email fails)
                try {
                    $brevoEmailService = new BrevoEmailService;
                    $emailResult = $brevoEmailService->sendTicketPurchaseConfirmationEmail(
                        $order->email,
                        $order->order_number,
                        $eventTitle,
                        $order->total_amount,
                        $order->full_name
                    );

                    if (! $emailResult['success']) {
                        Log::warning('Failed to send ticket purchase confirmation email', [
                            'method' => __METHOD__,
                            'order_id' => $order->order_id,
                            'email' => $order->email,
                            'error' => $emailResult['error'] ?? 'Unknown error',
                        ]);
                    }
                } catch (\Exception $emailException) {
                    // Log email error but don't fail the payment processing
                    Log::error('Exception while sending ticket purchase confirmation email', [
                        'method' => __METHOD__,
                        'order_id' => $order->order_id,
                        'email' => $order->email,
                        'error' => $emailException->getMessage(),
                    ]);
                }

                Log::info('Order payment processed successfully', [
                    'method' => __METHOD__,
                    'order_id' => $order->order_id,
                    'session_id' => $sessionId,
                    'cart_items_processed' => $cartItems->count(),
                ]);

                return true;
            } catch (\Exception $e) {
                // Rollback transaction on error
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            Log::error('Error processing successful payment', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'session_id' => $session->id ?? null,
            ]);

            return false;
        }
    }

    /**
     * Handle payment_intent.payment_failed event
     * Mark order as failed
     *
     * @param  object  $paymentIntent  Payment Intent object
     */
    private function handlePaymentIntentPaymentFailed($paymentIntent): bool
    {
        try {
            $paymentIntentId = $paymentIntent->id ?? null;
            $metadata = $paymentIntent->metadata ?? [];

            Log::info('Handling payment_intent.payment_failed event', [
                'method' => __METHOD__,
                'payment_intent_id' => $paymentIntentId,
                'metadata' => $metadata,
            ]);

            // Initialize order model
            $orderModel = new OrderModel;

            // Try to find order by payment_intent_id
            $order = $orderModel->get_order(['stripe_payment_intent_id' => $paymentIntentId]);

            // Backup: Try to find by order_id from metadata
            if (empty($order) && isset($metadata['order_id'])) {
                $order = $orderModel->get_order(['order_id' => $metadata['order_id']]);
            }

            if (empty($order)) {
                Log::error('Order not found for failed payment intent', [
                    'method' => __METHOD__,
                    'payment_intent_id' => $paymentIntentId,
                    'metadata' => $metadata,
                ]);

                return false;
            }

            // Update order status to failed
            $updateCondition = ['order_id' => $order->order_id];
            $updateData = ['order_status' => 'failed'];
            $orderModel->update_order_data($updateCondition, $updateData);

            Log::info('Order marked as failed from payment_intent', [
                'method' => __METHOD__,
                'order_id' => $order->order_id,
                'payment_intent_id' => $paymentIntentId,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Error handling payment_intent.payment_failed', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'payment_intent_id' => $paymentIntent->id ?? null,
            ]);

            return false;
        }
    }
}
