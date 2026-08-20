<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\EventModel;
use App\Models\OrderModel;
use App\Models\HostUserModel;
use App\Services\StripeService;
use App\Services\PlatformFeeService;
use Carbon\Carbon;

class SettlementController extends Controller
{
    /**
     * Settle event payout - Process payout to host for all paid orders of an event
     * 
     * This method aggregates all paid orders for an event, creates a Stripe Transfer
     * to the host's connected account, and marks all included orders as settled.
     * Super Admin only.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function settleEventPayout(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = array(
            'event_id' => 'required|integer|min:1', // Event ID is required, must be integer, minimum 1
        );

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
                $superAdmin = $request->user();

                // Safety check to ensure middleware injected user context
                if (empty($superAdmin) || $superAdmin == null) {
                    // Return authentication error if user context missing
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Authentication required',
                        ),
                    );

                    return response()->json($result, 401);
                }

                // Initialize models and services
                $eventModel = new EventModel();
                $orderModel = new OrderModel();
                $hostUserModel = new HostUserModel();
                $stripeService = new StripeService();

                // Get event ID from request data
                $eventId = $data['event_id'];

                // Find event by event_id with hostUser relationship
                $event = EventModel::with('hostUser')->find($eventId);

                // Check if event exists
                if (empty($event)) {
                    // Event not found, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Event not found'
                        )
                    ], 404);
                }

                // Check if event is completed (settlement can only be processed for completed events)
                $eventStatus = $this->calculateEventStatus($event);
                if ($eventStatus !== 'completed') {
                    // Event has not completed yet, return error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E005',
                            'error_message' => 'Settlement can only be processed for completed events. This event has not yet ended.'
                        )
                    ], 400);
                }

                // Get host user from event
                $hostUser = $event->hostUser;

                if (empty($hostUser)) {
                    // Host user not found, return error
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Host user not found for this event'
                        )
                    ], 404);
                }

                // Get host's stripe_account_id
                $stripeAccountId = $hostUser->stripe_account_id;

                // Verify host has Stripe account
                if (empty($stripeAccountId)) {
                    // Host does not have Stripe account, return error
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Host does not have a Stripe account configured. Please ask the host to complete Stripe onboarding first.'
                        )
                    ], 400);
                }

                // Verify host account is ready for payouts
                $isKycCompleted = $stripeService->isKycCompleted($stripeAccountId);

                if (!$isKycCompleted) {
                    // Host account is not ready for payouts, return error
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Host account is not ready for payouts. KYC verification incomplete. Please ask the host to complete Stripe onboarding.'
                        )
                    ], 400);
                }

                // Query all paid orders for this event that are not yet settled
                // Join through order_tickets -> tickets -> events to filter by event_id
                // Eager load relationships needed for settlement calculation
                $orders = OrderModel::with(['orderTickets.ticket.event'])
                    ->whereHas('orderTickets.ticket', function($query) use ($eventId) {
                        $query->where('event_id', $eventId);
                    })
                    ->where('order_status', 'paid')
                    ->whereNull('stripe_transfer_id')
                    ->get();

                // Check if there are orders to settle
                if ($orders->count() == 0) {
                    // No orders available for settlement, return error
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'No pending orders available for settlement. All paid orders for this completed event have already been settled.'
                        )
                    ], 400);
                }

                // Initialize accumulators for settlement calculation
                $totalAmount = 0;
                $totalStripeFees = 0;
                $totalPlatformFees = 0;
                $totalHostPayout = 0;
                $orderDetails = array();
                
                // Loop through each order to calculate fees and payouts
                foreach ($orders as $order) {
                    // Get customer paid amount
                    $customerPaid = (float)$order->total_amount;
                    $totalAmount += $customerPaid;
                    
                    // Get Stripe fee (retrieve from API if missing)
                    $stripeFee = (float)($order->stripe_fee ?? 0);
                    
                    // If Stripe fee is missing, try to retrieve from Stripe API
                    if ($stripeFee == 0 && !empty($order->stripe_payment_intent_id)) {
                        $retrievedFee = $stripeService->getPaymentFee($order->stripe_payment_intent_id);
                        
                        if ($retrievedFee !== null) {
                            // Store retrieved fee in order
                            $stripeFee = $retrievedFee;
                            $order->stripe_fee = $retrievedFee;
                            $order->save();
                        } else {
                            // Fallback: Calculate estimated Stripe fee
                            $stripeFee = ($customerPaid * 0.029) + 0.30;
                            
                            Log::warning('Stripe fee missing and API retrieval failed, using estimated fee', [
                                'method' => __METHOD__,
                                'order_id' => $order->order_id,
                                'payment_intent_id' => $order->stripe_payment_intent_id,
                                'estimated_fee' => $stripeFee,
                            ]);
                        }
                    } elseif ($stripeFee == 0) {
                        // No payment intent ID, calculate estimated fee
                        $stripeFee = ($customerPaid * 0.029) + 0.30;
                        
                        Log::warning('No payment intent ID, using estimated Stripe fee', [
                            'method' => __METHOD__,
                            'order_id' => $order->order_id,
                            'estimated_fee' => $stripeFee,
                        ]);
                    }
                    
                    // Calculate net amount after Stripe fee
                    $netAfterStripe = $customerPaid - $stripeFee;
                    $totalStripeFees += $stripeFee;
                    
                    // Get host_user_id from order's event (via order_tickets -> ticket -> event)
                    $hostUserId = null;
                    $firstOrderTicket = $order->orderTickets->first();
                    if ($firstOrderTicket && $firstOrderTicket->ticket && $firstOrderTicket->ticket->event) {
                        $hostUserId = $firstOrderTicket->ticket->event->host_user_id;
                    }
                    
                    // Get platform fee settings for host
                    $feeSettings = PlatformFeeService::getFeeForHost($hostUserId);
                    
                    // Get total ticket quantity for this order
                    $ticketCount = $order->orderTickets->sum('quantity');
                    
                    // Calculate platform fee on net amount (after Stripe fees)
                    $platformFee = PlatformFeeService::calculateFee($feeSettings, $netAfterStripe, $ticketCount);
                    $totalPlatformFees += $platformFee;
                    
                    // Calculate host payout (net amount minus platform fee)
                    $hostPayout = $netAfterStripe - $platformFee;
                    $totalHostPayout += $hostPayout;
                    
                    // Build order detail with calculated values for response
                    $orderDetails[] = array(
                        'order_id' => $order->order_id,
                        'order_number' => $order->order_number,
                        'order_date' => $order->order_date,
                        'customer_paid' => number_format($customerPaid, 2, '.', ''),
                        'stripe_fee' => number_format($stripeFee, 2, '.', ''),
                        'net_after_stripe' => number_format($netAfterStripe, 2, '.', ''),
                        'platform_fee' => number_format($platformFee, 2, '.', ''),
                        'host_payout' => number_format($hostPayout, 2, '.', ''),
                    );
                }
                
                // Convert host payout to cents for Stripe (round to avoid floating point issues)
                $amountCents = (int)round($totalHostPayout * 100);

                // Get order IDs for metadata
                $orderIds = $orders->pluck('order_id')->toArray();

                // Begin database transaction
                DB::beginTransaction();

                try {
                    // Prepare metadata for Stripe Transfer
                    $metadata = array(
                        'event_id' => (string)$eventId,
                        'host_user_id' => (string)$hostUser->host_user_id,
                        'order_count' => (string)$orders->count(),
                        'order_ids' => implode(',', $orderIds),
                    );

                    // Create Stripe Transfer to host's connected account (host payout amount)
                    $transfer = $stripeService->createTransfer(
                        $stripeAccountId,
                        $amountCents,
                        'usd',
                        $metadata
                    );

                    // Get transfer ID
                    $transferId = $transfer->id;

                    // Update all included orders to settled status
                    OrderModel::whereIn('order_id', $orderIds)
                        ->update([
                            'order_status' => 'settled',
                            'stripe_transfer_id' => $transferId,
                            'settled_at' => now(),
                        ]);

                    // Commit transaction
                    DB::commit();

                    // Build settlement summary response
                    $result = array(
                        'success' => true,
                        'data' => array(
                            'message' => 'Settlement processed successfully',
                            'settlement' => array(
                                'transfer_id' => $transferId,
                                'event_id' => $eventId,
                                'event_title' => $event->event_title,
                                'host_user_id' => $hostUser->host_user_id,
                                'host_name' => trim($hostUser->first_name . ' ' . $hostUser->last_name),
                                'total_amount_collected' => number_format($totalAmount, 2, '.', ''),
                                'total_stripe_fees' => number_format($totalStripeFees, 2, '.', ''),
                                'net_after_stripe' => number_format($totalAmount - $totalStripeFees, 2, '.', ''),
                                'total_platform_fees' => number_format($totalPlatformFees, 2, '.', ''),
                                'host_payout_amount' => number_format($totalHostPayout, 2, '.', ''),
                                'amount_cents' => $amountCents,
                                'currency' => 'usd',
                                'order_count' => $orders->count(),
                                'order_ids' => $orderIds,
                                'settled_at' => now()->format('Y-m-d H:i:s'),
                            ),
                            'orders' => $orderDetails,
                        ),
                    );
                 } catch (\Stripe\Exception\ApiErrorException $e) {
                     // Rollback transaction on Stripe error
                     DB::rollBack();

                     // Get Stripe error details from JSON body
                     $errorBody = $e->getJsonBody();
                     $errorCode = isset($errorBody['error']['code']) ? $errorBody['error']['code'] : null;
                     $errorMessage = $e->getMessage();

                     Log::error('Stripe Transfer creation failed in settlement', [
                         'method' => __METHOD__,
                         'event_id' => $eventId,
                         'host_user_id' => $hostUser->host_user_id,
                         'stripe_account_id' => $stripeAccountId,
                         'amount_cents' => $amountCents,
                         'error' => $errorMessage,
                         'error_code' => $errorCode,
                         'stripe_error' => $errorBody,
                     ]);

                     // Provide user-friendly error message based on error type
                     $userMessage = $errorMessage;
                     if ($errorCode === 'balance_insufficient') {
                         $userMessage = 'Insufficient funds in Stripe account. In test mode, you need to add funds to your account balance before creating transfers. Use test card 4000000000000077 to add funds. See: https://stripe.com/docs/testing#available-balance';
                     }

                     $result = array(
                         'success' => false,
                         'error' => array(
                             'error_code' => 'E002',
                             'error_message' => 'Failed to create Stripe transfer: ' . $userMessage,
                             'stripe_error_code' => $errorCode,
                         )
                     );

                     return response()->json($result, 500);
                } catch (\Exception $e) {
                    // Rollback transaction on any error
                    DB::rollBack();

                    // Log exception details for debugging purposes
                    Log::error('Exception in SettlementController::settleEventPayout', [
                        'method' => __METHOD__,
                        'event_id' => $eventId,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);

                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E002',
                            'error_message' => 'An error occurred while processing settlement'
                        )
                    );

                    return response()->json($result, 500);
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::error('Exception in SettlementController::settleEventPayout', [
                    'method' => __METHOD__,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);

                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing settlement'
                    )
                );

                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );

            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get event settlement summary - Get settlement summary for event(s)
     * 
     * Returns basic settlement summary with event info and settlement totals.
     * If event_id is provided, shows summary for that event only (no pagination).
     * If not provided, shows summary for all events with pagination. Super Admin only.
     * 
     * Request Method: POST
     * 
     * Request Body Parameters:
     * - event_id (optional, integer): Filter by specific event ID
     * - page (optional, integer): Page number for pagination (default: 1)
     * - per_page (optional, integer): Items per page (default: 10, max: 100)
     * - settlement_status (optional, string): Filter by settlement status. Values: 'pending' (has unpaid orders), 'settled' (all paid orders settled), or omit for all events
     * - event_status (optional, array): Filter by event status. Only applies when settlement_status is 'pending'. 
     *   Values: array of strings ['live', 'upcoming', 'completed']. Empty array shows all event statuses.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEventSettlementSummary(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        try {
            // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
            $superAdmin = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($superAdmin) || $superAdmin == null) {
                // Return authentication error if user context missing
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ),
                );

                return response()->json($result, 401);
            }

            // Get all request data from request body
            $data = $request->all();

            // Get optional event_id from request body
            $eventId = isset($data['event_id']) ? (int)$data['event_id'] : null;

            // Get pagination parameters with defaults
            $page = isset($data['page']) && $data['page'] > 0 ? (int)$data['page'] : 1; // Default page 1
            $perPage = isset($data['per_page']) && $data['per_page'] > 0 && $data['per_page'] <= 100 ? (int)$data['per_page'] : 10; // Default 10 per page, max 100

            // Get optional settlement_status filter parameter
            $settlementStatus = isset($data['settlement_status']) && in_array($data['settlement_status'], ['pending', 'settled']) ? $data['settlement_status'] : null;

            // Get optional event_status filter parameter (array, only applies when settlement_status is 'pending')
            $eventStatusFilter = null;
            if ($settlementStatus === 'pending' && isset($data['event_status'])) {
                $validStatuses = ['live', 'upcoming', 'completed'];
                
                // Handle array format
                if (is_array($data['event_status'])) {
                    // Empty array means show all
                    if (empty($data['event_status'])) {
                        $eventStatusFilter = null; // Show all event statuses
                    } else {
                        $eventStatusFilter = array_intersect($data['event_status'], $validStatuses);
                        $eventStatusFilter = !empty($eventStatusFilter) ? array_values($eventStatusFilter) : null;
                    }
                }
                // Handle single value (for backward compatibility)
                elseif (is_string($data['event_status']) && in_array($data['event_status'], $validStatuses)) {
                    $eventStatusFilter = [$data['event_status']];
                }
            }

            // Initialize models
            $eventModel = new EventModel();
            $orderModel = new OrderModel();

            if (!empty($eventId)) {
                // Single event summary
                // Find event by event_id with hostUser relationship
                // Filter only published events (is_draft = false AND is_published = true)
                $event = EventModel::with('hostUser')
                    ->where('event_id', $eventId)
                    ->where('is_draft', false)
                    ->where('is_published', true)
                    ->first();

                // Check if event exists and is published
                if (empty($event)) {
                    // Event not found or not published, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or event is not published'
                        )
                    ], 404);
                }

                // Apply settlement status filter if provided
                if (!empty($settlementStatus)) {
                    $eventSettlementStatus = $this->calculateSettlementStatus($eventId);
                    if ($eventSettlementStatus !== $settlementStatus) {
                        // Event doesn't match the settlement status filter, return 404
                        return response()->json([
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E404',
                                'error_message' => 'Event not found with the specified settlement status'
                            )
                        ], 404);
                    }
                }

                // Get all orders for this event with status 'paid' or 'settled' (join through order_tickets -> tickets -> events)
                $allOrders = OrderModel::with(['orderTickets.ticket.event'])
                    ->whereHas('orderTickets.ticket', function($query) use ($eventId) {
                        $query->where('event_id', $eventId);
                    })
                    ->whereIn('order_status', ['paid', 'settled'])
                    ->get();

                // Initialize accumulators for breakdown calculation
                $totalCollected = 0;
                $totalPlatformFees = 0;
                $totalSettlementAmount = 0;
                $totalOrders = $allOrders->count();

                // Get host_user_id from event
                $hostUserId = $event->host_user_id;

                // Get platform fee settings for host (once, outside the loop for efficiency)
                $feeSettings = PlatformFeeService::getFeeForHost($hostUserId);

                // Loop through each order to calculate fees and payouts
                foreach ($allOrders as $order) {
                    // Get customer paid amount
                    $customerPaid = (float)$order->total_amount;
                    $totalCollected += $customerPaid;

                    // Get Stripe fee from database (no API calls in summary endpoint for performance)
                    $stripeFee = (float)($order->stripe_fee ?? 0);

                    // If Stripe fee is missing, use estimated fee (no API call to avoid blocking I/O)
                    if ($stripeFee == 0) {
                        $stripeFee = ($customerPaid * 0.029) + 0.30;
                    }

                    // Calculate net amount after Stripe fee
                    $netAfterStripe = $customerPaid - $stripeFee;

                    // Get total ticket quantity for this order
                    $ticketCount = $order->orderTickets->sum('quantity');

                    // Calculate platform fee on net amount (after Stripe fees)
                    $platformFee = PlatformFeeService::calculateFee($feeSettings, $netAfterStripe, $ticketCount);
                    $totalPlatformFees += $platformFee;

                    // Calculate host payout (net amount minus platform fee) - this is the settlement amount
                    $hostPayout = $netAfterStripe - $platformFee;
                    $totalSettlementAmount += $hostPayout;
                }

                // Calculate settled_at and settled_orders_count in single pass (optimized)
                $settledAt = null;
                $settledOrdersCount = 0;
                foreach ($allOrders as $order) {
                    if ($order->stripe_transfer_id !== null) {
                        $settledOrdersCount++;
                        // Track most recent settled_at
                        if ($order->settled_at !== null && ($settledAt === null || $order->settled_at > $settledAt)) {
                            $settledAt = $order->settled_at;
                        }
                    }
                }

                // Calculate settlement status from already-loaded orders (optimized - no additional query)
                $settlementStatus = $this->calculateSettlementStatusFromOrders($allOrders);

                // Build summary array
                $summary = array(
                    'total_collected' => number_format($totalCollected, 2, '.', ''),
                    'settlement_amount' => number_format($totalSettlementAmount, 2, '.', ''),
                    'total_orders' => $totalOrders,
                    'settled_orders' => $settledOrdersCount,
                    'settlement_status' => $settlementStatus,
                    'platform_fee_collected' => number_format($totalPlatformFees, 2, '.', ''),
                );

                // Add settled_at if event has been settled
                if ($settledAt !== null) {
                    $summary['settled_at'] = $settledAt->format('Y-m-d H:i:s');
                }

                // Calculate event status
                $eventStatus = $this->calculateEventStatus($event);

                // Determine if settlement can be processed (only for completed events)
                $canSettle = ($eventStatus === 'completed');

                // Build response for single event
                $result = array(
                    'success' => true,
                    'data' => array(
                        'event_id' => $eventId,
                        'event_title' => $event->event_title,
                        'event_end_date' => $event->end_date ? $event->end_date->format('Y-m-d') : null,
                        'event_status' => $eventStatus,
                        'can_settle' => $canSettle,
                        'host_user_id' => $event->host_user_id,
                        'host_name' => trim($event->hostUser->first_name . ' ' . $event->hostUser->last_name),
                        'summary' => $summary,
                    ),
                );
            } else {
                // All events summary with pagination
                // Build query for events with hostUser relationship
                // Filter only published events (is_draft = false AND is_published = true)
                $eventsQuery = EventModel::with('hostUser')
                    ->where('is_draft', false)
                    ->where('is_published', true);

                // Apply settlement status filter if provided
                if (!empty($settlementStatus)) {
                    if ($settlementStatus === 'settled') {
                        // Only events where all paid/settled orders are settled
                        // Event must have paid/settled orders with stripe_transfer_id AND no paid/settled orders without stripe_transfer_id
                        $eventsQuery->whereHas('tickets.orderTickets.order', function($query) {
                            $query->whereIn('order_status', ['paid', 'settled'])
                                  ->whereNotNull('stripe_transfer_id');
                        })->whereDoesntHave('tickets.orderTickets.order', function($query) {
                            $query->whereIn('order_status', ['paid', 'settled'])
                                  ->whereNull('stripe_transfer_id');
                        });
                    } elseif ($settlementStatus === 'pending') {
                        // Only events with at least one unpaid order (paid/settled order without stripe_transfer_id)
                        $eventsQuery->whereHas('tickets.orderTickets.order', function($query) {
                            $query->whereIn('order_status', ['paid', 'settled'])
                                  ->whereNull('stripe_transfer_id');
                        });
                    }
                }

                // If event_status filter is provided (only for pending settlements), filter before pagination
                if (!empty($eventStatusFilter) && is_array($eventStatusFilter)) {
                    // Get all events matching settlement status filter
                    $allFilteredEvents = $eventsQuery->orderBy('created_at', 'desc')->get();
                    
                    // Filter by event_status (supports multiple statuses)
                    $filteredEvents = $allFilteredEvents->filter(function($event) use ($eventStatusFilter) {
                        $calculatedEventStatus = $this->calculateEventStatus($event);
                        return in_array($calculatedEventStatus, $eventStatusFilter);
                    });
                    
                    // Get total count after event_status filtering
                    $totalRecords = $filteredEvents->count();
                    
                    // Apply pagination on filtered events
                    $events = $filteredEvents->skip(($page - 1) * $perPage)
                        ->take($perPage)
                        ->values();
                } else {
                    // No event_status filter, use normal pagination
                    $totalRecords = $eventsQuery->count();
                    $events = $eventsQuery->skip(($page - 1) * $perPage)
                        ->take($perPage)
                        ->orderBy('created_at', 'desc')
                        ->get();
                }

                // Batch load all orders for all events at once (optimize N+1 query problem)
                $eventIds = $events->pluck('event_id')->toArray();
                $allEventOrders = collect();
                if (!empty($eventIds)) {
                    $allEventOrders = OrderModel::with(['orderTickets.ticket'])
                        ->whereHas('orderTickets.ticket', function($query) use ($eventIds) {
                            $query->whereIn('event_id', $eventIds);
                        })
                        ->whereIn('order_status', ['paid', 'settled'])
                        ->get()
                        ->groupBy(function($order) {
                            $firstTicket = $order->orderTickets->first();
                            return $firstTicket && $firstTicket->ticket ? $firstTicket->ticket->event_id : null;
                        });
                }

                // Build events array with settlement data
                $eventsArray = array();

                foreach ($events as $event) {
                    // Get orders for this event from pre-loaded batch
                    $eventOrders = $allEventOrders->get($event->event_id, collect());

                    // Initialize accumulators for breakdown calculation
                    $eventTotalCollected = 0;
                    $eventTotalPlatformFees = 0;
                    $eventTotalSettlementAmount = 0;
                    $eventTotalOrders = $eventOrders->count();

                    // Get host_user_id from event
                    $hostUserId = $event->host_user_id;

                    // Get platform fee settings for host (once, outside the loop for efficiency)
                    $feeSettings = PlatformFeeService::getFeeForHost($hostUserId);

                    // Loop through each order to calculate fees and payouts
                    foreach ($eventOrders as $order) {
                        // Get customer paid amount
                        $customerPaid = (float)$order->total_amount;
                        $eventTotalCollected += $customerPaid;

                        // Get Stripe fee from database (no API calls in summary endpoint for performance)
                        $stripeFee = (float)($order->stripe_fee ?? 0);

                        // If Stripe fee is missing, use estimated fee (no API call to avoid blocking I/O)
                        if ($stripeFee == 0) {
                            $stripeFee = ($customerPaid * 0.029) + 0.30;
                        }

                        // Calculate net amount after Stripe fee
                        $netAfterStripe = $customerPaid - $stripeFee;

                        // Get total ticket quantity for this order
                        $ticketCount = $order->orderTickets->sum('quantity');

                        // Calculate platform fee on net amount (after Stripe fees)
                        $platformFee = PlatformFeeService::calculateFee($feeSettings, $netAfterStripe, $ticketCount);
                        $eventTotalPlatformFees += $platformFee;

                        // Calculate host payout (net amount minus platform fee) - this is the settlement amount
                        $hostPayout = $netAfterStripe - $platformFee;
                        $eventTotalSettlementAmount += $hostPayout;
                    }

                    // Calculate settled_at and settled_orders_count in single pass (optimized)
                    $settledAt = null;
                    $settledOrdersCount = 0;
                    foreach ($eventOrders as $order) {
                        if ($order->stripe_transfer_id !== null) {
                            $settledOrdersCount++;
                            // Track most recent settled_at
                            if ($order->settled_at !== null && ($settledAt === null || $order->settled_at > $settledAt)) {
                                $settledAt = $order->settled_at;
                            }
                        }
                    }

                    // Calculate settlement status from already-loaded orders (optimized - no additional query)
                    $eventSettlementStatus = $this->calculateSettlementStatusFromOrders($eventOrders);

                    // Build summary array
                    $eventSummary = array(
                        'total_collected' => number_format($eventTotalCollected, 2, '.', ''),
                        'settlement_amount' => number_format($eventTotalSettlementAmount, 2, '.', ''),
                        'total_orders' => $eventTotalOrders,
                        'settled_orders' => $settledOrdersCount,
                        'settlement_status' => $eventSettlementStatus,
                        'platform_fee_collected' => number_format($eventTotalPlatformFees, 2, '.', ''),
                    );

                    // Add settled_at if event has been settled
                    if ($settledAt !== null) {
                        $eventSummary['settled_at'] = $settledAt->format('Y-m-d H:i:s');
                    }

                    // Calculate event status
                    $eventStatus = $this->calculateEventStatus($event);

                    // Determine if settlement can be processed (only for completed events)
                    $canSettle = ($eventStatus === 'completed');

                    $eventsArray[] = array(
                        'event_id' => $event->event_id,
                        'event_title' => $event->event_title,
                        'event_end_date' => $event->end_date ? $event->end_date->format('Y-m-d') : null,
                        'event_status' => $eventStatus,
                        'can_settle' => $canSettle,
                        'host_user_id' => $event->host_user_id,
                        'host_name' => trim($event->hostUser->first_name . ' ' . $event->hostUser->last_name),
                        'summary' => $eventSummary,
                    );
                }

                // Calculate total pages
                $totalPages = ceil($totalRecords / $perPage);

                // Build response for all events with pagination metadata
                $result = array(
                    'success' => true,
                    'data' => array(
                        'events' => $eventsArray,
                        'pagination' => array(
                            'total_records' => $totalRecords,
                            'current_page' => $page,
                            'per_page' => $perPage,
                            'total_pages' => $totalPages,
                            'has_next_page' => $page < $totalPages,
                            'has_previous_page' => $page > 1,
                        ),
                    ),
                );
            }
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in SettlementController::getEventSettlementSummary', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving settlement summary'
                )
            );

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get event settlement details - Get detailed settlement information including orders and transfers
     * 
     * Returns detailed settlement information with orders and transfers for a specific event.
     * Super Admin only.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEventSettlementDetails(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        try {
            // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
            $superAdmin = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($superAdmin) || $superAdmin == null) {
                // Return authentication error if user context missing
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ),
                );

                return response()->json($result, 401);
            }

            // Get all request data from the incoming request (query parameters)
            $data = $request->all();

            // Get required event_id from query parameters
            $eventId = isset($data['event_id']) ? (int)$data['event_id'] : null;

            // Validate event_id is provided
            if (empty($eventId)) {
                return response()->json([
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E001',
                        'error_message' => 'event_id is required'
                    )
                ], 400);
            }

            // Find event by event_id with hostUser relationship
            $event = EventModel::with('hostUser')->find($eventId);

            // Check if event exists
            if (empty($event)) {
                // Event not found, return 404 error response
                return response()->json([
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E404',
                        'error_message' => 'Event not found'
                    )
                ], 404);
            }

            // Get all orders for this event (join through order_tickets -> tickets -> events)
            $allOrders = OrderModel::whereHas('orderTickets.ticket', function($query) use ($eventId) {
                    $query->where('event_id', $eventId);
                })
                ->get();

            // Calculate totals
            $totalCollected = $allOrders->whereIn('order_status', ['paid', 'settled'])->sum('total_amount');
            $totalSettled = $allOrders->where('order_status', 'settled')->sum('total_amount');
            $pendingSettlement = $allOrders->where('order_status', 'paid')->whereNull('stripe_transfer_id')->sum('total_amount');
            $settledOrderCount = $allOrders->where('order_status', 'settled')->count();
            $pendingOrderCount = $allOrders->where('order_status', 'paid')->whereNull('stripe_transfer_id')->count();

            // Get unique transfer IDs for this event
            $transferIds = $allOrders->where('order_status', 'settled')
                ->whereNotNull('stripe_transfer_id')
                ->pluck('stripe_transfer_id')
                ->unique()
                ->values()
                ->toArray();

            // Build transfers array
            $transfers = array();
            foreach ($transferIds as $transferId) {
                $transferOrders = $allOrders->where('stripe_transfer_id', $transferId);
                $transferAmount = $transferOrders->sum('total_amount');
                $transferOrderCount = $transferOrders->count();
                $settledAt = $transferOrders->first()->settled_at;

                $transfers[] = array(
                    'transfer_id' => $transferId,
                    'amount' => number_format((float)$transferAmount, 2, '.', ''),
                    'amount_cents' => (int)round($transferAmount * 100),
                    'currency' => 'usd',
                    'order_count' => $transferOrderCount,
                    'settled_at' => $settledAt ? $settledAt->format('Y-m-d H:i:s') : null,
                );
            }

            // Build orders array with settlement details
            $ordersArray = array();
            foreach ($allOrders as $order) {
                $ordersArray[] = array(
                    'order_id' => $order->order_id,
                    'order_number' => $order->order_number,
                    'order_date' => $order->order_date,
                    'total_amount' => number_format((float)$order->total_amount, 2, '.', ''),
                    'order_status' => $order->order_status,
                    'stripe_transfer_id' => $order->stripe_transfer_id,
                    'settled_at' => $order->settled_at ? $order->settled_at->format('Y-m-d H:i:s') : null,
                );
            }

            // Calculate event status
            $eventStatus = $this->calculateEventStatus($event);

            // Determine if settlement can be processed (only for completed events)
            $canSettle = ($eventStatus === 'completed');

            // Build response
            $result = array(
                'success' => true,
                'data' => array(
                    'event_id' => $eventId,
                    'event_title' => $event->event_title,
                    'event_status' => $eventStatus,
                    'can_settle' => $canSettle,
                    'host_user_id' => $event->host_user_id,
                    'host_name' => trim($event->hostUser->first_name . ' ' . $event->hostUser->last_name),
                    'summary' => array(
                        'total_collected' => number_format((float)$totalCollected, 2, '.', ''),
                        'total_settled' => number_format((float)$totalSettled, 2, '.', ''),
                        'pending_settlement' => number_format((float)$pendingSettlement, 2, '.', ''),
                        'settled_order_count' => $settledOrderCount,
                        'pending_order_count' => $pendingOrderCount,
                    ),
                    'orders' => $ordersArray,
                    'transfers' => $transfers,
                ),
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in SettlementController::getEventSettlementDetails', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving settlement details'
                )
            );

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get event settlement breakdown - Get complete financial breakdown for an event
     * 
     * Returns aggregated totals of all charges and fees across all orders for a specific event.
     * Includes customer paid amounts, Stripe fees, platform fees, and host payouts.
     * Super Admin only.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEventSettlementBreakdown(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        try {
            // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
            $superAdmin = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($superAdmin) || $superAdmin == null) {
                // Return authentication error if user context missing
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ),
                );

                return response()->json($result, 401);
            }

            // Get all request data from the incoming request (query parameters)
            $data = $request->all();

            // Get required event_id from query parameters
            $eventId = isset($data['event_id']) ? (int)$data['event_id'] : null;

            // Validate event_id is provided
            if (empty($eventId)) {
                return response()->json([
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E001',
                        'error_message' => 'event_id is required'
                    )
                ], 400);
            }

            // Find event by event_id with hostUser relationship
            // Filter only published events (is_draft = false AND is_published = true)
            $event = EventModel::with('hostUser')
                ->where('event_id', $eventId)
                ->where('is_draft', false)
                ->where('is_published', true)
                ->first();

            // Check if event exists and is published
            if (empty($event)) {
                // Event not found or not published, return 404 error response
                return response()->json([
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E404',
                        'error_message' => 'Event not found or event is not published'
                    )
                ], 404);
            }

            // Get all orders for this event (all statuses: settled, paid, pending_payment, failed)
            // Join through order_tickets -> tickets -> events
            $allOrders = OrderModel::with(['orderTickets.ticket.event'])
                ->whereHas('orderTickets.ticket', function($query) use ($eventId) {
                    $query->where('event_id', $eventId);
                })
                ->get();

            // Initialize accumulators for breakdown calculation
            $totalCustomerPaid = 0;
            $totalStripeFees = 0;
            $totalPlatformFees = 0;
            $totalHostPayout = 0;
            $orderCount = $allOrders->count();

            // Initialize StripeService for fee retrieval
            $stripeService = new StripeService();

            // Get host_user_id from event
            $hostUserId = $event->host_user_id;

            // Get platform fee settings for host (once, outside the loop for efficiency)
            $feeSettings = PlatformFeeService::getFeeForHost($hostUserId);

            // Loop through each order to calculate fees and payouts
            foreach ($allOrders as $order) {
                // Get customer paid amount
                $customerPaid = (float)$order->total_amount;
                $totalCustomerPaid += $customerPaid;

                // Get Stripe fee (retrieve from API if missing)
                $stripeFee = (float)($order->stripe_fee ?? 0);

                // If Stripe fee is missing, try to retrieve from Stripe API
                if ($stripeFee == 0 && !empty($order->stripe_payment_intent_id)) {
                    $retrievedFee = $stripeService->getPaymentFee($order->stripe_payment_intent_id);

                    if ($retrievedFee !== null) {
                        // Store retrieved fee in order
                        $stripeFee = $retrievedFee;
                        $order->stripe_fee = $retrievedFee;
                        $order->save();
                    } else {
                        // Fallback: Calculate estimated Stripe fee
                        $stripeFee = ($customerPaid * 0.029) + 0.30;

                        Log::warning('Stripe fee missing and API retrieval failed, using estimated fee', [
                            'method' => __METHOD__,
                            'order_id' => $order->order_id,
                            'payment_intent_id' => $order->stripe_payment_intent_id,
                            'estimated_fee' => $stripeFee,
                        ]);
                    }
                } elseif ($stripeFee == 0) {
                    // No payment intent ID, calculate estimated fee
                    $stripeFee = ($customerPaid * 0.029) + 0.30;

                    Log::warning('No payment intent ID, using estimated Stripe fee', [
                        'method' => __METHOD__,
                        'order_id' => $order->order_id,
                        'estimated_fee' => $stripeFee,
                    ]);
                }

                // Calculate net amount after Stripe fee
                $netAfterStripe = $customerPaid - $stripeFee;
                $totalStripeFees += $stripeFee;

                // Get total ticket quantity for this order
                $ticketCount = $order->orderTickets->sum('quantity');

                // Calculate platform fee on net amount (after Stripe fees)
                $platformFee = PlatformFeeService::calculateFee($feeSettings, $netAfterStripe, $ticketCount);
                $totalPlatformFees += $platformFee;

                // Calculate host payout (net amount minus platform fee)
                $hostPayout = $netAfterStripe - $platformFee;
                $totalHostPayout += $hostPayout;
            }

            // Calculate net after Stripe (aggregated)
            $netAfterStripe = $totalCustomerPaid - $totalStripeFees;

            // Build breakdown response
            $breakdown = array(
                'total_customer_paid' => number_format($totalCustomerPaid, 2, '.', ''),
                'total_stripe_fees' => number_format($totalStripeFees, 2, '.', ''),
                'net_after_stripe' => number_format($netAfterStripe, 2, '.', ''),
                'total_platform_fees' => number_format($totalPlatformFees, 2, '.', ''),
                'total_host_payout' => number_format($totalHostPayout, 2, '.', ''),
                'order_count' => $orderCount,
            );

            // Build response
            $result = array(
                'success' => true,
                'data' => array(
                    'event_id' => $eventId,
                    'event_title' => $event->event_title,
                    'host_user_id' => $event->host_user_id,
                    'host_name' => trim($event->hostUser->first_name . ' ' . $event->hostUser->last_name),
                    'breakdown' => $breakdown,
                ),
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in SettlementController::getEventSettlementBreakdown', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving settlement breakdown'
                )
            );

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get host payouts - Returns list of events with settlement breakdown for each event
     * 
     * Returns a paginated list of published events for the authenticated host,
     * each with settlement breakdown and settlement status.
     * Host User only.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getHostPayouts(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        try {
            // Get authenticated Host User from request (set by AuthenticateHostUser middleware)
            $authenticatedHost = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($authenticatedHost) || $authenticatedHost == null) {
                // Return authentication error if user context missing
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ),
                );

                return response()->json($result, 401);
            }

            // Get authenticated host's host_user_id
            $hostUserId = $authenticatedHost->host_user_id;

            // Get all request data from the incoming request (query parameters)
            $data = $request->all();

            // Get pagination parameters with defaults
            $page = isset($data['page']) && $data['page'] > 0 ? (int)$data['page'] : 1; // Default page 1
            $perPage = isset($data['per_page']) && $data['per_page'] > 0 && $data['per_page'] <= 100 ? (int)$data['per_page'] : 10; // Default 10 per page, max 100

            // Query published events for the host
            $eventsQuery = EventModel::where('host_user_id', $hostUserId)
                ->where('is_draft', false)
                ->where('is_published', true);

            // Get total count before pagination
            $totalRecords = $eventsQuery->count();

            // Apply pagination
            $events = $eventsQuery->skip(($page - 1) * $perPage)
                ->take($perPage)
                ->orderBy('created_at', 'desc')
                ->get();

            // Batch load all orders for all events at once (optimize N+1 query problem)
            $eventIds = $events->pluck('event_id')->toArray();
            $allEventOrders = collect();
            if (!empty($eventIds)) {
                $allEventOrders = OrderModel::with(['orderTickets.ticket'])
                    ->whereHas('orderTickets.ticket', function($query) use ($eventIds) {
                        $query->whereIn('event_id', $eventIds);
                    })
                    ->get()
                    ->groupBy(function($order) {
                        $firstTicket = $order->orderTickets->first();
                        return $firstTicket && $firstTicket->ticket ? $firstTicket->ticket->event_id : null;
                    });
            }

            // Initialize StripeService for fee retrieval
            $stripeService = new StripeService();

            // Get platform fee settings for host (once, outside the loop for efficiency)
            $feeSettings = PlatformFeeService::getFeeForHost($hostUserId);

            // Build events array with settlement data
            $eventsArray = array();

            foreach ($events as $event) {
                // Get orders for this event from pre-loaded batch
                $eventOrders = $allEventOrders->get($event->event_id, collect());

                // Initialize accumulators for breakdown calculation
                $totalCustomerPaid = 0;
                $totalStripeFees = 0;
                $totalPlatformFees = 0;
                $totalHostPayout = 0;
                $orderCount = $eventOrders->count();

                // Loop through each order to calculate fees and payouts
                foreach ($eventOrders as $order) {
                    // Get customer paid amount
                    $customerPaid = (float)$order->total_amount;
                    $totalCustomerPaid += $customerPaid;

                    // Get Stripe fee (retrieve from API if missing)
                    $stripeFee = (float)($order->stripe_fee ?? 0);

                    // If Stripe fee is missing, try to retrieve from Stripe API
                    if ($stripeFee == 0 && !empty($order->stripe_payment_intent_id)) {
                        $retrievedFee = $stripeService->getPaymentFee($order->stripe_payment_intent_id);

                        if ($retrievedFee !== null) {
                            // Store retrieved fee in order
                            $stripeFee = $retrievedFee;
                            $order->stripe_fee = $retrievedFee;
                            $order->save();
                        } else {
                            // Fallback: Calculate estimated Stripe fee
                            $stripeFee = ($customerPaid * 0.029) + 0.30;
                        }
                    } elseif ($stripeFee == 0) {
                        // No payment intent ID, calculate estimated fee
                        $stripeFee = ($customerPaid * 0.029) + 0.30;
                    }

                    // Calculate net amount after Stripe fee
                    $netAfterStripe = $customerPaid - $stripeFee;
                    $totalStripeFees += $stripeFee;

                    // Get total ticket quantity for this order
                    $ticketCount = $order->orderTickets->sum('quantity');

                    // Calculate platform fee on net amount (after Stripe fees)
                    $platformFee = PlatformFeeService::calculateFee($feeSettings, $netAfterStripe, $ticketCount);
                    $totalPlatformFees += $platformFee;

                    // Calculate host payout (net amount minus platform fee)
                    $hostPayout = $netAfterStripe - $platformFee;
                    $totalHostPayout += $hostPayout;
                }

                // Calculate net after Stripe (aggregated)
                $netAfterStripe = $totalCustomerPaid - $totalStripeFees;

                // Calculate settlement status from already-loaded orders (optimized - no additional query)
                $settlementStatus = $this->calculateSettlementStatusFromOrders($eventOrders);

                // Build breakdown response
                $breakdown = array(
                    'total_customer_paid' => number_format($totalCustomerPaid, 2, '.', ''),
                    'total_stripe_fees' => number_format($totalStripeFees, 2, '.', ''),
                    'net_after_stripe' => number_format($netAfterStripe, 2, '.', ''),
                    'total_platform_fees' => number_format($totalPlatformFees, 2, '.', ''),
                    'total_host_payout' => number_format($totalHostPayout, 2, '.', ''),
                    'order_count' => $orderCount,
                );

                // Get event date (use start_date)
                $eventDate = $event->start_date ? $event->start_date->format('Y-m-d') : null;

                // Build event data
                $eventsArray[] = array(
                    'event_id' => $event->event_id,
                    'event_title' => $event->event_title,
                    'event_date' => $eventDate,
                    'settlement_status' => $settlementStatus,
                    'breakdown' => $breakdown,
                );
            }

            // Calculate total pages
            $totalPages = ceil($totalRecords / $perPage);

            // Build response
            $result = array(
                'success' => true,
                'data' => array(
                    'events' => $eventsArray,
                    'pagination' => array(
                        'total_records' => $totalRecords,
                        'current_page' => $page,
                        'per_page' => $perPage,
                        'total_pages' => $totalPages,
                        'has_next_page' => $page < $totalPages,
                        'has_previous_page' => $page > 1,
                    ),
                ),
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in SettlementController::getHostPayouts', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving host payouts'
                )
            );

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Calculate settlement status for an event
     * 
     * Returns: 'settled' if all paid orders are settled, 'pending' otherwise
     * 
     * @param int $eventId
     * @return string
     */
    private function calculateSettlementStatus($eventId)
    {
        // Get all paid/settled orders for this event (orders that have been paid)
        $paidOrders = OrderModel::whereHas('orderTickets.ticket', function($query) use ($eventId) {
            $query->where('event_id', $eventId);
        })->whereIn('order_status', ['paid', 'settled'])->get();

        return $this->calculateSettlementStatusFromOrders($paidOrders);
    }

    /**
     * Calculate settlement status from order collection (optimized - no database query)
     * 
     * Returns: 'settled' if all paid orders are settled, 'pending' otherwise
     * 
     * @param \Illuminate\Support\Collection $orders
     * @return string
     */
    private function calculateSettlementStatusFromOrders($orders)
    {
        // Filter to paid/settled orders
        $paidOrders = $orders->whereIn('order_status', ['paid', 'settled']);

        // If no paid orders, consider as pending (can be settled when orders come in)
        if ($paidOrders->count() == 0) {
            return 'pending';
        }

        // Check if all paid orders are settled (have stripe_transfer_id)
        $settledOrdersCount = $paidOrders->whereNotNull('stripe_transfer_id')->count();
        $allSettled = ($settledOrdersCount === $paidOrders->count());

        return $allSettled ? 'settled' : 'pending';
    }

    /**
     * Calculate event status based on dates and publication status
     * 
     * Returns: 'draft', 'live', 'upcoming', or 'completed'
     * 
     * @param EventModel $event
     * @return string
     */
    private function calculateEventStatus($event)
    {
        // Default status is draft
        $eventStatus = 'draft';
        
        // Only calculate date-based status if event is published
        if ($event->is_draft == false && $event->is_published == true) {
            // Get current date and time using Carbon
            $currentDateTime = Carbon::now();
            
            // Parse start date and time using Carbon
            $startDate = Carbon::parse($event->start_date)->format('Y-m-d');
            $startTime = !empty($event->start_time) ? Carbon::parse($event->start_time)->format('H:i:s') : '00:00:00';
            $startDateTime = Carbon::parse($startDate . ' ' . $startTime);
            
            // Parse end date and time using Carbon
            $endDate = Carbon::parse($event->end_date)->format('Y-m-d');
            $endTime = !empty($event->end_time) ? Carbon::parse($event->end_time)->format('H:i:s') : '23:59:59';
            $endDateTime = Carbon::parse($endDate . ' ' . $endTime);
            
            // Calculate status with proper Carbon date/time comparisons
            if ($currentDateTime >= $startDateTime && $currentDateTime <= $endDateTime) {
                $eventStatus = 'live'; // Event is currently live/ongoing
            } elseif ($currentDateTime < $startDateTime) {
                $eventStatus = 'upcoming'; // Event is upcoming
            } elseif ($currentDateTime > $endDateTime) {
                $eventStatus = 'completed'; // Event is completed
            }
        }
        
        return $eventStatus;
    }
}

