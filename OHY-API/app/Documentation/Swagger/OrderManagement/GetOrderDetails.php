<?php

namespace App\Documentation\Swagger\OrderManagement;

/**
 * @OA\Get(
 *     path="/v1/get_order_details",
 *     summary="Get Order Details",
 *     description="Retrieves complete detailed information for a specific order including order information, complete event details with all relationships (category, media, venue, artists, social media, terms), order tickets, payment information, billing address, and applied coupon. This endpoint verifies that the order belongs to the authenticated user before returning details. Protected route - requires authentication via Laravel Sanctum token.
 * 
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates required query parameter (order_id: required|integer|min:1)
 * 3. Database query: Queries orders table with extensive eager loading of all relationships:
 *    - orderTickets: Order tickets relationship
 *    - orderTickets.ticket: Ticket relationship
 *    - orderTickets.ticket.ticketCategory: Ticket category relationship
 *    - orderTickets.ticket.event: Event relationship
 *    - orderTickets.ticket.event.venue: Venue relationship
 *    - orderTickets.ticket.event.media: Event media relationship
 *    - orderTickets.ticket.event.artists: Event artists relationship
 *    - orderTickets.ticket.event.artists.socialMedia: Artist social media relationship
 *    - orderTickets.ticket.event.termsConditions: Event terms and conditions relationship
 *    - orderTickets.ticket.event.socialMedia: Event social media relationship
 *    - orderTickets.ticket.event.eventCategory: Event category relationship
 *    - country: Billing country relationship
 *    - coupon: Applied coupon relationship (if any)
 *    - Filters by order_id and user_id (security: ensures order belongs to authenticated user)
 * 4. Order ownership verification: If order not found or doesn't belong to authenticated user, returns 404 error (E404) - 'Order not found'
 * 5. Event status calculation: If order has tickets and event information:
 *    - Gets event from first order ticket (all tickets in an order belong to same event)
 *    - Calculates event status based on current datetime and event dates/times:
 *      - Combines start_date and start_time to create start datetime
 *      - Combines end_date and end_time to create end datetime
 *      - Compares current datetime with start and end datetimes:
 *        - Live: If current datetime >= start datetime AND current datetime <= end datetime
 *        - Upcoming: If current datetime < start datetime
 *        - Completed: If current datetime > end datetime
 * 6. Order info formatting: Formats order information with:
 *    - order_id, order_number, order_date, order_status
 *    - Financial breakdown: subtotal, coupon_discount, total_amount (all formatted to 2 decimal places)
 * 7. Event details formatting (if event exists):
 *    - Category data: event_category_id, category_name (or null)
 *    - Media data: Grouped by type (thumbnail, banner, flyers array, videos array with video_duration)
 *    - Venue data: Complete venue information including latitude, longitude, additional_details, maximum_attendees, venue_image
 *    - Artists data: Array of artists with artist_name, artist_image, social_media links array
 *    - Social media data: Array of event social media links (platform, url)
 *    - Terms and conditions: terms_content (rich text, or null)
 *    - Event basic info: event_id, event_title, description, key_highlights, dates, times, event_status
 * 8. Order tickets formatting: Formats each order ticket with:
 *    - order_ticket_id, ticket_id, ticket_category, ticket_type, quantity
 *    - unit_price, total_price (both formatted to 2 decimal places)
 * 9. Payment info formatting: Formats payment/contact information:
 *    - full_name, email, phone_number
 * 10. Billing address formatting: Formats billing address with:
 *     - street_address, city, state, zip_code
 *     - country: country_id, name (or null)
 * 11. Coupon info formatting (if coupon applied): Formats coupon information with:
 *     - coupon_id, coupon_code, discount_type
 *     - discount_percent (if percentage type), flat_discount_amount (if flat type)
 *     - discount_amount: Applied discount amount formatted to 2 decimal places
 * 12. Response: Returns success response with complete order object containing all nested data
 *
 * **Business Logic:**
 * - Order ownership: Only orders belonging to authenticated user are accessible
 * - Event status calculation: Based on current datetime compared to event start/end datetimes
 * - All tickets in order: All tickets in an order belong to the same event (accessed via first order ticket)
 *
 * **Data Transformations:**
 * - Price formatting: All prices formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Date/time handling: Event dates and times returned as-is from database (not formatted)
 * - Event status: Calculated dynamically based on current datetime
 * - Media grouping: Media files grouped by type (thumbnail, banner, flyers, videos)
 *
 * **Response Structure:**
 * - order_info: Order information object with financial breakdown
 * - event: Complete event object with all relationships (category, media, venue, artists, social media, terms) or null
 * - order_tickets: Array of order ticket objects with ticket details
 * - payment_info: Payment/contact information object
 * - billing_address: Billing address object with country
 * - coupon: Coupon information object (if applied) or null
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if order_id validation fails
 * - Order Not Found (404): Returns E404 error code if order_id does not exist or doesn't belong to authenticated user
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Only orders belonging to authenticated user are accessible (filtered by user_id from token)
 * - Ownership validation: Users can only view their own order details",
 *     tags={"End User - Order Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\Parameter(
 *         name="order_id",
 *         in="query",
 *         required=true,
 *         description="Order ID to retrieve details for. Must be an integer, minimum 1, and must belong to the authenticated user. Validation rule: 'required|integer|min:1'",
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Success - Order details retrieved successfully",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Order details retrieved successfully"),
 *                 @OA\Property(
 *                     property="order",
 *                     type="object",
 *                     description="Complete order information with all nested relationships",
 *                     @OA\Property(
 *                         property="order_info",
 *                         type="object",
 *                         description="Order information with financial breakdown",
 *                         @OA\Property(property="order_id", type="integer", description="Order ID", example=1),
 *                         @OA\Property(property="order_number", type="string", description="Order number", example="OHY1763043605664592"),
 *                         @OA\Property(property="order_date", type="string", description="Order creation date", example="2025-12-15"),
 *                         @OA\Property(property="order_status", type="string", description="Order status", example="completed"),
 *                         @OA\Property(property="subtotal", type="string", description="Subtotal formatted to 2 decimal places", example="500.00"),
 *                         @OA\Property(property="coupon_discount", type="string", description="Coupon discount formatted to 2 decimal places (0.00 if null)", example="100.00"),
 *                         @OA\Property(property="total_amount", type="string", description="Total amount formatted to 2 decimal places", example="400.00")
 *                     ),
 *                     @OA\Property(
 *                         property="event",
 *                         type="object",
 *                         nullable=true,
 *                         description="Complete event details with all relationships (null if event not available)",
 *                         @OA\Property(property="event_id", type="integer", description="Event ID", example=1),
 *                         @OA\Property(property="event_title", type="string", description="Event title", example="Music Festival 2025"),
 *                         @OA\Property(property="description", type="string", description="Event description (rich text)", example="A spectacular music festival..."),
 *                         @OA\Property(property="key_highlights", type="string", nullable=true, description="Key highlights (rich text)", example="• Top artists\n• Multiple stages"),
 *                         @OA\Property(
 *                             property="category",
 *                             type="object",
 *                             nullable=true,
 *                             description="Event category (null if not assigned)",
 *                             @OA\Property(property="event_category_id", type="integer", example=1),
 *                             @OA\Property(property="category_name", type="string", example="Music")
 *                         ),
 *                         @OA\Property(property="start_date", type="string", description="Event start date (as-is from database)", example="2025-12-15"),
 *                         @OA\Property(property="end_date", type="string", description="Event end date (as-is from database)", example="2025-12-15"),
 *                         @OA\Property(property="start_time", type="string", description="Event start time (as-is from database)", example="09:00:00"),
 *                         @OA\Property(property="end_time", type="string", description="Event end time (as-is from database)", example="18:00:00"),
 *                         @OA\Property(property="event_status", type="string", description="Event status ('Live', 'Upcoming', or 'Completed')", example="Upcoming"),
 *                         @OA\Property(
 *                             property="media",
 *                             type="object",
 *                             description="Event media grouped by type",
 *                             @OA\Property(property="thumbnail", type="object", nullable=true, description="Thumbnail media (single)"),
 *                             @OA\Property(property="banner", type="object", nullable=true, description="Banner media (single)"),
 *                             @OA\Property(property="flyers", type="array", description="Flyer media (multiple)", @OA\Items(type="object")),
 *                             @OA\Property(property="videos", type="array", description="Video media (multiple)", @OA\Items(type="object"))
 *                         ),
 *                         @OA\Property(
 *                             property="venue",
 *                             type="object",
 *                             nullable=true,
 *                             description="Venue information (null if no venue)",
 *                             @OA\Property(property="venue_id", type="integer", example=1),
 *                             @OA\Property(property="venue_name", type="string", example="Madison Square Garden"),
 *                             @OA\Property(property="venue_address", type="string", example="4 Pennsylvania Plaza"),
 *                             @OA\Property(property="city", type="string", example="New York"),
 *                             @OA\Property(property="state_province", type="string", example="NY"),
 *                             @OA\Property(property="postal_code", type="string", example="10001"),
 *                             @OA\Property(property="latitude", type="string", description="Latitude for map", example="40.7505"),
 *                             @OA\Property(property="longitude", type="string", description="Longitude for map", example="-73.9934"),
 *                             @OA\Property(property="additional_details", type="string", nullable=true, description="Additional venue details", example="Room 101"),
 *                             @OA\Property(property="maximum_attendees", type="integer", description="Maximum attendees", example=1000),
 *                             @OA\Property(property="venue_image", type="string", nullable=true, description="Venue image path", example="venues/1/venue_image.jpg")
 *                         ),
 *                         @OA\Property(
 *                             property="artists",
 *                             type="array",
 *                             description="Event artists/speakers",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_artist_id", type="integer", example=1),
 *                                 @OA\Property(property="artist_name", type="string", example="John Doe"),
 *                                 @OA\Property(property="artist_image", type="string", nullable=true, example="artists/1/artist.jpg"),
 *                                 @OA\Property(
 *                                     property="social_media",
 *                                     type="array",
 *                                     description="Artist social media links",
 *                                     @OA\Items(
 *                                         type="object",
 *                                         @OA\Property(property="platform", type="string", example="instagram"),
 *                                         @OA\Property(property="url", type="string", example="https://instagram.com/johndoe")
 *                                     )
 *                                 )
 *                             )
 *                         ),
 *                         @OA\Property(
 *                             property="social_media",
 *                             type="array",
 *                             description="Event social media links",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="platform", type="string", example="facebook"),
 *                                 @OA\Property(property="url", type="string", example="https://facebook.com/event")
 *                             )
 *                         ),
 *                         @OA\Property(
 *                             property="terms_conditions",
 *                             type="object",
 *                             nullable=true,
 *                             description="Terms and conditions (null if not available)",
 *                             @OA\Property(property="terms_content", type="string", description="Terms content (rich text)", example="Terms and conditions text...")
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="order_tickets",
 *                         type="array",
 *                         description="Array of order tickets purchased",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="order_ticket_id", type="integer", description="Order ticket ID", example=1),
 *                             @OA\Property(property="ticket_id", type="integer", description="Ticket ID", example=1),
 *                             @OA\Property(property="ticket_category", type="string", nullable=true, description="Ticket category name", example="Early Bird"),
 *                             @OA\Property(property="ticket_type", type="string", nullable=true, description="Ticket type", example="single_entry"),
 *                             @OA\Property(property="quantity", type="integer", description="Quantity purchased", example=2),
 *                             @OA\Property(property="unit_price", type="string", description="Unit price formatted to 2 decimal places", example="150.00"),
 *                             @OA\Property(property="total_price", type="string", description="Total price formatted to 2 decimal places", example="300.00")
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="payment_info",
 *                         type="object",
 *                         description="Payment/contact information",
 *                         @OA\Property(property="full_name", type="string", description="Purchaser's full name", example="John Doe"),
 *                         @OA\Property(property="email", type="string", description="Purchaser's email", example="john.doe@example.com"),
 *                         @OA\Property(property="phone_number", type="string", description="Purchaser's phone number", example="+1234567890")
 *                     ),
 *                     @OA\Property(
 *                         property="billing_address",
 *                         type="object",
 *                         description="Billing address",
 *                         @OA\Property(property="street_address", type="string", description="Street address", example="123 Main Street"),
 *                         @OA\Property(property="city", type="string", description="City", example="New York"),
 *                         @OA\Property(property="state", type="string", description="State/Province", example="NY"),
 *                         @OA\Property(property="zip_code", type="string", description="ZIP/Postal code", example="10001"),
 *                         @OA\Property(
 *                             property="country",
 *                             type="object",
 *                             nullable=true,
 *                             description="Country information (null if not available)",
 *                             @OA\Property(property="country_id", type="integer", example=1),
 *                             @OA\Property(property="name", type="string", example="United States")
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="coupon",
 *                         type="object",
 *                         nullable=true,
 *                         description="Coupon information if applied (null if no coupon)",
 *                         @OA\Property(property="coupon_id", type="integer", description="Coupon ID", example=1),
 *                         @OA\Property(property="coupon_code", type="string", description="Coupon code", example="EARLY20"),
 *                         @OA\Property(property="discount_type", type="string", description="Discount type ('percentage' or 'flat')", example="percentage"),
 *                         @OA\Property(property="discount_percent", type="string", nullable=true, description="Discount percentage formatted to 2 decimal places (null if flat type)", example="20.00"),
 *                         @OA\Property(property="flat_discount_amount", type="string", nullable=true, description="Flat discount amount formatted to 2 decimal places (null if percentage type)", example=null),
 *                         @OA\Property(property="discount_amount", type="string", description="Applied discount amount formatted to 2 decimal places", example="100.00")
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Bad Request - Validation error",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     description="Validation errors object",
 *                     example={"order_id": {"The order id field is required."}}
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Not Found - Order not found or doesn't belong to user",
 *         @OA\JsonContent(
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", example="Order not found")
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving order details")
 *             )
 *         )
 *     )
 * )
 */
class GetOrderDetails
{
    // Empty class - annotations are in docblock
}

