<?php

namespace App\Documentation\Swagger\OrderManagement;

/**
 * @OA\Post(
 *     path="/v1/create_order",
 *     summary="Create Order",
 *     description="Allows authenticated End Users to complete ticket purchase and create order. This endpoint processes cart items for a specific event, validates ticket availability and max per user limits, optionally validates and applies coupon discount, encrypts payment details, creates order and order_tickets records, updates ticket sold_quantity atomically, updates coupon times_used atomically if coupon applied, and clears cart items for that event after successful order creation. Users can only proceed with one event at a time. All operations are wrapped in a database transaction to ensure data consistency. Protected route - requires authentication via Laravel Sanctum token.
 * 
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates all required fields with comprehensive validation rules:
 *    - event_id: required|integer|min:1
 *    - full_name: required|string|max:255
 *    - email: required|email|max:255
 *    - phone_number: required|string|max:255
 *    - card_number: required|string
 *    - expiry_date: required|string|regex:/^\d{2}\/\d{2}$/ (MM/YY format)
 *    - cvv: required|string|regex:/^\d{3,4}$/ (3 or 4 digits)
 *    - street_address: required|string|max:255
 *    - city: required|string|max:255
 *    - state: required|string|max:255
 *    - zip_code: required|string|max:255
 *    - country_id: required|integer|min:1
 *    - coupon_code: nullable|string|max:255 (optional)
 * 3. Cart items retrieval: Queries carts table for authenticated user's cart items that belong to tickets of the specified event:
 *    - Uses whereHas to filter cart items where ticket.event_id = event_id
 *    - Eager loads ticket, ticketCategory, and event relationships
 *    - Filters by user_id to ensure only authenticated user's cart items are retrieved
 * 4. Cart items existence check: If no cart items found for this event, returns 404 error (E404) - 'No cart items found for this event. Please add items to cart before checkout'
 * 5. Cart items validation loop: Iterates through each cart item to validate:
 *    - Ticket existence check: If ticket not found, returns 404 error (E404) - 'Ticket not found for cart item'
 *    - Event published check: Validates that ticket's event is published (is_published = true, is_draft = false). If unpublished, returns business logic error (E004) - 'Ticket belongs to an unpublished event'
 *    - Available tickets calculation: Calculates available tickets as total_available - sold_quantity
 *    - Availability validation: Checks if cart quantity exceeds available tickets. If insufficient, returns business logic error (E004) with ticket_id and remaining count
 *    - Max per user limit check:
 *      - Queries orders table to get all order_ids for authenticated user
 *      - Queries order_tickets table to sum purchased quantity for this ticket from user's orders
 *      - Calculates total user quantity: existing purchases + cart quantity
 *      - Compares against ticket's max_per_user limit. If exceeded, returns business logic error (E004) with ticket_id and max limit
 *    - Subtotal calculation: Calculates total_item_price (quantity × ticket price) and adds to subtotal accumulator
 *    - Stores validated cart item with ticket information for later use
 * 6. Optional coupon validation (if coupon_code is provided):
 *    - Coupon existence check: Queries coupons table by coupon_code. If coupon not found, returns 404 error (E404) - 'Coupon not found'
 *    - Event validation: Verifies coupon belongs to specified event (coupon.event_id == event_id). If not, returns business logic error (E004) - 'Coupon does not belong to this event'
 *    - Date range validation: Gets current date in Y-m-d format, checks if current date is within validity period:
 *      - If end_date exists: current_date >= start_date AND current_date <= end_date
 *      - If end_date is null: current_date >= start_date
 *      - If date validation fails, returns business logic error (E004) - 'Coupon has expired'
 *    - Usage limit validation: Checks if times_used < max_times_applicable. If limit exceeded, returns business logic error (E004) - 'Coupon usage limit exceeded'
 *    - Discount calculation: Calculates discount amount based on discount type:
 *      - Percentage discount: discount = subtotal × (discount_percent / 100), capped at max_cap_discount if set
 *      - Flat discount: discount = flat_discount_amount
 *    - Sets coupon_id for order
 * 7. Platform fee: Calculated on final customer amount (after coupon discount), deducted from host payout
 * 8. Total calculation: Calculates total as: total = subtotal - coupon_discount (platform fee NOT added)
 *    - Ensures total doesn't go negative (minimum 0.00)
 * 9. Order number generation: Generates unique order number using format: 'OHY' + timestamp + user_id + random(1000-9999)
 *    - Example: 'OHY1763043605664592'
 * 10. Payment details encryption: Encrypts sensitive payment information using Laravel Crypt facade:
 *     - card_number: Encrypted using Crypt::encrypt()
 *     - expiry_date: Encrypted using Crypt::encrypt() (MM/YY format)
 *     - cvv: Encrypted using Crypt::encrypt()
 *     - Stored encrypted in database (decryptable for future pre-fill)
 * 11. Order date: Gets current date in Y-m-d format for order_date field
 * 12. Database transaction: Begins transaction to ensure data consistency:
 *     - Creates order record in orders table with all fields (including encrypted payment details)
 *     - Gets order_id for creating order_tickets
 *     - Loops through validated cart items to create order_tickets records:
 *       - Creates order_ticket record with order_id, ticket_id, quantity, unit_price (price snapshot), total_price
 *       - Updates ticket sold_quantity atomically using increment() method to prevent over-selling
 *       - Formats order ticket data for response
 *     - Updates coupon times_used atomically using increment() if coupon was applied
 *     - Deletes cart items for this event only (whereHas ticket.event_id = event_id)
 *     - Commits transaction if all operations succeed, rolls back on any error
 * 13. Response formatting: Formats order data with order_id, order_number, order_date, financial breakdown (subtotal, coupon_discount, total_amount), and order_tickets array
 * 14. Response: Returns success response with order object containing complete order information
 *
 * **Business Logic:**
 * - Cart items filtering: Only cart items for tickets belonging to specified event are processed
 * - Subtotal calculation: Sum of all total_item_price values from validated cart items
 * - Coupon validation: Only performed if coupon_code is provided
 * - Platform fee: Calculated on final customer amount, deducted from host payout (not added to customer's bill)
 * - Total calculation: subtotal - coupon_discount (platform fee NOT added, ensured minimum 0.00)
 * - Coupon event validation: Coupon must belong to the specified event
 * - One event per order: Users can only checkout one event at a time
 *
 * **Database Operations:**
 * - Transaction: All database operations wrapped in transaction to ensure atomicity
 * - Atomic operations: increment() used for ticket sold_quantity and coupon times_used to prevent race conditions
 * - Price snapshots: unit_price stored in order_tickets to preserve price at time of purchase
 * - Cart cleanup: Cart items deleted only after successful order creation
 *
 * **Payment Security:**
 * - Encryption: Payment details (card_number, expiry_date, cvv) encrypted using Laravel Crypt facade
 * - Storage: Encrypted data stored in database (decryptable for future pre-fill)
 * - Security: Payment details not returned in response (security best practice)
 *
 * **Data Transformations:**
 * - Price formatting: All prices formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Price rounding: All financial amounts rounded to 2 decimal places before storage
 * - Order number: Generated using timestamp, user_id, and random number
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if any required field validation fails
 * - No Cart Items (404): Returns E404 error code if no cart items found for the specified event
 * - Ticket Not Found (404): Returns E404 error code if ticket not found for cart item
 * - Coupon Not Found (404): Returns E404 error code if coupon_code is provided but coupon does not exist
 * - Business Logic Error (400): Returns E004 error code for:
 *   - Ticket belongs to an unpublished event
 *   - Insufficient tickets available (with ticket_id and remaining count)
 *   - Maximum tickets per user limit exceeded (with ticket_id and max limit)
 *   - Coupon does not belong to this event
 *   - Coupon has expired
 *   - Coupon usage limit exceeded
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Only cart items belonging to authenticated user are processed (filtered by user_id from token)
 * - Payment encryption: All payment details encrypted before storage
 * - Ownership validation: Users can only create orders from their own cart items",
 *     tags={"End User - Order Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         description="Request body containing order information including contact details, payment information, billing address, and optional coupon code",
 *         @OA\JsonContent(
 *             required={"event_id", "full_name", "email", "phone_number", "card_number", "expiry_date", "cvv", "street_address", "city", "state", "zip_code", "country_id"},
 *             @OA\Property(
 *                 property="event_id",
 *                 type="integer",
 *                 description="Event ID to create order for. Must be an integer, minimum 1. Only cart items for tickets belonging to this event will be processed. Validation rule: 'required|integer|min:1'",
 *                 example=1
 *             ),
 *             @OA\Property(
 *                 property="full_name",
 *                 type="string",
 *                 description="Purchaser's full name. Required field, maximum 255 characters. Validation rule: 'required|string|max:255'",
 *                 example="John Doe"
 *             ),
 *             @OA\Property(
 *                 property="email",
 *                 type="string",
 *                 format="email",
 *                 description="Purchaser's email address. Required field, must be valid email format, maximum 255 characters. Validation rule: 'required|email|max:255'",
 *                 example="john.doe@example.com"
 *             ),
 *             @OA\Property(
 *                 property="phone_number",
 *                 type="string",
 *                 description="Purchaser's phone number. Required field, maximum 255 characters. Validation rule: 'required|string|max:255'",
 *                 example="+1234567890"
 *             ),
 *             @OA\Property(
 *                 property="card_number",
 *                 type="string",
 *                 description="Credit card number. Required field, must be string. This will be encrypted before storage using Laravel Crypt facade. Validation rule: 'required|string'",
 *                 example="4111111111111111"
 *             ),
 *             @OA\Property(
 *                 property="expiry_date",
 *                 type="string",
 *                 description="Card expiry date in MM/YY format. Required field, must match regex pattern /^\d{2}\/\d{2}$/. Example: '12/25' for December 2025. This will be encrypted before storage. Validation rule: 'required|string|regex:/^\d{2}\/\d{2}$/'",
 *                 example="12/25"
 *             ),
 *             @OA\Property(
 *                 property="cvv",
 *                 type="string",
 *                 description="Card CVV (Card Verification Value). Required field, must be 3 or 4 digits matching regex pattern /^\d{3,4}$/. This will be encrypted before storage. Validation rule: 'required|string|regex:/^\d{3,4}$/'",
 *                 example="123"
 *             ),
 *             @OA\Property(
 *                 property="street_address",
 *                 type="string",
 *                 description="Billing street address. Required field, maximum 255 characters. Validation rule: 'required|string|max:255'",
 *                 example="123 Main Street"
 *             ),
 *             @OA\Property(
 *                 property="city",
 *                 type="string",
 *                 description="Billing city. Required field, maximum 255 characters. Validation rule: 'required|string|max:255'",
 *                 example="New York"
 *             ),
 *             @OA\Property(
 *                 property="state",
 *                 type="string",
 *                 description="Billing state or province. Required field, maximum 255 characters. Validation rule: 'required|string|max:255'",
 *                 example="NY"
 *             ),
 *             @OA\Property(
 *                 property="zip_code",
 *                 type="string",
 *                 description="Billing ZIP or postal code. Required field, maximum 255 characters. Validation rule: 'required|string|max:255'",
 *                 example="10001"
 *             ),
 *             @OA\Property(
 *                 property="country_id",
 *                 type="integer",
 *                 description="Billing country ID. Required field, must be integer, minimum 1, and must exist in the 'countries' table. Validation rule: 'required|integer|min:1'",
 *                 example=1
 *             ),
 *             @OA\Property(
 *                 property="coupon_code",
 *                 type="string",
 *                 nullable=true,
 *                 description="Optional coupon code to apply to order. If provided, coupon will be validated and discount will be calculated and applied. Coupon must belong to the specified event. Maximum 255 characters. Validation rule: 'nullable|string|max:255'",
 *                 example="EARLY20"
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Success - Order created successfully",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Order created successfully"),
 *                 @OA\Property(
 *                     property="order",
 *                     type="object",
 *                     description="Order information with order tickets",
 *                     @OA\Property(property="order_id", type="integer", description="Order ID", example=1),
 *                     @OA\Property(property="order_number", type="string", description="Unique order number (format: 'OHY' + timestamp + user_id + random number)", example="OHY1763043605664592"),
 *                     @OA\Property(property="order_date", type="string", description="Order creation date (Y-m-d format)", example="2025-12-15"),
 *                     @OA\Property(property="subtotal", type="string", description="Subtotal formatted to 2 decimal places (sum of all ticket prices)", example="500.00"),
 *                     @OA\Property(property="coupon_discount", type="string", description="Coupon discount formatted to 2 decimal places (0.00 if no coupon applied)", example="100.00"),
 *                     @OA\Property(property="total_amount", type="string", description="Total amount formatted to 2 decimal places (subtotal - coupon_discount, platform fee NOT added)", example="400.00"),
 *                     @OA\Property(
 *                         property="order_tickets",
 *                         type="array",
 *                         description="Array of order tickets purchased",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="order_ticket_id", type="integer", description="Order ticket ID", example=1),
 *                             @OA\Property(property="ticket_id", type="integer", description="Ticket ID", example=1),
 *                             @OA\Property(property="ticket_type", type="string", description="Ticket type (single_entry or table_ticket)", example="single_entry"),
 *                             @OA\Property(property="ticket_category", type="string", nullable=true, description="Ticket category name (e.g., 'Early Bird', 'Regular', 'VIP')", example="Early Bird"),
 *                             @OA\Property(property="quantity", type="integer", description="Quantity purchased", example=2),
 *                             @OA\Property(property="unit_price", type="string", description="Unit price per ticket formatted to 2 decimal places (price snapshot at time of purchase)", example="150.00"),
 *                             @OA\Property(property="total_price", type="string", description="Total price for this line item formatted to 2 decimal places (quantity × unit_price)", example="300.00")
 *                         )
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Bad Request - Validation error or business logic error",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", description="Error code: E001 for validation errors, E004 for business logic errors", example="E001"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *                         @OA\Schema(type="object", description="Validation errors object (E001)", example={"event_id": {"The event id field is required."}, "expiry_date": {"The expiry date format is invalid."}}),
 *                         @OA\Schema(type="string", description="Business logic error message (E004)", example="Ticket belongs to an unpublished event")
 *                     }
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Not Found - No cart items, ticket not found, or coupon not found",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", description="Either 'No cart items found for this event. Please add items to cart before checkout', 'Ticket not found for cart item', or 'Coupon not found'", example="No cart items found for this event. Please add items to cart before checkout")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Internal Server Error",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while processing your request")
 *             )
 *         )
 *     )
 * )
 */
class CreateOrder
{
    // Empty class - annotations are in docblock
}

