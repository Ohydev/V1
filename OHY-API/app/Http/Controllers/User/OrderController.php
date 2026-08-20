<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\OrderModel;
use App\Models\OrderTicketModel;
use App\Models\CartModel;
use App\Models\TicketModel;
use App\Models\CouponModel;
use App\Services\StripeService;
use Carbon\Carbon;

class OrderController extends Controller
{
    /**
     * Create order - allows End Users to complete ticket purchase and create order
     * 
     * This method processes cart items for a specific event, validates coupon, creates order and order_tickets
     * records, updates ticket sold_quantity atomically, and clears cart items for that event after successful
     * order creation. Users can only proceed with one event at a time. Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function createOrder(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        // Note: Card fields (card_number, expiry_date, cvv) removed - payment now handled by Stripe Checkout
        $rules = array(
            'event_id' => 'required|integer|min:1', // Event ID is required, must be integer, minimum 1
            'full_name' => 'required|string|max:255', // Full name is required, must be string, maximum 255 characters
            'email' => 'required|email|max:255', // Email is required, must be valid email format, maximum 255 characters
            'phone_number' => 'required|string|max:255', // Phone number is required, must be string, maximum 255 characters
            'street_address' => 'required|string|max:255', // Street address is required, must be string, maximum 255 characters
            'city' => 'required|string|max:255', // City is required, must be string, maximum 255 characters
            'state' => 'required|string|max:255', // State is required, must be string, maximum 255 characters
            'zip_code' => 'required|string|max:255', // ZIP code is required, must be string, maximum 255 characters
            'country_id' => 'required|integer|min:1', // Country ID is required, must be integer, minimum 1
            'coupon_code' => 'nullable|string|max:255', // Coupon code is optional, must be string if provided, maximum 255 characters
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize models to perform database operations
                $orderModel = new OrderModel();
                $orderTicketModel = new OrderTicketModel();
                $cartModel = new CartModel();
                $ticketModel = new TicketModel();
                $couponModel = new CouponModel();
                
                // Get event ID from request data
                $eventId = $data['event_id'];
                
                // Prepare query condition to get cart items for authenticated user and specific event
                $cartQueryCondition = array('user_id' => $user->user_id);
                
                // Get cart items for user that belong to tickets of the specified event
                // Eager load ticket, ticketCategory, and event relationships
                $cartItems = CartModel::with(['ticket.ticketCategory', 'ticket.event'])
                    ->where($cartQueryCondition)
                    ->whereHas('ticket', function($query) use ($eventId) {
                        // Filter cart items where ticket belongs to the specified event
                        $query->where('event_id', $eventId);
                    })
                    ->get();
                
                // Check if cart is empty for this event
                if ($cartItems->count() == 0) {
                    // No cart items found for this event, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'No cart items found for this event. Please add items to cart before checkout'
                        )
                    ], 404);
                }
                
                // Initialize array to store validated cart items with ticket information
                $validatedCartItems = array();
                
                // Initialize subtotal accumulator
                $subtotal = 0;
                
                // Loop through each cart item to validate ticket availability and max_per_user limits
                foreach ($cartItems as $cartItem) {
                    // Get ticket from cart item
                    $ticket = $cartItem->ticket;
                    
                    // Check if ticket exists
                    if (!$ticket) {
                        // Ticket not found, return 404 error response
                        return response()->json([
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E404',
                                'error_message' => 'Ticket not found for cart item'
                            )
                        ], 404);
                    }
                    
                    // Check if ticket's event is published (is_published = true, is_draft = false)
                    if (!$ticket->event || !$ticket->event->is_published || $ticket->event->is_draft) {
                        // Ticket belongs to an unpublished event, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Ticket belongs to an unpublished event'
                            )
                        );
                        
                        // Return JSON encoded error response
                        return json_encode($result);
                    }
                    
                    // Calculate available tickets: total_available - sold_quantity
                    $availableTickets = $ticket->total_available - $ticket->sold_quantity;
                    
                    // Check if cart quantity exceeds available tickets
                    if ($cartItem->quantity > $availableTickets) {
                        // Insufficient tickets available, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Insufficient tickets available for ticket ID ' . $ticket->ticket_id . '. Only ' . $availableTickets . ' tickets remaining'
                            )
                        );
                        
                        // Return JSON encoded error response
                        return json_encode($result);
                    }
                    
                    // Check max per user limit
                    // Get user's existing purchases for this ticket from orders
                    $userOrders = OrderModel::where('user_id', $user->user_id)->pluck('order_id');
                    
                    // Get total quantity purchased by user for this ticket from order_tickets
                    $purchasedQuantity = 0;
                    if ($userOrders->count() > 0) {
                        $purchasedQuantity = OrderTicketModel::where('ticket_id', $ticket->ticket_id)
                            ->whereIn('order_id', $userOrders)
                            ->sum('quantity');
                    }
                    
                    // Calculate total user quantity: existing purchases + cart quantity
                    $totalUserQuantity = $purchasedQuantity + $cartItem->quantity;
                    
                    // Check if total user quantity exceeds max_per_user limit
                    if ($totalUserQuantity > $ticket->max_per_user) {
                        // Maximum tickets per user limit exceeded, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Maximum tickets per user limit exceeded for ticket ID ' . $ticket->ticket_id . '. You can purchase maximum ' . $ticket->max_per_user . ' tickets'
                            )
                        );
                        
                        // Return JSON encoded error response
                        return json_encode($result);
                    }
                    
                    // Calculate total item price: quantity × ticket price
                    $totalItemPrice = $cartItem->quantity * (float)$ticket->price;
                    
                    // Add to subtotal accumulator
                    $subtotal += $totalItemPrice;
                    
                    // Store validated cart item with ticket information for later use
                    $validatedCartItems[] = array(
                        'cart_item' => $cartItem, // Cart item object
                        'ticket' => $ticket, // Ticket object
                        'quantity' => $cartItem->quantity, // Quantity in cart
                        'unit_price' => (float)$ticket->price, // Unit price (price snapshot)
                        'total_price' => $totalItemPrice, // Total price for this line item
                    );
                }
                
                // Initialize coupon data and discount amount
                $coupon = null;
                $couponId = null;
                $couponDiscount = 0;
                
                // Check if coupon_code is provided
                if (isset($data['coupon_code']) && !empty($data['coupon_code'])) {
                    // Coupon code is provided, validate coupon
                    
                    // Prepare query condition to find coupon by coupon_code
                    $couponQueryCondition = array('coupon_code' => $data['coupon_code']);
                    
                    // Get coupon record from database
                    $coupon = $couponModel->get_coupon($couponQueryCondition);
                    
                    // Check if coupon exists
                    if (!$coupon) {
                        // Coupon not found, return 404 error response
                        return response()->json([
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E404',
                                'error_message' => 'Coupon not found'
                            )
                        ], 404);
                    }
                    
                    // Verify coupon belongs to the specified event
                    if ($coupon->event_id != $eventId) {
                        // Coupon does not belong to this event, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Coupon does not belong to this event'
                            )
                        );
                        
                        // Return JSON encoded error response
                        return json_encode($result);
                    }
                    
                    // Get current date for validation (format: Y-m-d)
                    $currentDate = date('Y-m-d');
                    
                    // Validate date range: Check if current date is between start_date and end_date
                    $isDateValid = false;
                    if ($coupon->end_date) {
                        // End date exists: Check if current date is between start_date and end_date
                        $isDateValid = ($currentDate >= $coupon->start_date && $currentDate <= $coupon->end_date);
                    } else {
                        // End date is null: Check if current date is >= start_date
                        $isDateValid = ($currentDate >= $coupon->start_date);
                    }
                    
                    // Check if date validation failed
                    if (!$isDateValid) {
                        // Coupon has expired, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Coupon has expired'
                            )
                        );
                        
                        // Return JSON encoded error response
                        return json_encode($result);
                    }
                    
                    // Validate usage limit: Check if times_used < max_times_applicable
                    $isUsageValid = ($coupon->times_used < $coupon->max_times_applicable);
                    
                    // Check if usage validation failed
                    if (!$isUsageValid) {
                        // Coupon usage limit exceeded, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Coupon usage limit exceeded'
                            )
                        );
                        
                        // Return JSON encoded error response
                        return json_encode($result);
                    }
                    
                    // Calculate discount amount based on discount type
                    $subtotalFloat = (float)$subtotal; // Convert subtotal to float for calculation
                    
                    if ($coupon->discount_type == 'percentage') {
                        // Percentage discount: Calculate discount as percentage of subtotal
                        $couponDiscount = $subtotalFloat * ((float)$coupon->discount_percent / 100);
                        
                        // Apply max cap discount if set
                        if ($coupon->max_cap_discount) {
                            // Cap discount at max_cap_discount if calculated discount exceeds it
                            $couponDiscount = min($couponDiscount, (float)$coupon->max_cap_discount);
                        }
                    } else {
                        // Flat discount: Use flat_discount_amount as discount
                        $couponDiscount = (float)$coupon->flat_discount_amount;
                    }
                    
                    // Set coupon ID for order
                    $couponId = $coupon->coupon_id;
                }
                
                // Calculate final customer amount (after coupon discount)
                // Customer pays this amount - platform fee is NOT added to customer's bill
                $finalCustomerAmount = $subtotal - $couponDiscount;
                
                // Ensure final customer amount doesn't go negative (minimum 0.00)
                if ($finalCustomerAmount < 0) {
                    $finalCustomerAmount = 0.00;
                }
                
                // Customer pays only the final amount (platform fee is NOT added)
                // Platform fee is calculated on-the-fly during settlement based on net amount after Stripe fees
                $total = $finalCustomerAmount;
                
                // Ensure total doesn't go negative (minimum 0.00)
                if ($total < 0) {
                    $total = 0.00;
                }
                
                // Get current date for order_date field
                $orderDate = date('Y-m-d');
                
                // Begin database transaction to ensure data consistency
                DB::beginTransaction();
                
                try {
                    // Generate daily sequential order number (ohy-ddmmyyyy-XXX)
                    $orderNumber = OrderModel::generateDailyOrderNumber(null, true);
                    
                    // Prepare order data array with all required fields
                    $orderData = array(
                        'order_number' => $orderNumber, // Unique order number
                        'user_id' => $user->user_id, // Current authenticated user's ID
                        'order_status' => 'pending_payment', // Order status: pending_payment, paid, settled, or failed
                        'order_date' => $orderDate, // Order date (for filtering/sorting)
                        'full_name' => $data['full_name'], // Purchaser's full name
                        'email' => $data['email'], // Purchaser's email
                        'phone_number' => $data['phone_number'], // Purchaser's phone number
                        'street_address' => $data['street_address'], // Billing street address
                        'city' => $data['city'], // Billing city
                        'state' => $data['state'], // Billing state/province
                        'zip_code' => $data['zip_code'], // Billing ZIP/postal code
                        'country_id' => $data['country_id'], // Foreign key to countries table
                        'subtotal' => round($subtotal, 2), // Sum of all ticket prices rounded to 2 decimal places
                        'coupon_discount' => $couponDiscount ? round($couponDiscount, 2) : null, // Discount amount from coupon rounded to 2 decimal places (if applied)
                        'total_amount' => round($total, 2), // Final amount customer pays (after coupon discount, platform fee NOT added)
                        'coupon_id' => $couponId, // Applied coupon ID (if any)
                    );
                    
                    // Create order record in the database
                    $order = $orderModel->create_order($orderData);
                    
                    // Get order ID for creating order_tickets
                    $orderId = $order->order_id;
                    
                    // Initialize array to store formatted order tickets for response
                    $formattedOrderTickets = array();
                    
                    // Loop through validated cart items to create order_tickets records
                    foreach ($validatedCartItems as $validatedItem) {
                        // Get cart item, ticket, and quantity from validated item
                        $cartItem = $validatedItem['cart_item'];
                        $ticket = $validatedItem['ticket'];
                        $quantity = $validatedItem['quantity'];
                        $unitPrice = $validatedItem['unit_price'];
                        $totalPrice = $validatedItem['total_price'];
                        
                        // Prepare order ticket data array
                        $orderTicketData = array(
                            'order_id' => $orderId, // Associated order ID
                            'ticket_id' => $ticket->ticket_id, // Ticket type purchased
                            'quantity' => $quantity, // Number of tickets of this type purchased
                            'unit_price' => round($unitPrice, 2), // Price per ticket at time of purchase (price snapshot) rounded to 2 decimal places
                            'total_price' => round($totalPrice, 2), // Total price for this line item rounded to 2 decimal places
                        );
                        
                        // Create order ticket record in the database
                        $orderTicket = $orderTicketModel->create_order_ticket($orderTicketData);
                        
                        // Update ticket sold_quantity atomically using increment() to prevent over-selling
                        TicketModel::where('ticket_id', $ticket->ticket_id)
                            ->increment('sold_quantity', $quantity);
                        
                        // Prepare formatted order ticket data for response
                        $formattedOrderTicket = array(
                            'order_ticket_id' => $orderTicket->order_ticket_id, // Order ticket ID
                            'ticket_id' => $ticket->ticket_id, // Ticket ID
                            'ticket_type' => $ticket->ticket_type, // Ticket type (single_entry, table_ticket)
                            'ticket_category' => $ticket->ticketCategory->category_name ?? null, // Ticket category name (if available)
                            'quantity' => $quantity, // Quantity purchased
                            'unit_price' => number_format($unitPrice, 2, '.', ''), // Unit price formatted to 2 decimal places
                            'total_price' => number_format($totalPrice, 2, '.', ''), // Total price formatted to 2 decimal places
                        );
                        
                        // Add formatted order ticket to array
                        $formattedOrderTickets[] = $formattedOrderTicket;
                    }
                    
                    // Update coupon times_used atomically if coupon was applied
                    if ($coupon && $couponId) {
                        // Increment coupon times_used to track usage
                        CouponModel::where('coupon_id', $couponId)
                            ->increment('times_used');
                    }
                    
                    // Delete cart items for this event only after successful order creation
                    // Delete cart items that belong to tickets of the specified event
                    CartModel::where('user_id', $user->user_id)
                        ->whereHas('ticket', function($query) use ($eventId) {
                            // Filter cart items where ticket belongs to the specified event
                            $query->where('event_id', $eventId);
                        })
                        ->delete();
                    
                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }
                
                // Prepare order data for response
                $orderDataResponse = array(
                    'order_id' => $order->order_id, // Order ID
                    'order_number' => $order->order_number, // Order number
                    'order_date' => $order->order_date, // Order date
                    'subtotal' => number_format($subtotal, 2, '.', ''), // Subtotal formatted to 2 decimal places
                    'coupon_discount' => $couponDiscount ? number_format($couponDiscount, 2, '.', '') : '0.00', // Coupon discount formatted to 2 decimal places (0.00 if no coupon)
                    'total_amount' => number_format($total, 2, '.', ''), // Total amount formatted to 2 decimal places
                    'order_tickets' => $formattedOrderTickets, // Array of formatted order tickets
                );
                
                // Return success response with order confirmation
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Order created successfully',
                        'order' => $orderDataResponse, // Order information with order tickets
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in OrderController::createOrder');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request'
                    )
                );
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
        }
        
        // Return JSON encoded response to the client
        return response()->json($result);
    }
    
    /**
     * Get user orders list - retrieves paginated list of orders for authenticated user
     * 
     * This method retrieves all orders for the authenticated user with event information,
     * calculates event status (Live/Upcoming/Completed), and returns paginated results.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getUserOrdersList(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request (query parameters)
        $data = $request->all();
        
        // Define validation rules for optional query parameters
        $rules = array(
            'page' => 'nullable|integer|min:1', // Page number for pagination (optional, minimum 1)
            'per_page' => 'nullable|integer|min:1|max:100', // Items per page (optional, minimum 1, maximum 100)
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize OrderModel to perform database operations
                $orderModel = new OrderModel();
                
                // Get page number from request (default: 1)
                $page = isset($data['page']) ? (int)$data['page'] : 1;
                
                // Get per page from request (default: 30)
                $perPage = isset($data['per_page']) ? (int)$data['per_page'] : 30;
                
                // Query orders for authenticated user with eager loading of relationships
                // Eager load: orderTickets, orderTickets.ticket, orderTickets.ticket.event
                $ordersQuery = OrderModel::with([
                    'orderTickets.ticket.event', // Load order tickets with ticket and event relationships
                ])
                ->where('user_id', $user->user_id) // Filter by authenticated user's ID
                ->orderBy('order_date', 'desc') // Sort by order date descending (newest first)
                ->orderBy('created_at', 'desc'); // Secondary sort by creation timestamp
                
                // Paginate results
                $paginatedOrders = $ordersQuery->paginate($perPage, ['*'], 'page', $page);
                
                // Initialize array to store formatted orders
                $formattedOrders = array();
                
                // Get current date and time for event status calculation
                $currentDateTime = now();
                
                // Loop through each order to format data
                foreach ($paginatedOrders->items() as $order) {
                    // Get first order ticket to access event information
                    $firstOrderTicket = $order->orderTickets->first();
                    
                    // Initialize event data
                    $event = null;
                    $eventId = null;
                    $eventTitle = null;
                    $eventStatus = null;
                    $eventDate = null;
                    $eventTime = null;
                    
                    // Check if order has tickets and event information
                    if ($firstOrderTicket && $firstOrderTicket->ticket && $firstOrderTicket->ticket->event) {
                        // Get event from first ticket (all tickets in an order belong to same event)
                        $event = $firstOrderTicket->ticket->event;
                        $eventId = $event->event_id;
                        $eventTitle = $event->event_title;
                        $eventDate = $event->start_date;
                        $eventTime = $event->start_time;
                        
                        // Calculate event status based on dates and times
                        // Combine start date and time to create datetime
                        // start_time is a TIME column (returns string like "10:00:00"), so use it directly
                        $startDateString = $event->start_date instanceof \Carbon\Carbon
                            ? $event->start_date->format('Y-m-d')
                            : (string)$event->start_date;
                        $endDateString = $event->end_date instanceof \Carbon\Carbon
                            ? $event->end_date->format('Y-m-d')
                            : (string)$event->end_date;

                        $normalizeTime = function ($timeValue) {
                            if ($timeValue instanceof \Carbon\Carbon) {
                                return $timeValue->format('H:i:s');
                            }

                            if (empty($timeValue)) {
                                return '00:00:00';
                            }

                            try {
                                return \Carbon\Carbon::parse($timeValue)->format('H:i:s');
                            } catch (\Exception $exception) {
                                Log::warning('Failed to normalize event time', [
                                    'time_value' => $timeValue,
                                    'message' => $exception->getMessage(),
                                ]);
                                return '00:00:00';
                            }
                        };

                        $startTimeString = $normalizeTime($event->start_time);
                        $endTimeString = $normalizeTime($event->end_time);

                        $startDateTime = \Carbon\Carbon::parse(trim($startDateString . ' ' . $startTimeString));
                        // Combine end date and time to create datetime
                        // end_time is a TIME column (returns string like "10:00:00"), so use it directly
                        $endDateTime = \Carbon\Carbon::parse(trim($endDateString . ' ' . $endTimeString));
                        
                        // Determine event status
                        if ($currentDateTime >= $startDateTime && $currentDateTime <= $endDateTime) {
                            // Current date/time is between start and end: Live/Ongoing
                            $eventStatus = 'Live';
                        } elseif ($currentDateTime < $startDateTime) {
                            // Current date/time is before start: Upcoming
                            $eventStatus = 'Upcoming';
                        } else {
                            // Current date/time is after end: Completed
                            $eventStatus = 'Completed';
                        }
                    }
                    
                    // Calculate total tickets purchased in this order
                    $totalTickets = $order->orderTickets->sum('quantity');
                    
                    // Prepare order data for response
                    $orderData = array(
                        'order_id' => $order->order_id, // Order ID
                        'order_number' => $order->order_number, // Order number (e.g., "OHY1763043605664592")
                        'order_status' => $order->order_status, // Order status (pending_payment, completed, cancelled, etc.)
                        'event_id' => $eventId, // Event ID (if available)
                        'event_title' => $eventTitle, // Event name (if available)
                        'event_status' => $eventStatus, // Event status badge (Live, Upcoming, Completed)
                        'event_date' => $eventDate, // Event start date (if available)
                        'event_time' => $eventTime, // Event start time (if available)
                        'total_tickets' => $totalTickets, // Total number of tickets purchased in this order
                        'total_amount' => number_format((float)$order->total_amount, 2, '.', ''), // Total amount paid formatted to 2 decimal places
                        'order_date' => $order->order_date, // Order creation date
                    );
                    
                    // Add formatted order to array
                    $formattedOrders[] = $orderData;
                }
                
                // Prepare pagination data
                $pagination = array(
                    'total_records' => $paginatedOrders->total(), // Total number of records
                    'current_page' => $paginatedOrders->currentPage(), // Current page number
                    'total_pages' => $paginatedOrders->lastPage(), // Total number of pages
                    'per_page' => $perPage, // Items per page
                    'next_page' => $paginatedOrders->currentPage() < $paginatedOrders->lastPage() ? $paginatedOrders->currentPage() + 1 : null, // Next page number (null if last page)
                    'prev_page' => $paginatedOrders->currentPage() > 1 ? $paginatedOrders->currentPage() - 1 : null, // Previous page number (null if first page)
                );
                
                // Return success response with orders list and pagination
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Orders retrieved successfully',
                        'orders' => $formattedOrders, // Array of formatted orders
                        'pagination' => $pagination, // Pagination information
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in OrderController::getUserOrdersList');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving orders'
                    )
                );
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
        }
        
        // Return JSON encoded response to the client
        return response()->json($result);
    }
    
    /**
     * Get order details - retrieves complete detailed information for a specific order
     * 
     * This method retrieves complete order information including event details, tickets,
     * payment information, and billing address. Verifies order belongs to authenticated user.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getOrderDetails(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request (query parameters)
        $data = $request->all();
        
        // Define validation rules for required query parameter
        $rules = array(
            'order_id' => 'required|integer|min:1', // Order ID is required, must be integer, minimum 1
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize OrderModel to perform database operations
                $orderModel = new OrderModel();
                
                // Get order ID from request data
                $orderId = (int)$data['order_id'];
                
                // Query order with eager loading of all relationships
                // Eager load: orderTickets, orderTickets.ticket, orderTickets.ticket.ticketCategory,
                // orderTickets.ticket.event, orderTickets.ticket.event.venue, orderTickets.ticket.event.media,
                // orderTickets.ticket.event.artists, orderTickets.ticket.event.artists.socialMedia,
                // orderTickets.ticket.event.termsConditions, orderTickets.ticket.event.socialMedia,
                // orderTickets.ticket.event.eventCategory, country, coupon
                $order = OrderModel::with([
                    'orderTickets.ticket.ticketCategory', // Load order tickets with ticket category
                    'orderTickets.ticket.event.venue', // Load event with venue
                    'orderTickets.ticket.event.media', // Load event with media files
                    'orderTickets.ticket.event.artists.socialMedia', // Load event artists with social media
                    'orderTickets.ticket.event.termsConditions', // Load event terms and conditions
                    'orderTickets.ticket.event.socialMedia', // Load event social media links
                    'orderTickets.ticket.event.eventCategory', // Load event category
                    'country', // Load billing country
                    'coupon', // Load applied coupon (if any)
                ])
                ->where('order_id', $orderId)
                ->where('user_id', $user->user_id) // Security: Verify order belongs to authenticated user
                ->first();
                
                // Check if order exists and belongs to authenticated user
                if (!$order) {
                    // Order not found or doesn't belong to user, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Order not found'
                        )
                    ], 404);
                }
                
                // Get first order ticket to access event information
                $firstOrderTicket = $order->orderTickets->first();
                
                // Initialize event data
                $event = null;
                $eventStatus = null;
                
                // Check if order has tickets and event information
                if ($firstOrderTicket && $firstOrderTicket->ticket && $firstOrderTicket->ticket->event) {
                    // Get event from first ticket (all tickets in an order belong to same event)
                    $event = $firstOrderTicket->ticket->event;
                    
                    // Calculate event status based on dates and times
                    // Get current date and time for event status calculation
                    $currentDateTime = now();
                    
                    // Combine start date and time to create datetime
                    // start_time is a TIME column (returns string like "10:00:00"), so use it directly
                    $startDateString = $event->start_date instanceof \Carbon\Carbon
                        ? $event->start_date->format('Y-m-d')
                        : (string)$event->start_date;
                    $endDateString = $event->end_date instanceof \Carbon\Carbon
                        ? $event->end_date->format('Y-m-d')
                        : (string)$event->end_date;

                    $normalizeTime = function ($timeValue) {
                        if ($timeValue instanceof \Carbon\Carbon) {
                            return $timeValue->format('H:i:s');
                        }

                        if (empty($timeValue)) {
                            return '00:00:00';
                        }

                        try {
                            return \Carbon\Carbon::parse($timeValue)->format('H:i:s');
                        } catch (\Exception $exception) {
                            Log::warning('Failed to normalize event time', [
                                'time_value' => $timeValue,
                                'message' => $exception->getMessage(),
                            ]);
                            return '00:00:00';
                        }
                    };

                    $startTimeString = $normalizeTime($event->start_time);
                    $endTimeString = $normalizeTime($event->end_time);

                    $startDateTime = \Carbon\Carbon::parse(trim($startDateString . ' ' . $startTimeString));
                    // Combine end date and time to create datetime
                    // end_time is a TIME column (returns string like "10:00:00"), so use it directly
                    $endDateTime = \Carbon\Carbon::parse(trim($endDateString . ' ' . $endTimeString));
                    
                    // Determine event status
                    if ($currentDateTime >= $startDateTime && $currentDateTime <= $endDateTime) {
                        // Current date/time is between start and end: Live/Ongoing
                        $eventStatus = 'Live';
                    } elseif ($currentDateTime < $startDateTime) {
                        // Current date/time is before start: Upcoming
                        $eventStatus = 'Upcoming';
                    } else {
                        // Current date/time is after end: Completed
                        $eventStatus = 'Completed';
                    }
                }
                
                // Format order information
                $orderInfo = array(
                    'order_id' => $order->order_id, // Order ID
                    'order_number' => $order->order_number, // Order number
                    'order_date' => $order->order_date, // Order date
                    'order_status' => $order->order_status, // Order status
                    'subtotal' => number_format((float)$order->subtotal, 2, '.', ''), // Subtotal formatted to 2 decimal places
                    'coupon_discount' => $order->coupon_discount ? number_format((float)$order->coupon_discount, 2, '.', '') : '0.00', // Coupon discount formatted to 2 decimal places (0.00 if null)
                    'total_amount' => number_format((float)$order->total_amount, 2, '.', ''), // Total amount formatted to 2 decimal places
                );
                
                // Format event details (if available)
                $eventData = null;
                if ($event) {
                    // Format category data (if exists)
                    $categoryData = null;
                    if ($event->eventCategory) {
                        $categoryData = array(
                            'event_category_id' => $event->eventCategory->event_category_id, // Category ID
                            'category_name' => $event->eventCategory->category_name, // Category name
                        );
                    }
                    
                    // Format media data grouped by type
                    $mediaData = array(
                        'thumbnail' => null, // Thumbnail media (single)
                        'banner' => null, // Banner media (single)
                        'flyers' => array(), // Flyer media (multiple)
                        'videos' => array(), // Video media (multiple)
                    );
                    
                    // Loop through all media files and group by type
                    if ($event->media && $event->media->count() > 0) {
                        foreach ($event->media as $media) {
                            // Format media item
                            $mediaItem = array(
                                'event_media_id' => $media->event_media_id, // Media ID
                                'file_path' => $media->file_path, // File path
                                'file_name' => $media->file_name, // Original filename
                                'file_size' => $media->file_size, // File size in bytes
                            );
                            
                            // Add video duration if video type
                            if ($media->media_type == 'video' && $media->video_duration) {
                                $mediaItem['video_duration'] = $media->video_duration; // Video duration
                            }
                            
                            // Group media by type
                            if ($media->media_type == 'thumbnail') {
                                // Single thumbnail
                                $mediaData['thumbnail'] = $mediaItem;
                            } elseif ($media->media_type == 'banner') {
                                // Single banner
                                $mediaData['banner'] = $mediaItem;
                            } elseif ($media->media_type == 'flyer') {
                                // Multiple flyers (add to array)
                                $mediaData['flyers'][] = $mediaItem;
                            } elseif ($media->media_type == 'video') {
                                // Multiple videos (add to array)
                                $mediaData['videos'][] = $mediaItem;
                            }
                        }
                    }
                    
                    // Format venue data (if exists)
                    $venueData = null;
                    if ($event->venue) {
                        $venueData = array(
                            'venue_id' => $event->venue->venue_id, // Venue ID
                            'venue_name' => $event->venue->venue_name, // Venue name
                            'venue_address' => $event->venue->venue_address, // Full street address
                            'city' => $event->venue->city, // City
                            'state_province' => $event->venue->state_province, // State or Province
                            'postal_code' => $event->venue->postal_code, // ZIP/Postal code
                            'latitude' => $event->venue->latitude, // Latitude for map
                            'longitude' => $event->venue->longitude, // Longitude for map
                            'additional_details' => $event->venue->additional_details, // Additional venue details
                            'maximum_attendees' => $event->venue->maximum_attendees, // Maximum attendees
                            'venue_image' => $event->venue->venue_image, // Venue image path
                        );
                    }
                    
                    // Format artists data (if exists)
                    $artistsData = array();
                    if ($event->artists && $event->artists->count() > 0) {
                        foreach ($event->artists as $artist) {
                            // Format artist social media links
                            $socialMediaLinks = array();
                            if ($artist->socialMedia && $artist->socialMedia->count() > 0) {
                                foreach ($artist->socialMedia as $socialMedia) {
                                    $socialMediaLinks[] = array(
                                        'platform' => $socialMedia->platform, // Social media platform
                                        'url' => $socialMedia->url, // Social media URL
                                    );
                                }
                            }
                            
                            // Format artist data
                            $artistData = array(
                                'event_artist_id' => $artist->event_artist_id, // Artist ID
                                'artist_name' => $artist->artist_name, // Artist name
                                'artist_image' => $artist->artist_image, // Artist image path
                                'social_media' => $socialMediaLinks, // Social media links
                            );
                            
                            $artistsData[] = $artistData;
                        }
                    }
                    
                    // Format social media links (if exists)
                    $socialMediaData = array();
                    if ($event->socialMedia && $event->socialMedia->count() > 0) {
                        foreach ($event->socialMedia as $socialMedia) {
                            $socialMediaData[] = array(
                                'platform' => $socialMedia->platform, // Social media platform
                                'url' => $socialMedia->url, // Social media URL
                            );
                        }
                    }
                    
                    // Format terms and conditions (if exists)
                    $termsData = null;
                    if ($event->termsConditions) {
                        $termsData = array(
                            'terms_content' => $event->termsConditions->terms_content, // Terms and conditions content
                        );
                    }
                    
                    // Format complete event data
                    $eventData = array(
                        'event_id' => $event->event_id, // Event ID
                        'event_title' => $event->event_title, // Event title
                        'description' => $event->description, // Event description (rich text)
                        'key_highlights' => $event->key_highlights, // Key highlights (rich text)
                        'category' => $categoryData, // Event category
                        'start_date' => $event->start_date, // Event start date
                        'end_date' => $event->end_date, // Event end date
                        'start_time' => $event->start_time, // Event start time
                        'end_time' => $event->end_time, // Event end time
                        'event_status' => $eventStatus, // Event status (Live, Upcoming, Completed)
                        'media' => $mediaData, // Event media grouped by type
                        'venue' => $venueData, // Venue information
                        'artists' => $artistsData, // Event artists/speakers
                        'social_media' => $socialMediaData, // Event social media links
                        'terms_conditions' => $termsData, // Terms and conditions
                    );
                }
                
                // Format order tickets data
                $orderTicketsData = array();
                foreach ($order->orderTickets as $orderTicket) {
                    // Get ticket and ticket category
                    $ticket = $orderTicket->ticket;
                    $ticketCategory = $ticket ? $ticket->ticketCategory : null;
                    
                    // Format order ticket data
                    $orderTicketData = array(
                        'order_ticket_id' => $orderTicket->order_ticket_id, // Order ticket ID
                        'ticket_id' => $orderTicket->ticket_id, // Ticket ID
                        'ticket_category' => $ticketCategory ? $ticketCategory->category_name : null, // Ticket category name
                        'ticket_type' => $ticket ? $ticket->ticket_type : null, // Ticket type
                        'quantity' => $orderTicket->quantity, // Quantity purchased
                        'unit_price' => number_format((float)$orderTicket->unit_price, 2, '.', ''), // Unit price formatted to 2 decimal places
                        'total_price' => number_format((float)$orderTicket->total_price, 2, '.', ''), // Total price formatted to 2 decimal places
                    );
                    
                    $orderTicketsData[] = $orderTicketData;
                }
                
                // Format payment information
                $paymentInfo = array(
                    'full_name' => $order->full_name, // Purchaser's full name
                    'email' => $order->email, // Purchaser's email
                    'phone_number' => $order->phone_number, // Purchaser's phone number
                );
                
                // Format billing address
                $billingAddress = array(
                    'street_address' => $order->street_address, // Street address
                    'city' => $order->city, // City
                    'state' => $order->state, // State/Province
                    'zip_code' => $order->zip_code, // ZIP/Postal code
                    'country' => $order->country ? array(
                        'country_id' => $order->country->country_id, // Country ID
                        'name' => $order->country->name, // Country name
                    ) : null, // Country information (if available)
                );
                
                // Format coupon information (if applied)
                $couponData = null;
                if ($order->coupon) {
                    $couponData = array(
                        'coupon_id' => $order->coupon->coupon_id, // Coupon ID
                        'coupon_code' => $order->coupon->coupon_code, // Coupon code
                        'discount_type' => $order->coupon->discount_type, // Discount type (percentage or flat)
                        'discount_percent' => $order->coupon->discount_percent ? number_format((float)$order->coupon->discount_percent, 2, '.', '') : null, // Discount percentage (if percentage type)
                        'flat_discount_amount' => $order->coupon->flat_discount_amount ? number_format((float)$order->coupon->flat_discount_amount, 2, '.', '') : null, // Flat discount amount (if flat type)
                        'discount_amount' => $order->coupon_discount ? number_format((float)$order->coupon_discount, 2, '.', '') : '0.00', // Applied discount amount
                    );
                }
                
                // Prepare complete order details for response
                $orderDetails = array(
                    'order_info' => $orderInfo, // Order information
                    'event' => $eventData, // Complete event details
                    'order_tickets' => $orderTicketsData, // Order tickets information
                    'payment_info' => $paymentInfo, // Payment/contact information
                    'billing_address' => $billingAddress, // Billing address
                    'coupon' => $couponData, // Coupon information (if applied)
                );
                
                // Return success response with complete order details
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Order details retrieved successfully',
                        'order' => $orderDetails, // Complete order information
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in OrderController::getOrderDetails');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving order details'
                    )
                );
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
        }
        
        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Create Checkout Session - creates Stripe Checkout Session for visitor payment
     * 
     * This method validates cart items, calculates totals, creates order with pending_payment status,
     * creates Stripe Checkout Session, and returns checkout URL. Order tickets will be created
     * in webhook handler after payment confirmation. Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function createCheckoutSession(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        // Note: Card fields (card_number, expiry_date, cvv) are removed - handled by Stripe
        $rules = array(
            'event_id' => 'required|integer|min:1', // Event ID is required, must be integer, minimum 1
            'full_name' => 'required|string|max:255', // Full name is required, must be string, maximum 255 characters
            'email' => 'required|email|max:255', // Email is required, must be valid email format, maximum 255 characters
            'phone_number' => 'required|string|max:255', // Phone number is required, must be string, maximum 255 characters
            'street_address' => 'required|string|max:255', // Street address is required, must be string, maximum 255 characters
            'city' => 'required|string|max:255', // City is required, must be string, maximum 255 characters
            'state' => 'required|string|max:255', // State is required, must be string, maximum 255 characters
            'zip_code' => 'required|string|max:255', // ZIP code is required, must be string, maximum 255 characters
            'country_id' => 'required|integer|min:1', // Country ID is required, must be integer, minimum 1
            'coupon_code' => 'nullable|string|max:255', // Coupon code is optional, must be string if provided, maximum 255 characters
        );

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();

                // Initialize models and services
                $orderModel = new OrderModel();
                $cartModel = new CartModel();
                $ticketModel = new TicketModel();
                $couponModel = new CouponModel();
                $stripeService = new StripeService();

                // Get event ID from request data
                $eventId = $data['event_id'];

                // Prepare query condition to get cart items for authenticated user and specific event
                $cartQueryCondition = array('user_id' => $user->user_id);

                // Get cart items for user that belong to tickets of the specified event
                // Eager load ticket, ticketCategory, and event relationships
                $cartItems = CartModel::with(['ticket.ticketCategory', 'ticket.event'])
                    ->where($cartQueryCondition)
                    ->whereHas('ticket', function($query) use ($eventId) {
                        // Filter cart items where ticket belongs to the specified event
                        $query->where('event_id', $eventId);
                    })
                    ->get();

                // Check if cart is empty for this event
                if ($cartItems->count() == 0) {
                    // No cart items found for this event, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'No cart items found for this event. Please add items to cart before checkout'
                        )
                    ], 404);
                }

                // Initialize array to store validated cart items with ticket information
                $validatedCartItems = array();

                // Initialize subtotal accumulator
                $subtotal = 0;

                // Loop through each cart item to validate ticket availability and max_per_user limits
                foreach ($cartItems as $cartItem) {

                    // Log::info('Cart item: ' . json_encode($cartItem));

                    // Get ticket from cart item
                    $ticket = $cartItem->ticket;

                    // Check if ticket exists
                    if (!$ticket) {
                        // Ticket not found, return 404 error response
                        return response()->json([
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E404',
                                'error_message' => 'Ticket not found for cart item'
                            )
                        ], 404);
                    }

                    // Check if ticket's event is published (is_published = true, is_draft = false)
                    if (!$ticket->event || !$ticket->event->is_published || $ticket->event->is_draft) {
                        // Ticket belongs to an unpublished event, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Ticket belongs to an unpublished event'
                            )
                        );

                        // Return JSON encoded error response
                        return response()->json($result, 400);
                    }

                    // Check ticket availability: Check if (sold_quantity + cart quantity) <= available_quantity
                    $totalQuantityInCart = $cartItem->quantity;
                    $isAvailable = (($ticket->sold_quantity + $totalQuantityInCart) <= $ticket->total_available);

                    // Check if ticket is available
                    if (!$isAvailable) {
                        // Ticket is sold out or insufficient quantity available, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Insufficient tickets available for ticket ID ' . $ticket->ticket_id . '. Only ' . ($ticket->available_quantity - $ticket->sold_quantity) . ' tickets available'
                            )
                        );

                        // Return JSON encoded error response
                        return response()->json($result, 400);
                    }

                    // Check max_per_user limit: Get total quantity of this ticket type in user's existing orders for this event
                    // Get all order IDs for this user
                    $userOrders = OrderModel::where('user_id', $user->user_id)->pluck('order_id');

                    // Get total quantity of this ticket type already purchased by user for this event
                    $totalUserQuantity = 0;
                    if ($userOrders->count() > 0) {
                        $totalUserQuantity = OrderTicketModel::whereIn('order_id', $userOrders)
                            ->where('ticket_id', $ticket->ticket_id)
                            ->sum('quantity');
                    }

                    // Add current cart quantity to total user quantity
                    $totalUserQuantity += $cartItem->quantity;

                    // Check if total user quantity exceeds max_per_user limit
                    if ($totalUserQuantity > $ticket->max_per_user) {
                        // Maximum tickets per user limit exceeded, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Maximum tickets per user limit exceeded for ticket ID ' . $ticket->ticket_id . '. You can purchase maximum ' . $ticket->max_per_user . ' tickets'
                            )
                        );

                        // Return JSON encoded error response
                        return response()->json($result, 400);
                    }

                    // Calculate total item price: quantity × ticket price
                    $totalItemPrice = $cartItem->quantity * (float)$ticket->price;

                    // Add to subtotal accumulator
                    $subtotal += $totalItemPrice;

                    // Store validated cart item with ticket information for later use
                    $validatedCartItems[] = array(
                        'cart_item' => $cartItem, // Cart item object
                        'ticket' => $ticket, // Ticket object
                        'quantity' => $cartItem->quantity, // Quantity in cart
                        'unit_price' => (float)$ticket->price, // Unit price (price snapshot)
                        'total_price' => $totalItemPrice, // Total price for this line item
                    );
                }

                // Initialize coupon data and discount amount
                $coupon = null;
                $couponId = null;
                $couponDiscount = 0;

                // Check if coupon_code is provided
                if (isset($data['coupon_code']) && !empty($data['coupon_code'])) {
                    // Coupon code is provided, validate coupon

                    // Prepare query condition to find coupon by coupon_code
                    $couponQueryCondition = array('coupon_code' => $data['coupon_code']);

                    // Get coupon record from database
                    $coupon = $couponModel->get_coupon($couponQueryCondition);

                    // Check if coupon exists
                    if (!$coupon) {
                        // Coupon not found, return 404 error response
                        return response()->json([
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E404',
                                'error_message' => 'Coupon not found'
                            )
                        ], 404);
                    }

                    // Verify coupon belongs to the specified event
                    if ($coupon->event_id != $eventId) {
                        // Coupon does not belong to this event, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Coupon does not belong to this event'
                            )
                        );

                        // Return JSON encoded error response
                        return response()->json($result, 400);
                    }

                    // Get current date for validation using Carbon
                    $currentDate = Carbon::today();

                    // Validate date range: Check if current date is between start_date and end_date
                    $isDateValid = false;
                    if ($coupon->end_date) {
                        // End date exists: Check if current date is between start_date and end_date
                        $startDate = Carbon::parse($coupon->start_date);
                        $endDate = Carbon::parse($coupon->end_date);
                        $isDateValid = $currentDate->between($startDate, $endDate, true); // true for inclusive comparison
                    } else {
                        // End date is null: Check if current date is >= start_date
                        $startDate = Carbon::parse($coupon->start_date);
                        $isDateValid = $currentDate->greaterThanOrEqualTo($startDate);
                    }

                    // Check if date validation failed
                    if (!$isDateValid) {
                        // Coupon has expired, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Coupon has expired'
                            )
                        );

                        // Return JSON encoded error response
                        return response()->json($result, 400);
                    }

                    // Validate usage limit: Check if times_used < max_times_applicable
                    $isUsageValid = ($coupon->times_used < $coupon->max_times_applicable);

                    // Check if usage validation failed
                    if (!$isUsageValid) {
                        // Coupon usage limit exceeded, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Coupon usage limit exceeded'
                            )
                        );

                        // Return JSON encoded error response
                        return response()->json($result, 400);
                    }

                    // Calculate discount amount based on discount type
                    $subtotalFloat = (float)$subtotal; // Convert subtotal to float for calculation

                    if ($coupon->discount_type == 'percentage') {
                        // Percentage discount: Calculate discount as percentage of subtotal
                        $couponDiscount = $subtotalFloat * ((float)$coupon->discount_percent / 100);

                        // Apply max cap discount if set
                        if ($coupon->max_cap_discount) {
                            // Cap discount at max_cap_discount if calculated discount exceeds it
                            $couponDiscount = min($couponDiscount, (float)$coupon->max_cap_discount);
                        }
                    } else {
                        // Flat discount: Use flat_discount_amount as discount
                        $couponDiscount = (float)$coupon->flat_discount_amount;
                    }

                    // Set coupon ID for order
                    $couponId = $coupon->coupon_id;
                }

                // Calculate final customer amount (after coupon discount)
                // Customer pays this amount - platform fee is NOT added to customer's bill
                $finalCustomerAmount = $subtotal - $couponDiscount;

                // Ensure final customer amount doesn't go negative (minimum 0.00)
                if ($finalCustomerAmount < 0) {
                    $finalCustomerAmount = 0.00;
                }

                // Customer pays only the final amount (platform fee is NOT added)
                // Platform fee is calculated on-the-fly during settlement based on net amount after Stripe fees
                $total = $finalCustomerAmount;

                // Get current date for order_date field
                $orderDate = date('Y-m-d');

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Generate daily sequential order number (ohy-ddmmyyyy-XXX)
                    $orderNumber = OrderModel::generateDailyOrderNumber(null, true);

                    // Prepare order data array with all required fields
                    $orderData = array(
                        'order_number' => $orderNumber, // Unique order number
                        'user_id' => $user->user_id, // Current authenticated user's ID
                        'order_status' => 'pending_payment', // Order status: pending_payment (will be updated by webhook)
                        'order_date' => $orderDate, // Order date (for filtering/sorting)
                        'full_name' => $data['full_name'], // Purchaser's full name
                        'email' => $data['email'], // Purchaser's email
                        'phone_number' => $data['phone_number'], // Purchaser's phone number
                        'street_address' => $data['street_address'], // Billing street address
                        'city' => $data['city'], // Billing city
                        'state' => $data['state'], // Billing state/province
                        'zip_code' => $data['zip_code'], // Billing ZIP/postal code
                        'country_id' => $data['country_id'], // Foreign key to countries table
                        'subtotal' => round($subtotal, 2), // Sum of all ticket prices rounded to 2 decimal places
                        'coupon_discount' => $couponDiscount ? round($couponDiscount, 2) : null, // Discount amount from coupon rounded to 2 decimal places (if applied)
                        'total_amount' => round($total, 2), // Final amount customer pays (after coupon discount, platform fee NOT added)
                        'coupon_id' => $couponId, // Applied coupon ID (if any)
                        'stripe_checkout_session_id' => null, // Will be set after Stripe session creation
                    );

                    // Create order record in the database
                    $order = $orderModel->create_order($orderData);

                    // Get order ID for metadata
                    $orderId = $order->order_id;

                    // Build line items for Stripe Checkout Session
                    $lineItems = array();
                    
                    // Calculate discount ratio if coupon is applied (for proportional price adjustment)
                    $discountRatio = 0;
                    if ($couponDiscount > 0 && $subtotal > 0) {
                        $discountRatio = $couponDiscount / $subtotal;
                    }
                    
                    foreach ($validatedCartItems as $validatedItem) {
                        $ticket = $validatedItem['ticket'];
                        $quantity = $validatedItem['quantity'];
                        $unitPrice = $validatedItem['unit_price'];
                        
                        // Apply discount proportionally to unit price if coupon is applied
                        if ($discountRatio > 0) {
                            $unitPrice = $unitPrice * (1 - $discountRatio);
                        }
                        
                        // Get event title for product description
                        $eventTitle = $ticket->event->event_title ?? 'Event Ticket';
                        
                        // Get ticket category name if available
                        $ticketCategoryName = $ticket->ticketCategory->category_name ?? null;
                        $ticketTypeDisplay = $ticketCategoryName ? $ticketCategoryName : ucfirst(str_replace('_', ' ', $ticket->ticket_type));
                        
                        // Add coupon info to description if discount is applied
                        $description = 'Ticket for ' . $eventTitle;
                        if ($discountRatio > 0 && $coupon && isset($coupon->coupon_code)) {
                            $description .= ' (Coupon: ' . $coupon->coupon_code . ' applied)';
                        }
                        
                        // Convert price to cents for Stripe
                        $unitAmountCents = (int)round($unitPrice * 100);
                        
                        $lineItems[] = array(
                            'price_data' => array(
                                'currency' => 'usd',
                                'product_data' => array(
                                    'name' => $eventTitle . ' - ' . $ticketTypeDisplay,
                                    'description' => $description,
                                ),
                                'unit_amount' => $unitAmountCents,
                            ),
                            'quantity' => $quantity,
                        );
                    }

                    // Prepare metadata for Stripe Checkout Session
                    $metadata = array(
                        'order_id' => (string)$orderId,
                        'user_id' => (string)$user->user_id,
                        'event_id' => (string)$eventId,
                    );

                    // Add coupon_id to metadata if coupon was applied
                    if ($couponId) {
                        $metadata['coupon_id'] = (string)$couponId;
                    }

                    // Get checkout URLs from constants
                    $successUrl = config('constants.checkout.success_url');
                    $cancelUrl = config('constants.checkout.cancel_url');

                    // Create Stripe Checkout Session
                    $checkoutSessionData = array(
                        'line_items' => $lineItems,
                        'customer_email' => $data['email'],
                        'metadata' => $metadata,
                        'success_url' => $successUrl,
                        'cancel_url' => $cancelUrl,
                        'mode' => 'payment',
                    );

                    $checkoutSession = $stripeService->createCheckoutSession($checkoutSessionData);

                    // Update order with stripe_checkout_session_id
                    $updateCondition = array(
                        'order_id' => $orderId,
                    );
                    $updateData = array(
                        'stripe_checkout_session_id' => $checkoutSession->id,
                    );
                    $orderModel->update_order_data($updateCondition, $updateData);

                    // Commit transaction if all operations succeed
                    DB::commit();

                    // Return success response with checkout URL
                    $result = array(
                        'success' => true,
                        'data' => array(
                            'checkout_url' => $checkoutSession->url,
                            'session_id' => $checkoutSession->id,
                            'order_id' => $orderId,
                            'message' => 'Checkout session created successfully',
                        )
                    );
                } catch (\Stripe\Exception\ApiErrorException $e) {
                    // Rollback transaction on Stripe error
                    DB::rollBack();

                    Log::error('Stripe API Error in createCheckoutSession', [
                        'user_id' => $user->user_id,
                        'event_id' => $eventId,
                        'error' => $e->getMessage(),
                    ]);

                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E002',
                            'error_message' => 'Failed to create checkout session: ' . $e->getMessage()
                        )
                    );

                    // Return JSON response with 500 Internal Server Error status code
                    return response()->json($result, 500);
                } catch (\Exception $e) {
                    // Rollback transaction on any error
                    DB::rollBack();

                    // Log exception details for debugging purposes
                    Log::info('Exception in OrderController::createCheckoutSession');
                    Log::info($e->getMessage());
                    Log::info($e);

                    // Return error response to the client
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E002',
                            'error_message' => 'An error occurred while processing your request'
                        )
                    );

                    // Return JSON response with 500 Internal Server Error status code
                    return response()->json($result, 500);
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in OrderController::createCheckoutSession');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request'
                    )
                );

                // Return JSON response with 500 Internal Server Error status code
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

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }
}

