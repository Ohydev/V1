<?php

namespace App\Documentation\Swagger\CartManagement;

/**
 * @OA\Put(
 *     path="/v1/update_cart_item",
 *     summary="Update Cart Item",
 *     description="Allows authenticated End Users to update quantity of items in their shopping cart. This endpoint handles updating cart item quantity with comprehensive validation for ticket availability and max per user limits. If quantity is set to 0, the cart item will be automatically deleted. Protected route - requires authentication via Laravel Sanctum token.
 * 
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates required fields (cart_id: required|integer|min:1, quantity: required|integer|min:0)
 * 3. Cart item existence check: Queries carts table by cart_id and user_id to ensure cart item exists and belongs to authenticated user. If not found, returns 404 error (E404)
 * 4. Quantity = 0 handling (Delete path):
 *    - If quantity is 0, deletes the cart item using delete_cart method
 *    - Begins database transaction, deletes cart item, commits transaction
 *    - Returns success response with message only ('Cart item removed successfully')
 * 5. Quantity > 0 handling (Update path):
 *    - Gets ticket_id from cart item
 *    - Queries tickets table by ticket_id with eager loading of event relationship. If ticket not found, returns 404 error (E404)
 *    - Event published check: Validates that ticket's event is published (is_published = true, is_draft = false). If event is unpublished, returns business logic error (E004)
 *    - Available tickets calculation: Calculates available tickets as total_available - sold_quantity from tickets table
 *    - Availability validation: Checks if requested quantity exceeds available tickets. If insufficient, returns business logic error (E004) with remaining tickets count
 *    - Max per user limit check:
 *      - Queries orders table to get all order_ids for authenticated user
 *      - Queries order_tickets table to sum purchased quantity for this ticket from user's orders
 *      - Calculates total user quantity: existing purchases + new quantity (note: does NOT include current cart quantity since we're updating it)
 *      - Compares against ticket's max_per_user limit. If exceeded, returns business logic error (E004) with max limit
 *    - Database transaction: Begins transaction to ensure data consistency
 *      - Updates cart item quantity to new quantity using update_cart_data method
 *      - Commits transaction if operation succeeds, rolls back on any error
 *    - Response formatting: Refreshes cart item with eager loading of ticket and ticketCategory relationships, formats cart item data with ticket details
 * 6. Response: Returns success response with cart_item object (if quantity > 0) or message only (if quantity = 0)
 *
 * **Business Logic:**
 * - Quantity = 0: Cart item is deleted (not updated to 0)
 * - Ticket availability: Calculated as total_available - sold_quantity from tickets table
 * - Max per user enforcement: Includes existing purchases from orders + new quantity (current cart quantity is replaced, not added)
 * - Event published requirement: Only tickets from published events can be in cart
 *
 * **Database Operations:**
 * - Transaction: All database operations wrapped in transaction to ensure atomicity
 * - Eager loading: Ticket with event relationship loaded to check published status
 * - Relationship loading: After update, ticket and ticketCategory relationships loaded for response
 * - Deletion: Cart item deleted if quantity = 0 (not updated to 0)
 *
 * **Data Transformations:**
 * - Price formatting: All prices formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Quantity handling: If quantity = 0, item is deleted. If quantity > 0, quantity is updated to new value
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if cart_id or quantity validation fails
 * - Cart Item Not Found (404): Returns E404 error code if cart_id does not exist or does not belong to authenticated user
 * - Ticket Not Found (404): Returns E404 error code if ticket_id from cart item does not exist in tickets table
 * - Business Logic Error (400): Returns E004 error code for:
 *   - Ticket belongs to an unpublished event
 *   - Insufficient tickets available (with remaining count)
 *   - Maximum tickets per user limit exceeded (with max limit)
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Cart items can only be updated by the authenticated user who owns them
 * - Ownership validation: Cart item must belong to authenticated user (user_id from token) - enforced in query condition",
 *     tags={"End User - Cart Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         description="Request body containing cart item information to update",
 *         @OA\JsonContent(
 *             required={"cart_id", "quantity"},
 *             @OA\Property(
 *                 property="cart_id",
 *                 type="integer",
 *                 description="Cart item ID to update. Must be an integer, minimum 1, and must belong to the authenticated user. Validation rule: 'required|integer|min:1'",
 *                 example=1
 *             ),
 *             @OA\Property(
 *                 property="quantity",
 *                 type="integer",
 *                 description="New quantity for cart item. Must be an integer, minimum 0. If quantity is 0, the cart item will be deleted. If quantity > 0, the cart item quantity will be updated to this value. Validation rule: 'required|integer|min:0'",
 *                 example=3
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Success - Cart item updated or removed successfully",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 description="Response data - structure varies based on quantity value",
 *                 @OA\Property(
 *                     property="message",
 *                     type="string",
 *                     description="Success message. If quantity = 0: 'Cart item removed successfully'. If quantity > 0: 'Cart item updated successfully'",
 *                     example="Cart item updated successfully"
 *                 ),
 *                 @OA\Property(
 *                     property="cart_item",
 *                     type="object",
 *                     nullable=true,
 *                     description="Cart item information with ticket details. Only present if quantity > 0. If quantity = 0, this field is not included in response.",
 *                     @OA\Property(property="cart_id", type="integer", description="Cart item ID", example=1),
 *                     @OA\Property(property="ticket_id", type="integer", description="Ticket ID", example=1),
 *                     @OA\Property(property="quantity", type="integer", description="Updated quantity in cart", example=3),
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
 *                         @OA\Schema(type="object", description="Validation errors object (E001)", example={"cart_id": {"The cart id field is required."}, "quantity": {"The quantity must be at least 0."}}),
 *                         @OA\Schema(type="string", description="Business logic error message (E004)", example="Ticket belongs to an unpublished event")
 *                     }
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Not Found - Cart item not found or ticket not found",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", description="Either 'Cart item not found' or 'Ticket not found'", example="Cart item not found")
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
class UpdateCartItem
{
    // Empty class - annotations are in docblock
}

