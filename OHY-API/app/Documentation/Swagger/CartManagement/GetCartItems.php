<?php

namespace App\Documentation\Swagger\CartManagement;

/**
 * @OA\Get(
 *     path="/v1/get_cart_items",
 *     summary="Get Cart Items",
 *     description="Retrieves all items in the authenticated End User's shopping cart with complete event and ticket details, including event thumbnail, venue information, and calculated subtotal. This endpoint returns all cart items for the authenticated user with nested event data, venue details, and formatted pricing. Protected route - requires authentication via Laravel Sanctum token.
 *
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. User retrieval: Gets authenticated user from request (set by middleware)
 * 3. Database query: Queries carts table for all cart items belonging to authenticated user (user_id) with eager loading of relationships:
 *    - ticket: Ticket relationship
 *    - ticket.ticketCategory: Ticket category relationship
 *    - ticket.event: Event relationship
 *    - ticket.event.venue: Venue relationship
 *    - ticket.event.media: Event media relationship (filtered to get only thumbnail, limit 1)
 * 4. Data formatting loop: Iterates through each cart item to format data:
 *    - Extracts event thumbnail: Gets first thumbnail media file path from event.media collection (if available)
 *    - Calculates total item price: quantity × ticket price (stored as float for calculation)
 *    - Formats venue data: Creates venue object with venue_name, city, state_province, venue_address (or null if no venue)
 *    - Formats event data: Creates event object with event_id, event_title, start_date, end_date, start_time, end_time, thumbnail, venue
 *    - Formats cart item data: Creates cart item object with cart_id, ticket_id, quantity, item_price (formatted to 2 decimals), total_item_price (formatted to 2 decimals), ticket_type, ticket_category, event (nested object)
 *    - Accumulates subtotal: Adds total_item_price to subtotal accumulator
 * 5. Subtotal calculation: Sums all total_item_price values from all cart items
 * 6. Price formatting: Formats subtotal to 2 decimal places using number_format()
 * 7. Response: Returns success response with cart_items array and subtotal
 *
 * **Data Retrieval:**
 * - Eager loading: All relationships loaded in single query to prevent N+1 queries
 * - Media filtering: Only thumbnail media loaded (media_type = 'thumbnail', limit 1)
 * - Data integrity: Skips cart items if ticket or event is missing (data integrity issue)
 *
 * **Data Transformations:**
 * - Price formatting: All prices formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Date/time formatting: Dates and times returned as-is from database (NOT formatted, returned in database format)
 * - Subtotal calculation: Sum of all total_item_price values from all cart items
 * - Total item price: Calculated as quantity × ticket price for each cart item
 *
 * **Response Structure:**
 * - cart_items: Array of cart item objects, each containing:
 *   - cart_id: Cart item ID
 *   - ticket_id: Ticket ID
 *   - quantity: Quantity in cart
 *   - item_price: Price per ticket formatted to 2 decimal places
 *   - total_item_price: Total price for this line item (quantity × price) formatted to 2 decimal places
 *   - ticket_type: Ticket type (single_entry or table_ticket)
 *   - ticket_category: Ticket category name (e.g., 'Early Bird', 'Regular', 'VIP') or null
 *   - event: Nested event object containing:
 *     - event_id: Event ID
 *     - event_title: Event name/title
 *     - start_date: Event start date (as-is from database, not formatted)
 *     - end_date: Event end date (as-is from database, not formatted)
 *     - start_time: Event start time (as-is from database, not formatted)
 *     - end_time: Event end time (as-is from database, not formatted)
 *     - thumbnail: Event thumbnail image path (if available) or null
 *     - venue: Nested venue object containing:
 *       - venue_name: Venue name
 *       - city: City name
 *       - state_province: State or Province
 *       - venue_address: Full street address
 * - subtotal: Total subtotal formatted to 2 decimal places (sum of all total_item_price values)
 *
 * **Error Scenarios:**
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Only cart items belonging to authenticated user are returned (filtered by user_id from token)
 * - Ownership validation: Users can only view their own cart items",
 *     tags={"End User - Cart Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Response(
 *         response=200,
 *         description="Success - Cart items retrieved successfully",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Cart items retrieved successfully"),
 *                 @OA\Property(
 *                     property="cart_items",
 *                     type="array",
 *                     description="Array of cart items with complete event and ticket details",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="cart_id", type="integer", description="Cart item ID", example=1),
 *                         @OA\Property(property="ticket_id", type="integer", description="Ticket ID", example=1),
 *                         @OA\Property(property="quantity", type="integer", description="Quantity in cart", example=2),
 *                         @OA\Property(property="item_price", type="string", description="Item price per ticket formatted to 2 decimal places", example="150.00"),
 *                         @OA\Property(property="total_item_price", type="string", description="Total item price (quantity × price) formatted to 2 decimal places", example="300.00"),
 *                         @OA\Property(property="ticket_type", type="string", description="Ticket type (single_entry or table_ticket)", example="single_entry"),
 *                         @OA\Property(property="ticket_category", type="string", nullable=true, description="Ticket category name (e.g., 'Early Bird', 'Regular', 'VIP')", example="Early Bird"),
 *                         @OA\Property(
 *                             property="event",
 *                             type="object",
 *                             description="Event details nested object",
 *                             @OA\Property(property="event_id", type="integer", description="Event ID", example=1),
 *                             @OA\Property(property="event_title", type="string", description="Event name/title", example="Music Festival 2025"),
 *                             @OA\Property(property="start_date", type="string", description="Event start date (as-is from database, not formatted)", example="2025-12-15"),
 *                             @OA\Property(property="end_date", type="string", description="Event end date (as-is from database, not formatted)", example="2025-12-15"),
 *                             @OA\Property(property="start_time", type="string", description="Event start time (as-is from database, not formatted)", example="09:00:00"),
 *                             @OA\Property(property="end_time", type="string", description="Event end time (as-is from database, not formatted)", example="18:00:00"),
 *                             @OA\Property(property="thumbnail", type="string", nullable=true, description="Event thumbnail image path (if available)", example="events/1/thumbnail/image.jpg"),
 *                             @OA\Property(
 *                                 property="venue",
 *                                 type="object",
 *                                 nullable=true,
 *                                 description="Venue details nested object (null if no venue)",
 *                                 @OA\Property(property="venue_name", type="string", description="Venue name", example="Madison Square Garden"),
 *                                 @OA\Property(property="city", type="string", description="City name", example="New York"),
 *                                 @OA\Property(property="state_province", type="string", description="State or Province", example="NY"),
 *                                 @OA\Property(property="venue_address", type="string", description="Full street address", example="4 Pennsylvania Plaza")
 *                             )
 *                         )
 *                     )
 *                 ),
 *                 @OA\Property(property="subtotal", type="string", description="Total subtotal formatted to 2 decimal places (sum of all total_item_price values)", example="450.00")
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
class GetCartItems
{
    // Empty class - annotations are in docblock
}
