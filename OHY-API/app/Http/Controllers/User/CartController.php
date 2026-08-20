<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\CartModel;
use App\Models\TicketModel;
use App\Models\OrderTicketModel;
use App\Models\OrderModel;
use App\Models\CouponModel;

class CartController extends Controller
{
    /**
     * Add cart item - allows End Users to add tickets to their shopping cart
     * 
     * This method handles adding tickets to cart with validation for ticket availability,
     * max per user limits, and updating existing cart items if the same ticket is added again.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function addCartItem(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'ticket_id' => 'required|integer|min:1', // Ticket ID is required, must be integer, minimum 1
            'quantity' => 'required|integer|min:1', // Quantity is required, must be integer, minimum 1
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize models to perform database operations
                $ticketModel = new TicketModel();
                $cartModel = new CartModel();
                $orderTicketModel = new OrderTicketModel();
                
                // Prepare query condition to find ticket by ticket_id
                $ticketQueryCondition = array('ticket_id' => $data['ticket_id']);
                
                // Get ticket record from database (eager load event relationship to check if event is published)
                $ticket = TicketModel::with('event')->where($ticketQueryCondition)->first();
                
                // Check if ticket exists
                if (!$ticket) {
                    // Ticket not found, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Ticket not found'
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
                
                // Prepare query condition to check if cart item already exists for this user and ticket
                $cartQueryCondition = array(
                    'user_id' => $user->user_id, // Current authenticated user's ID
                    'ticket_id' => $data['ticket_id'], // Ticket ID being added
                );
                
                // Get existing cart item if it exists
                $existingCartItem = $cartModel->get_cart($cartQueryCondition);
                
                // Calculate current cart quantity (0 if cart item doesn't exist)
                $currentCartQuantity = $existingCartItem ? $existingCartItem->quantity : 0;
                
                // Calculate final quantity after adding new quantity: current cart quantity + new quantity
                $finalQuantity = $currentCartQuantity + $data['quantity'];
                
                // Check if final quantity exceeds available tickets
                if ($finalQuantity > $availableTickets) {
                    // Insufficient tickets available, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Insufficient tickets available. Only ' . $availableTickets . ' tickets remaining'
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
                    $purchasedQuantity = OrderTicketModel::where('ticket_id', $data['ticket_id'])
                        ->whereIn('order_id', $userOrders)
                        ->sum('quantity');
                }
                
                // Calculate total user quantity: existing purchases + current cart + new quantity
                $totalUserQuantity = $purchasedQuantity + $currentCartQuantity + $data['quantity'];
                
                // Check if total user quantity exceeds max_per_user limit
                if ($totalUserQuantity > $ticket->max_per_user) {
                    // Maximum tickets per user limit exceeded, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Maximum tickets per user limit exceeded. You can purchase maximum ' . $ticket->max_per_user . ' tickets'
                        )
                    );
                    
                    // Return JSON encoded error response
                    return json_encode($result);
                }
                
                // Begin database transaction to ensure data consistency
                DB::beginTransaction();
                
                try {
                    // Check if cart item already exists
                    if ($existingCartItem) {
                        // Cart item exists, update quantity by adding new quantity to existing
                        $updateData = array(
                            'quantity' => $finalQuantity, // Update to final quantity
                        );
                        
                        // Update cart item quantity
                        $cartModel->update_cart_data($cartQueryCondition, $updateData);
                        
                        // Refresh cart item to get updated data (eager load ticket and ticketCategory relationships)
                        $cartItem = CartModel::with('ticket.ticketCategory')->where($cartQueryCondition)->first();
                    } else {
                        // Cart item doesn't exist, create new cart item
                        $cartData = array(
                            'user_id' => $user->user_id, // Current authenticated user's ID
                            'ticket_id' => $data['ticket_id'], // Ticket ID being added
                            'quantity' => $data['quantity'], // Quantity to add
                        );
                        
                        // Create new cart item
                        $cartItem = $cartModel->create_cart($cartData);
                        
                        // Load ticket and ticketCategory relationships for response
                        $cartItem->load('ticket.ticketCategory');
                    }
                    
                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }
                
                // Prepare ticket details for response
                $ticketDetails = array(
                    'ticket_id' => $ticket->ticket_id, // Ticket ID
                    'ticket_type' => $ticket->ticket_type, // Ticket type (single_entry, table_ticket)
                    'price' => number_format((float)$ticket->price, 2, '.', ''), // Ticket price formatted to 2 decimal places
                    'ticket_category' => $cartItem->ticket->ticketCategory->category_name ?? null, // Ticket category name
                );
                
                // Prepare cart item data for response
                $cartItemData = array(
                    'cart_id' => $cartItem->cart_id, // Cart item ID
                    'ticket_id' => $cartItem->ticket_id, // Ticket ID
                    'quantity' => $cartItem->quantity, // Final quantity in cart
                    'ticket_details' => $ticketDetails, // Ticket details
                );
                
                // Return success response with cart item data
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Ticket added to cart successfully',
                        'cart_item' => $cartItemData, // Cart item information
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in CartController::addCartItem');
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
     * Get cart items - retrieves all items in End User's shopping cart
     * 
     * This method retrieves all cart items for the authenticated user with complete
     * event and ticket details, including event thumbnail, venue information, and
     * calculated subtotal. Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getCartItems(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        try {
            // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
            $user = $request->user();
            
            // Prepare query condition to get all cart items for authenticated user
            $cartQueryCondition = array('user_id' => $user->user_id);
            
            // Get all cart items for user with eager loading of relationships
            // Eager load: ticket, ticket.ticketCategory, ticket.event, ticket.event.venue, ticket.event.media
            $cartItems = CartModel::with([
                'ticket.ticketCategory', // Load ticket with its category
                'ticket.event.venue', // Load ticket's event with venue
                'ticket.event.media' => function($query) {
                    // Filter media to get only thumbnail (first one found)
                    $query->where('media_type', 'thumbnail')->limit(1);
                }
            ])->where($cartQueryCondition)->get();
            
            // Initialize array to store formatted cart items
            $formattedCartItems = array();
            
            // Initialize subtotal accumulator
            $subtotal = 0;
            
            // Loop through each cart item to format data
            foreach ($cartItems as $cartItem) {
                // Get ticket from cart item
                $ticket = $cartItem->ticket;
                
                // Skip if ticket or event is missing (data integrity issue)
                if (!$ticket || !$ticket->event) {
                    continue; // Skip this cart item
                }
                
                // Get event from ticket
                $event = $ticket->event;
                
                // Get thumbnail from event media (first thumbnail found)
                $thumbnail = null;
                if ($event->media && $event->media->count() > 0) {
                    // Get first thumbnail media file path
                    $thumbnailMedia = $event->media->first();
                    $thumbnail = $thumbnailMedia->file_path ?? null;
                }
                
                // Get venue from event
                $venue = $event->venue;
                
                // Calculate total item price: quantity × ticket price
                $totalItemPrice = $cartItem->quantity * (float)$ticket->price;
                
                // Add to subtotal accumulator
                $subtotal += $totalItemPrice;
                
                // Prepare venue data for response
                $venueData = null;
                if ($venue) {
                    // Format venue information
                    $venueData = array(
                        'venue_name' => $venue->venue_name, // Venue name
                        'city' => $venue->city, // City name
                        'state_province' => $venue->state_province, // State or Province
                        'venue_address' => $venue->venue_address, // Full street address
                    );
                }
                
                // Prepare event data for response
                $eventData = array(
                    'event_id' => $event->event_id, // Event ID
                    'event_title' => $event->event_title, // Event name/title
                    'start_date' => $event->start_date, // Event start date
                    'end_date' => $event->end_date, // Event end date
                    'start_time' => $event->start_time, // Event start time
                    'end_time' => $event->end_time, // Event end time
                    'thumbnail' => $thumbnail, // Event thumbnail image path (if available)
                    'venue' => $venueData, // Venue information
                );
                
                // Prepare cart item data for response
                $cartItemData = array(
                    'cart_id' => $cartItem->cart_id, // Cart item ID
                    'ticket_id' => $cartItem->ticket_id, // Ticket ID
                    'quantity' => $cartItem->quantity, // Quantity in cart
                    'item_price' => number_format((float)$ticket->price, 2, '.', ''), // Item price per ticket formatted to 2 decimal places
                    'total_item_price' => number_format($totalItemPrice, 2, '.', ''), // Total item price (quantity × price) formatted to 2 decimal places
                    'ticket_type' => $ticket->ticket_type, // Ticket type (single_entry, table_ticket)
                    'ticket_category' => $ticket->ticketCategory->category_name ?? null, // Ticket category name (if available)
                    'event' => $eventData, // Event details
                );
                
                // Add formatted cart item to array
                $formattedCartItems[] = $cartItemData;
            }
            
            // Format subtotal to 2 decimal places
            $formattedSubtotal = number_format($subtotal, 2, '.', '');
            
            // Return success response with cart items and subtotal
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Cart items retrieved successfully',
                    'cart_items' => $formattedCartItems, // Array of formatted cart items
                    'subtotal' => $formattedSubtotal, // Total subtotal formatted to 2 decimal places
                )
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in CartController::getCartItems');
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
        
        // Return JSON encoded response to the client
        return response()->json($result);
    }
    
    /**
     * Update cart item - allows End Users to update quantity of items in their shopping cart
     * 
     * This method handles updating cart item quantity with validation for ticket availability
     * and max per user limits. If quantity is set to 0, the cart item will be automatically deleted.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function updateCartItem(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'cart_id' => 'required|integer|min:1', // Cart ID is required, must be integer, minimum 1
            'quantity' => 'required|integer|min:0', // Quantity is required, must be integer, minimum 0
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize models to perform database operations
                $cartModel = new CartModel();
                $orderTicketModel = new OrderTicketModel();
                
                // Prepare query condition to find cart item by cart_id and user_id
                $cartQueryCondition = array(
                    'cart_id' => $data['cart_id'], // Cart item ID to update
                    'user_id' => $user->user_id, // Current authenticated user's ID (security: ensure cart item belongs to user)
                );
                
                // Get cart item from database
                $cartItem = $cartModel->get_cart($cartQueryCondition);
                
                // Check if cart item exists and belongs to authenticated user
                if (!$cartItem) {
                    // Cart item not found or doesn't belong to user, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Cart item not found'
                        )
                    ], 404);
                }
                
                // Check if quantity is 0 (delete cart item)
                if ($data['quantity'] == 0) {
                    // Quantity is 0, delete the cart item
                    
                    // Begin database transaction to ensure data consistency
                    DB::beginTransaction();
                    
                    try {
                        // Delete cart item using delete_cart method
                        $cartModel->delete_cart($cartQueryCondition);
                        
                        // Commit transaction if operation succeeds
                        DB::commit();
                    } catch (\Exception $e) {
                        // Rollback transaction on any error to maintain data integrity
                        DB::rollBack();
                        throw $e; // Re-throw exception to outer catch block
                    }
                    
                    // Return success response indicating item removed
                    $result = array(
                        'success' => true,
                        'data' => array(
                            'message' => 'Cart item removed successfully'
                        )
                    );
                } else {
                    // Quantity is greater than 0, update cart item quantity
                    
                    // Get ticket ID from cart item
                    $ticketId = $cartItem->ticket_id;
                    
                    // Prepare query condition to find ticket by ticket_id
                    $ticketQueryCondition = array('ticket_id' => $ticketId);
                    
                    // Get ticket record from database (eager load event relationship to check if event is published)
                    $ticket = TicketModel::with('event')->where($ticketQueryCondition)->first();
                    
                    // Check if ticket exists
                    if (!$ticket) {
                        // Ticket not found, return 404 error response
                        return response()->json([
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E404',
                                'error_message' => 'Ticket not found'
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
                    
                    // Check if requested quantity exceeds available tickets
                    if ($data['quantity'] > $availableTickets) {
                        // Insufficient tickets available, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Insufficient tickets available. Only ' . $availableTickets . ' tickets remaining'
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
                        $purchasedQuantity = OrderTicketModel::where('ticket_id', $ticketId)
                            ->whereIn('order_id', $userOrders)
                            ->sum('quantity');
                    }
                    
                    // Calculate total user quantity: existing purchases + new quantity
                    $totalUserQuantity = $purchasedQuantity + $data['quantity'];
                    
                    // Check if total user quantity exceeds max_per_user limit
                    if ($totalUserQuantity > $ticket->max_per_user) {
                        // Maximum tickets per user limit exceeded, return error response
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => 'Maximum tickets per user limit exceeded. You can purchase maximum ' . $ticket->max_per_user . ' tickets'
                            )
                        );
                        
                        // Return JSON encoded error response
                        return json_encode($result);
                    }
                    
                    // Begin database transaction to ensure data consistency
                    DB::beginTransaction();
                    
                    try {
                        // Prepare update data with new quantity
                        $updateData = array(
                            'quantity' => $data['quantity'], // Update to new quantity
                        );
                        
                        // Update cart item quantity
                        $cartModel->update_cart_data($cartQueryCondition, $updateData);
                        
                        // Commit transaction if operation succeeds
                        DB::commit();
                    } catch (\Exception $e) {
                        // Rollback transaction on any error to maintain data integrity
                        DB::rollBack();
                        throw $e; // Re-throw exception to outer catch block
                    }
                    
                    // Refresh cart item to get updated data (eager load ticket and ticketCategory relationships)
                    $updatedCartItem = CartModel::with('ticket.ticketCategory')->where($cartQueryCondition)->first();
                    
                    // Prepare ticket details for response
                    $ticketDetails = array(
                        'ticket_id' => $ticket->ticket_id, // Ticket ID
                        'ticket_type' => $ticket->ticket_type, // Ticket type (single_entry, table_ticket)
                        'price' => number_format((float)$ticket->price, 2, '.', ''), // Ticket price formatted to 2 decimal places
                        'ticket_category' => $updatedCartItem->ticket->ticketCategory->category_name ?? null, // Ticket category name
                    );
                    
                    // Prepare cart item data for response
                    $cartItemData = array(
                        'cart_id' => $updatedCartItem->cart_id, // Cart item ID
                        'ticket_id' => $updatedCartItem->ticket_id, // Ticket ID
                        'quantity' => $updatedCartItem->quantity, // Updated quantity in cart
                        'ticket_details' => $ticketDetails, // Ticket details
                    );
                    
                    // Return success response with updated cart item data
                    $result = array(
                        'success' => true,
                        'data' => array(
                            'message' => 'Cart item updated successfully',
                            'cart_item' => $cartItemData, // Updated cart item information
                        )
                    );
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in CartController::updateCartItem');
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
     * Get available coupons - retrieves all available coupons for events in cart
     * 
     * This method retrieves coupons for specified event IDs, validates each coupon
     * for date range and usage limits, and returns them with active/expired status.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getAvailableCoupons(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'event_ids' => 'required|array|min:1', // Event IDs array is required, must be array, minimum 1 element
            'event_ids.*' => 'required|integer|min:1', // Each event ID must be integer, minimum 1
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Get event IDs from request data
                $eventIds = $data['event_ids'];
                
                // Get current date for validation
                $currentDate = Carbon::today();
                
                // Query all coupons for the provided event IDs
                $coupons = CouponModel::whereIn('event_id', $eventIds)->get();
                
                // Initialize array to store formatted coupons
                $formattedCoupons = array();
                
                // Loop through each coupon to validate and format
                foreach ($coupons as $coupon) {
                    // Validate date range: Check if current date is between start_date and end_date
                    $isDateValid = false;
                    $startDate = $coupon->start_date ? Carbon::parse($coupon->start_date)->startOfDay() : null;
                    $endDate = $coupon->end_date ? Carbon::parse($coupon->end_date)->endOfDay() : null;

                    if ($startDate && $endDate) {
                        // End date exists: Check if current date is between start_date and end_date (inclusive)
                        $isDateValid = $currentDate->betweenIncluded($startDate, $endDate);
                    } elseif ($startDate) {
                        // End date is null: Check if current date is >= start_date
                        $isDateValid = $currentDate->greaterThanOrEqualTo($startDate);
                    }
                    
                    // Validate usage limit: Check if times_used < max_times_applicable
                    $isUsageValid = ($coupon->times_used < $coupon->max_times_applicable);
                    
                    // Determine status with additional coming_soon" state for future start dates
                    if ($startDate && $currentDate->lessThan($startDate)) {
                        $status = 'coming_soon';
                    } elseif ($isDateValid && $isUsageValid) {
                        $status = 'active';
                    } else {
                        $status = 'expired';
                    }
                    
                    // Format discount display string based on discount type
                    $discountDisplay = '';
                    if ($coupon->discount_type == 'percentage') {
                        // Percentage discount: Format as "XX% OFF"
                        $discountDisplay = number_format((float)$coupon->discount_percent, 0) . '% OFF';
                    } else {
                        // Flat discount: Format as "$XX.XX OFF"
                        $discountDisplay = '$' . number_format((float)$coupon->flat_discount_amount, 2, '.', '') . ' OFF';
                    }
                    
                    // Format usage display: "Used: X/Y"
                    $usageDisplay = 'Used: ' . $coupon->times_used . '/' . $coupon->max_times_applicable;
                    
                    // Prepare coupon data for response
                    $couponData = array(
                        'coupon_id' => $coupon->coupon_id, // Coupon ID
                        'event_id' => $coupon->event_id, // Event ID
                        'coupon_code' => $coupon->coupon_code, // Coupon code (e.g., "EARLY20")
                        'discount_type' => $coupon->discount_type, // Discount type (percentage or flat)
                        'discount_percent' => $coupon->discount_percent ? number_format((float)$coupon->discount_percent, 2, '.', '') : null, // Discount percentage formatted to 2 decimal places (if percentage type)
                        'max_cap_discount' => $coupon->max_cap_discount ? number_format((float)$coupon->max_cap_discount, 2, '.', '') : null, // Maximum discount cap formatted to 2 decimal places (if percentage type)
                        'flat_discount_amount' => $coupon->flat_discount_amount ? number_format((float)$coupon->flat_discount_amount, 2, '.', '') : null, // Flat discount amount formatted to 2 decimal places (if flat type)
                        'discount_display' => $discountDisplay, // Formatted discount display string (e.g., "20% OFF" or "$50.00 OFF")
                        'start_date' => $coupon->start_date, // Coupon validity start date
                        'end_date' => $coupon->end_date, // Coupon validity end date (null if no expiry)
                        'valid_until' => $coupon->end_date, // Valid until date (same as end_date, null if no expiry)
                        'times_used' => $coupon->times_used, // Number of times coupon has been used
                        'max_times_applicable' => $coupon->max_times_applicable, // Maximum number of times coupon can be used
                        'usage_display' => $usageDisplay, // Formatted usage display string (e.g., "Used: 45/100")
                        'status' => $status, // Coupon status (active or expired)
                    );
                    
                    // Add formatted coupon to array
                    $formattedCoupons[] = $couponData;
                }
                
                // Return success response with formatted coupons
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Available coupons retrieved successfully',
                        'coupons' => $formattedCoupons, // Array of formatted coupons with validation status
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in CartController::getAvailableCoupons');
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
     * Apply coupon - allows End Users to apply a coupon to their cart
     * 
     * This method validates the coupon, calculates the discount amount based on cart subtotal,
     * and returns the coupon details with calculated discount (including coupon_id). Protected route - requires authentication.
     * Request: coupon (string) or coupon_id (integer) - one required; subtotal (required).
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function applyCoupon(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules: accept either coupon (string: code or id) or coupon_id (integer)
        $rules = array(
            'coupon' => 'required_without:coupon_id|nullable|string|max:255',
            'coupon_id' => 'required_without:coupon|nullable|integer|min:1',
            'subtotal' => 'required|numeric|min:0',
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize CouponModel to perform database operations
                $couponModel = new CouponModel();
                
                // Resolve coupon: use coupon_id if present, else coupon (string = code or id as string)
                if (isset($data['coupon_id']) && (int) $data['coupon_id'] >= 1) {
                    $couponQueryCondition = array('coupon_id' => (int) $data['coupon_id']);
                } else {
                    $couponInput = trim((string) $data['coupon']);
                    if (ctype_digit($couponInput) && (int) $couponInput >= 1) {
                        $couponQueryCondition = array('coupon_id' => (int) $couponInput);
                    } else {
                        $couponQueryCondition = array('coupon_code' => $couponInput);
                    }
                }
                
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
                
                // Optional: Verify coupon's event is in user's cart (security check)
                // Get user's cart items to check if coupon's event is in cart
                $userCartItems = CartModel::where('user_id', $user->user_id)->pluck('ticket_id');
                
                // Get event IDs from user's cart items via tickets
                $userEventIds = array();
                if ($userCartItems->count() > 0) {
                    $userEventIds = TicketModel::whereIn('ticket_id', $userCartItems)
                        ->pluck('event_id')
                        ->unique()
                        ->toArray();
                }
                
                // Check if coupon's event is in user's cart
                if (!in_array($coupon->event_id, $userEventIds)) {
                    // Coupon is not valid for events in user's cart, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Coupon is not valid for events in your cart'
                        )
                    );
                    
                    // Return JSON encoded error response
                    return response()->json($result);
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
                    return response()->json($result);
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
                    return response()->json($result);
                }
                
                // Calculate discount amount based on discount type
                $discountAmount = 0;
                $subtotalFloat = (float)$data['subtotal']; // Convert subtotal to float for calculation
                
                if ($coupon->discount_type == 'percentage') {
                    // Percentage discount: Calculate discount as percentage of subtotal
                    $discountAmount = $subtotalFloat * ((float)$coupon->discount_percent / 100);
                    
                    // Apply max cap discount if set
                    if ($coupon->max_cap_discount) {
                        // Cap discount at max_cap_discount if calculated discount exceeds it
                        $discountAmount = min($discountAmount, (float)$coupon->max_cap_discount);
                    }
                } else {
                    // Flat discount: Use flat_discount_amount as discount
                    $discountAmount = (float)$coupon->flat_discount_amount;
                }
                
                // Format discount amount to 2 decimal places
                $formattedDiscountAmount = number_format($discountAmount, 2, '.', '');
                
                // Calculate total after discount: subtotal - discount
                $totalAfterDiscount = $subtotalFloat - $discountAmount;
                
                // Format total after discount to 2 decimal places
                $formattedTotalAfterDiscount = number_format($totalAfterDiscount, 2, '.', '');
                
                // Format subtotal to 2 decimal places
                $formattedSubtotal = number_format($subtotalFloat, 2, '.', '');
                
                // Format discount display string based on discount type
                $discountDisplay = '';
                if ($coupon->discount_type == 'percentage') {
                    // Percentage discount: Format as "XX% OFF"
                    $discountDisplay = number_format((float)$coupon->discount_percent, 0) . '% OFF';
                } else {
                    // Flat discount: Format as "$XX.XX OFF"
                    $discountDisplay = '$' . number_format((float)$coupon->flat_discount_amount, 2, '.', '') . ' OFF';
                }
                
                // Prepare coupon data for response
                $couponData = array(
                    'coupon_id' => $coupon->coupon_id, // Coupon ID
                    'event_id' => $coupon->event_id, // Event ID
                    'coupon_code' => $coupon->coupon_code, // Coupon code (e.g., "EARLY20")
                    'discount_type' => $coupon->discount_type, // Discount type (percentage or flat)
                    'discount_percent' => $coupon->discount_percent ? number_format((float)$coupon->discount_percent, 2, '.', '') : null, // Discount percentage formatted to 2 decimal places (if percentage type)
                    'max_cap_discount' => $coupon->max_cap_discount ? number_format((float)$coupon->max_cap_discount, 2, '.', '') : null, // Maximum discount cap formatted to 2 decimal places (if percentage type)
                    'flat_discount_amount' => $coupon->flat_discount_amount ? number_format((float)$coupon->flat_discount_amount, 2, '.', '') : null, // Flat discount amount formatted to 2 decimal places (if flat type)
                    'discount_display' => $discountDisplay, // Formatted discount display string (e.g., "20% OFF" or "$50.00 OFF")
                    'discount_amount' => $formattedDiscountAmount, // Calculated discount amount formatted to 2 decimal places
                    'subtotal' => $formattedSubtotal, // Cart subtotal formatted to 2 decimal places
                    'total_after_discount' => $formattedTotalAfterDiscount, // Total after discount formatted to 2 decimal places
                );
                
                // Return success response with coupon data and calculated discount
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Coupon applied successfully',
                        'coupon' => $couponData, // Coupon information with calculated discount
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in CartController::applyCoupon');
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
     * Get checkout summary - retrieves complete checkout summary for a specific event
     * 
     * This method retrieves all cart items for a specific event, calculates subtotal,
     * validates and applies coupon discount if provided, and returns complete checkout summary
     * including subtotal, service fee, coupon discount, and total. Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getCheckoutSummary(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'event_id' => 'required|integer|min:1', // Event ID is required, must be integer, minimum 1
            'coupon_id' => 'nullable|integer|min:1', // Coupon ID is optional, must be integer if provided, minimum 1
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize CouponModel to perform database operations
                $couponModel = new CouponModel();
                
                // Get event ID from request data
                $eventId = $data['event_id'];
                
                // Get all cart items for authenticated user that belong to tickets of the specified event
                // Eager load ticket and ticketCategory relationships for cart items
                $cartItems = CartModel::with(['ticket.ticketCategory'])
                    ->where('user_id', $user->user_id)
                    ->whereHas('ticket', function($query) use ($eventId) {
                        // Filter cart items where ticket belongs to the specified event
                        $query->where('event_id', $eventId);
                    })
                    ->get();
                
                // Check if cart items exist for this event
                if ($cartItems->count() == 0) {
                    // No cart items found for this event, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'No cart items found for this event'
                        )
                    ], 404);
                }
                
                // Initialize array to store formatted cart items
                $formattedCartItems = array();
                
                // Initialize subtotal accumulator
                $subtotal = 0;
                
                // Loop through each cart item to format data and calculate subtotal
                foreach ($cartItems as $cartItem) {
                    // Get ticket from cart item
                    $ticket = $cartItem->ticket;
                    
                    // Skip if ticket is missing (data integrity issue)
                    if (!$ticket) {
                        continue; // Skip this cart item
                    }
                    
                    // Calculate total item price: quantity × ticket price
                    $totalItemPrice = $cartItem->quantity * (float)$ticket->price;
                    
                    // Add to subtotal accumulator
                    $subtotal += $totalItemPrice;
                    
                    // Prepare cart item data for response
                    $cartItemData = array(
                        'cart_id' => $cartItem->cart_id, // Cart item ID
                        'ticket_id' => $cartItem->ticket_id, // Ticket ID
                        'quantity' => $cartItem->quantity, // Quantity in cart
                        'ticket_type' => $ticket->ticket_type, // Ticket type (single_entry, table_ticket)
                        'ticket_category' => $ticket->ticketCategory->category_name ?? null, // Ticket category name (if available)
                        'item_price' => number_format((float)$ticket->price, 2, '.', ''), // Item price per ticket formatted to 2 decimal places
                        'total_item_price' => number_format($totalItemPrice, 2, '.', ''), // Total item price (quantity × price) formatted to 2 decimal places
                    );
                    
                    // Add formatted cart item to array
                    $formattedCartItems[] = $cartItemData;
                }
                
                // Format subtotal to 2 decimal places
                $formattedSubtotal = number_format($subtotal, 2, '.', '');
                
                // Initialize coupon data and discount amount
                $couponData = null;
                $couponDiscount = 0;
                
                // Check if coupon_id is provided
                if (isset($data['coupon_id']) && !empty($data['coupon_id'])) {
                    // Coupon ID is provided, validate and calculate discount
                    
                    // Prepare query condition to find coupon by coupon_id
                    $couponQueryCondition = array('coupon_id' => $data['coupon_id']);
                    
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
                    
                    // Format discount display string based on discount type
                    $discountDisplay = '';
                    if ($coupon->discount_type == 'percentage') {
                        // Percentage discount: Format as "XX% OFF"
                        $discountDisplay = number_format((float)$coupon->discount_percent, 0) . '% OFF';
                    } else {
                        // Flat discount: Format as "$XX.XX OFF"
                        $discountDisplay = '$' . number_format((float)$coupon->flat_discount_amount, 2, '.', '') . ' OFF';
                    }
                    
                    // Prepare coupon data for response
                    $couponData = array(
                        'coupon_id' => $coupon->coupon_id, // Coupon ID
                        'coupon_code' => $coupon->coupon_code, // Coupon code (e.g., "EARLY20")
                        'discount_display' => $discountDisplay, // Formatted discount display string (e.g., "20% OFF" or "$50.00 OFF")
                        'discount_amount' => number_format($couponDiscount, 2, '.', ''), // Calculated discount amount formatted to 2 decimal places
                    );
                }
                
                // Format coupon discount to 2 decimal places
                $formattedCouponDiscount = number_format($couponDiscount, 2, '.', '');
                
                // Calculate total: subtotal - coupon_discount (platform fee NOT added to customer's bill)
                // Platform fee is calculated on-the-fly during settlement based on net amount after Stripe fees
                $total = $subtotal - $couponDiscount;
                
                // Ensure total doesn't go negative (minimum 0.00)
                if ($total < 0) {
                    $total = 0.00;
                }
                
                // Format total to 2 decimal places
                $formattedTotal = number_format($total, 2, '.', '');
                
                // Prepare summary data for response
                $summaryData = array(
                    'subtotal' => $formattedSubtotal, // Subtotal formatted to 2 decimal places
                    'coupon_discount' => $formattedCouponDiscount, // Coupon discount formatted to 2 decimal places
                    'total' => $formattedTotal, // Total amount formatted to 2 decimal places
                );
                
                // Return success response with checkout summary
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Checkout summary retrieved successfully',
                        'event_id' => $eventId, // Event ID
                        'cart_items' => $formattedCartItems, // Array of formatted cart items for this event
                        'summary' => $summaryData, // Summary with subtotal, service fee, coupon discount, and total
                        'coupon' => $couponData, // Coupon information if applied, null otherwise
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in CartController::getCheckoutSummary');
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
     * Empty cart - removes all items from End User's shopping cart
     * 
     * This method deletes all cart items for the authenticated user.
     * Used when user wants to replace existing cart items with tickets from a different event.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function emptyCart(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        try {
            // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
            $user = $request->user();
            
            // Initialize CartModel to perform database operations
            $cartModel = new CartModel();
            
            // Prepare query condition to find all cart items for authenticated user
            $cartQueryCondition = array('user_id' => $user->user_id);
            
            // Begin database transaction to ensure data consistency
            DB::beginTransaction();
            
            try {
                // Delete all cart items for authenticated user
                $cartModel->delete_cart($cartQueryCondition);
                
                // Commit transaction if operation succeeds
                DB::commit();
            } catch (\Exception $e) {
                // Rollback transaction on any error to maintain data integrity
                DB::rollBack();
                throw $e; // Re-throw exception to outer catch block
            }
            
            // Return success response
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Cart emptied successfully'
                )
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in CartController::emptyCart');
            Log::info($e->getMessage());
            Log::info($e);
            
            // Return error response to the client
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while emptying the cart'
                )
            );
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }
}