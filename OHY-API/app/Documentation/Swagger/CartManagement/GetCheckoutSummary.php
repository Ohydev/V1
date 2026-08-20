<?php

namespace App\Documentation\Swagger\CartManagement;

/**
 * @OA\Get(
 *     path="/v1/get_checkout_summary",
 *     summary="Get Checkout Summary",
 *     description="Retrieves complete checkout summary for a specific event including all cart items, calculated subtotal, optional coupon discount, service fee, and total amount. This endpoint retrieves all cart items for the authenticated user that belong to tickets of the specified event, calculates subtotal, optionally validates and applies coupon discount if coupon_id is provided, and returns complete checkout summary. Protected route - requires authentication via Laravel Sanctum token.
 *
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates query parameters (event_id: required|integer|min:1, coupon_id: nullable|integer|min:1)
 * 3. Cart items retrieval: Queries carts table for authenticated user's cart items that belong to tickets of the specified event:
 *    - Uses whereHas to filter cart items where ticket.event_id = event_id
 *    - Eager loads ticket and ticketCategory relationships to prevent N+1 queries
 *    - Filters by user_id to ensure only authenticated user's cart items are retrieved
 * 4. Cart items existence check: If no cart items found for this event, returns 404 error (E404) - 'No cart items found for this event'
 * 5. Subtotal calculation: Loops through each cart item:
 *    - Calculates total_item_price: quantity × ticket price
 *    - Adds total_item_price to subtotal accumulator
 *    - Formats cart item data: cart_id, ticket_id, quantity, ticket_type, ticket_category, item_price (formatted to 2 decimals), total_item_price (formatted to 2 decimals)
 * 6. Coupon validation (if coupon_id is provided):
 *    - Coupon existence check: Queries coupons table by coupon_id. If coupon not found, returns 404 error (E404)
 *    - Event validation: Verifies coupon belongs to specified event (coupon.event_id == event_id). If not, returns business logic error (E004) - 'Coupon does not belong to this event'
 *    - Date range validation: Gets current date in Y-m-d format, checks if current date is within validity period:
 *      - If end_date exists: current_date >= start_date AND current_date <= end_date
 *      - If end_date is null: current_date >= start_date
 *      - If date validation fails, returns business logic error (E004) - 'Coupon has expired'
 *    - Usage limit validation: Checks if times_used < max_times_applicable. If limit exceeded, returns business logic error (E004) - 'Coupon usage limit exceeded'
 *    - Discount calculation: Calculates discount amount based on discount type:
 *      - Percentage discount: discount = subtotal × (discount_percent / 100), capped at max_cap_discount if set
 *      - Flat discount: discount = flat_discount_amount
 *    - Discount display formatting: Formats discount display string ('XX% OFF' for percentage, '$XX.XX OFF' for flat)
 *    - Coupon data preparation: Creates coupon object with coupon_id, coupon_code, discount_display, discount_amount
 * 7. Total calculation: Calculates total as: total = subtotal - coupon_discount (platform fee NOT added)
 *    - Ensures total doesn't go negative (minimum 0.00)
 * 8. Price formatting: Formats all amounts to 2 decimal places using number_format():
 *    - subtotal: Formatted to 2 decimal places
 *    - coupon_discount: Formatted to 2 decimal places (0.00 if no coupon)
 *    - total: Formatted to 2 decimal places
 * 9. Response: Returns success response with checkout summary containing:
 *     - event_id: Event ID for reference
 *     - cart_items: Array of formatted cart items
 *     - summary: Object with subtotal, coupon_discount, total
 *     - coupon: Coupon object if applied, null otherwise
 *
 * **Business Logic:**
 * - Cart items filtering: Only cart items for tickets belonging to specified event are included
 * - Subtotal calculation: Sum of all total_item_price values from cart items for the event
 * - Coupon validation: Only performed if coupon_id is provided
 * - Total calculation: subtotal - coupon_discount (platform fee NOT added, ensured minimum 0.00)
 * - Coupon event validation: Coupon must belong to the specified event
 *
 * **Data Transformations:**
 * - Price formatting: All prices formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Discount display: Percentage discounts formatted as 'XX% OFF' (0 decimal places), flat discounts as '$XX.XX OFF' (2 decimal places)
 * - Total calculation: Ensured minimum 0.00 (prevents negative totals)
 *
 * **Response Structure:**
 * - event_id: Event ID for reference
 * - cart_items: Array of cart item objects, each containing:
 *   - cart_id: Cart item ID
 *   - ticket_id: Ticket ID
 *   - quantity: Quantity in cart
 *   - ticket_type: Ticket type (single_entry or table_ticket)
 *   - ticket_category: Ticket category name (e.g., 'Early Bird', 'Regular', 'VIP') or null
 *   - item_price: Item price per ticket formatted to 2 decimal places
 *   - total_item_price: Total item price (quantity × price) formatted to 2 decimal places
 * - summary: Object containing:
 *   - subtotal: Subtotal formatted to 2 decimal places
 *   - coupon_discount: Coupon discount formatted to 2 decimal places (0.00 if no coupon)
 *   - total: Total amount formatted to 2 decimal places
 * - coupon: Coupon object if applied (null otherwise), containing:
 *   - coupon_id: Coupon ID
 *   - coupon_code: Coupon code (e.g., 'EARLY20')
 *   - discount_display: Formatted discount display string (e.g., '20% OFF' or '$50.00 OFF')
 *   - discount_amount: Calculated discount amount formatted to 2 decimal places
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if event_id or coupon_id validation fails
 * - No Cart Items (404): Returns E404 error code if no cart items found for the specified event
 * - Coupon Not Found (404): Returns E404 error code if coupon_id is provided but coupon does not exist
 * - Business Logic Error (400): Returns E004 error code for:
 *   - Coupon does not belong to this event (coupon.event_id != event_id)
 *   - Coupon has expired (date range validation failed)
 *   - Coupon usage limit exceeded (times_used >= max_times_applicable)
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Only cart items belonging to authenticated user are retrieved (filtered by user_id from token)
 * - Ownership validation: Users can only view checkout summary for their own cart items",
 *     tags={"End User - Cart Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Parameter(
 *         name="event_id",
 *         in="query",
 *         required=true,
 *         description="Event ID to retrieve checkout summary for. Must be an integer, minimum 1. Only cart items for tickets belonging to this event will be included in the summary. Validation rule: 'required|integer|min:1'",
 *
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *
 *     @OA\Parameter(
 *         name="coupon_id",
 *         in="query",
 *         required=false,
 *         description="Optional coupon ID to apply to checkout summary. Must be an integer, minimum 1 if provided. If provided, coupon will be validated and discount will be calculated and included in summary. Coupon must belong to the specified event. Validation rule: 'nullable|integer|min:1'",
 *
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Success - Checkout summary retrieved successfully",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Checkout summary retrieved successfully"),
 *                 @OA\Property(property="event_id", type="integer", description="Event ID for reference", example=1),
 *                 @OA\Property(
 *                     property="cart_items",
 *                     type="array",
 *                     description="Array of formatted cart items for this event",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="cart_id", type="integer", description="Cart item ID", example=1),
 *                         @OA\Property(property="ticket_id", type="integer", description="Ticket ID", example=1),
 *                         @OA\Property(property="quantity", type="integer", description="Quantity in cart", example=2),
 *                         @OA\Property(property="ticket_type", type="string", description="Ticket type (single_entry or table_ticket)", example="single_entry"),
 *                         @OA\Property(property="ticket_category", type="string", nullable=true, description="Ticket category name (e.g., 'Early Bird', 'Regular', 'VIP')", example="Early Bird"),
 *                         @OA\Property(property="item_price", type="string", description="Item price per ticket formatted to 2 decimal places", example="150.00"),
 *                         @OA\Property(property="total_item_price", type="string", description="Total item price (quantity × price) formatted to 2 decimal places", example="300.00")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="summary",
 *                     type="object",
 *                     description="Checkout summary with financial breakdown",
 *                     @OA\Property(property="subtotal", type="string", description="Subtotal formatted to 2 decimal places (sum of all total_item_price values)", example="500.00"),
 *                     @OA\Property(property="coupon_discount", type="string", description="Coupon discount formatted to 2 decimal places (0.00 if no coupon applied)", example="100.00"),
 *                     @OA\Property(property="total", type="string", description="Total amount formatted to 2 decimal places (subtotal - coupon_discount, platform fee NOT added, minimum 0.00)", example="400.00")
 *                 ),
 *                 @OA\Property(
 *                     property="coupon",
 *                     type="object",
 *                     nullable=true,
 *                     description="Coupon information if applied (null if no coupon or coupon_id not provided)",
 *                     @OA\Property(property="coupon_id", type="integer", description="Coupon ID", example=1),
 *                     @OA\Property(property="coupon_code", type="string", description="Coupon code (e.g., 'EARLY20')", example="EARLY20"),
 *                     @OA\Property(property="discount_display", type="string", description="Formatted discount display string (e.g., '20% OFF' or '$50.00 OFF')", example="20% OFF"),
 *                     @OA\Property(property="discount_amount", type="string", description="Calculated discount amount formatted to 2 decimal places", example="100.00")
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Bad Request - Validation error or business logic error",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", description="Error code: E001 for validation errors, E004 for business logic errors", example="E001"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *
 *                         @OA\Schema(type="object", description="Validation errors object (E001)", example={"event_id": {"The event id field is required."}, "coupon_id": {"The coupon id must be an integer."}}),
 *                         @OA\Schema(type="string", description="Business logic error message (E004)", example="Coupon does not belong to this event")
 *                     }
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=404,
 *         description="Not Found - No cart items found for event or coupon not found",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", description="Either 'No cart items found for this event' or 'Coupon not found'", example="No cart items found for this event")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal Server Error",
 *
 *         @OA\JsonContent(
 *
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
class GetCheckoutSummary
{
    // Empty class - annotations are in docblock
}
