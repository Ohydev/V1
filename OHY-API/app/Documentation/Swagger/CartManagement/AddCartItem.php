<?php

namespace App\Documentation\Swagger\CartManagement;

/**
 * @OA\Post(
 *     path="/v1/add_cart_item",
 *     summary="Add Cart Item",
 *     description="Allows authenticated End Users to add tickets to their shopping cart. This endpoint handles adding tickets to cart with comprehensive validation for ticket availability, max per user limits, and automatically updates existing cart items if the same ticket is added again. Protected route - requires authentication via Laravel Sanctum token.
 * 
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates required fields (ticket_id: required|integer|min:1, quantity: required|integer|min:1)
 * 3. Ticket existence check: Queries tickets table by ticket_id with eager loading of event relationship. If ticket not found, returns 404 error (E404)
 * 4. Event published check: Validates that ticket's event is published (is_published = true, is_draft = false). If event is unpublished, returns business logic error (E004)
 * 5. Available tickets calculation: Calculates available tickets as total_available - sold_quantity from tickets table
 * 6. Existing cart item check: Queries carts table to check if cart item already exists for this user and ticket combination (user_id, ticket_id)
 * 7. Final quantity calculation: If cart item exists, calculates final quantity as current cart quantity + new quantity. If not exists, final quantity = new quantity
 * 8. Availability validation: Checks if final quantity exceeds available tickets. If insufficient, returns business logic error (E004) with remaining tickets count
 * 9. Max per user limit check: 
 *    - Queries orders table to get all order_ids for authenticated user
 *    - Queries order_tickets table to sum purchased quantity for this ticket from user's orders
 *    - Calculates total user quantity: existing purchases + current cart quantity + new quantity
 *    - Compares against ticket's max_per_user limit. If exceeded, returns business logic error (E004) with max limit
 * 10. Database transaction: Begins transaction to ensure data consistency
 *     - If cart item exists: Updates quantity to final quantity using update_cart_data method
 *     - If cart item doesn't exist: Creates new cart item with user_id, ticket_id, quantity using create_cart method
 *     - Eager loads ticket and ticketCategory relationships for response
 *     - Commits transaction if all operations succeed, rolls back on any error
 * 11. Response formatting: Formats cart item data with ticket details (ticket_id, ticket_type, price formatted to 2 decimal places, ticket_category)
 * 12. Response: Returns success response with cart_item object containing cart_id, ticket_id, quantity, and ticket_details nested object
 *
 * **Business Logic:**
 * - Ticket availability: Calculated as total_available - sold_quantity from tickets table
 * - Max per user enforcement: Includes existing purchases from orders + current cart quantity + new quantity being added
 * - Cart item update logic: If same ticket is added again, quantity is incremented (not creating duplicate entry)
 * - Event published requirement: Only tickets from published events can be added to cart
 *
 * **Database Operations:**
 * - Transaction: All database operations wrapped in transaction to ensure atomicity
 * - Eager loading: Ticket with event relationship loaded to check published status
 * - Relationship loading: After create/update, ticket and ticketCategory relationships loaded for response
 *
 * **Data Transformations:**
 * - Price formatting: All prices formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Quantity calculation: Final quantity = current cart quantity + new quantity (if cart item exists)
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if ticket_id or quantity validation fails
 * - Ticket Not Found (404): Returns E404 error code if ticket_id does not exist in tickets table
 * - Business Logic Error (400): Returns E004 error code for:
 *   - Ticket belongs to an unpublished event
 *   - Insufficient tickets available (with remaining count)
 *   - Maximum tickets per user limit exceeded (with max limit)
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Cart items are automatically linked to authenticated user (user_id from token)
 * - Ownership validation: Cart items can only be added by the authenticated user",
 *     tags={"End User - Cart Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         description="Request body containing ticket information to add to cart",
 *         @OA\JsonContent(
 *             required={"ticket_id", "quantity"},
 *             @OA\Property(
 *                 property="ticket_id",
 *                 type="integer",
 *                 description="Ticket ID to add to cart. Must be an integer and exist in the 'tickets' table. The ticket must belong to a published event (is_published = true, is_draft = false). Validation rule: 'required|integer|min:1'",
 *                 example=1
 *             ),
 *             @OA\Property(
 *                 property="quantity",
 *                 type="integer",
 *                 description="Number of tickets to add to cart. Must be an integer, minimum 1. If cart item already exists for this ticket, quantity will be added to existing quantity. Validation rule: 'required|integer|min:1'",
 *                 example=2
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Success - Ticket added to cart successfully",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Ticket added to cart successfully"),
 *                 @OA\Property(
 *                     property="cart_item",
 *                     type="object",
 *                     description="Cart item information with ticket details",
 *                     @OA\Property(property="cart_id", type="integer", description="Cart item ID", example=1),
 *                     @OA\Property(property="ticket_id", type="integer", description="Ticket ID", example=1),
 *                     @OA\Property(property="quantity", type="integer", description="Final quantity in cart (existing + new quantity if cart item existed)", example=3),
 *                     @OA\Property(
 *                         property="ticket_details",
 *                         type="object",
 *                         description="Ticket details nested object",
 *                         @OA\Property(property="ticket_id", type="integer", description="Ticket ID", example=1),
 *                         @OA\Property(property="ticket_type", type="string", description="Ticket type (single_entry or table_ticket)", example="single_entry"),
 *                         @OA\Property(property="price", type="string", description="Ticket price formatted to 2 decimal places", example="150.00"),
 *                         @OA\Property(property="ticket_category", type="string", nullable=true, description="Ticket category name (e.g., 'Early Bird', 'Regular', 'VIP')", example="Early Bird")
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
 *                         @OA\Schema(type="object", description="Validation errors object (E001)", example={"ticket_id": {"The ticket id field is required."}, "quantity": {"The quantity must be at least 1."}}),
 *                         @OA\Schema(type="string", description="Business logic error message (E004)", example="Ticket belongs to an unpublished event")
 *                     }
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Not Found - Ticket not found",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", example="Ticket not found")
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
class AddCartItem
{
    // Empty class - annotations are in docblock
}

