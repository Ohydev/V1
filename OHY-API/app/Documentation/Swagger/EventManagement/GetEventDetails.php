<?php

namespace App\Documentation\Swagger\EventManagement;

/**
 * @OA\Get(
 *     path="/v1/get_event_details",
 *     summary="Get Event Details",
 *     description="Retrieves comprehensive details for a single event, optimized for performance using eager loading. This API returns all event information organized into header information, summary cards (registered count, revenue, ticket types, active coupons), event overview content (description, media, tickets, artists, terms & conditions), and sidebar details (event dates/times, venue, social media, active coupons). The API uses eager loading to load all relationships in a single query, significantly improving response time compared to lazy loading. This API is used in the Event View Details page to display complete event information.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id parameter (required, must exist in events table)
 * 3. Eager loading: Loads event with all relationships in a single optimized query
 * 4. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 5. Status calculation: Calculates event status dynamically based on dates and draft/published flags
 * 6. Summary cards calculation: Calculates registered count, revenue, ticket types count, active coupons count
 * 7. Event overview formatting: Formats description, media (grouped by type), tickets with revenue, artists with social media, terms
 * 8. Sidebar formatting: Formats event details (dates/times), venue with country, social media links, active coupons
 * 9. Active coupons filtering: Filters coupons by validity dates and usage limits
 * 10. Response formatting: Formats all data with proper date/time formatting (d-m-Y, H:i)
 * 11. Response: Returns comprehensive event details with all information
 *
 * **Performance Optimization:**
 * - Uses eager loading (with()) to load all relationships in a single query
 * - Relationships loaded: eventCategory, venue.country, media, socialMedia, tickets.ticketCategory, artists.socialMedia, termsConditions, coupons
 * - Prevents N+1 query problem by loading all related data upfront
 * - Significantly faster response time compared to lazy loading
 * - Single database query instead of multiple queries per relationship
 *
 * **Event Ownership:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - If event doesn't exist or doesn't belong to user, returns E404 error
 * - Ownership verification ensures users can only view their own events
 *
 * **Event Status Calculation:**
 * - Status is calculated dynamically based on current date/time
 * - **draft**: is_draft = true OR is_published = false
 * - **live**: Published AND current time between start and end
 * - **upcoming**: Published AND start time in future
 * - **completed**: Published AND end time has passed
 * - Status is included in header information
 *
 * **Summary Cards Calculation:**
 * - **Registered Count**: Sum of sold_quantity from all tickets
 * - **Revenue**: Sum of (sold_quantity * price) for all ticket types
 * - **Ticket Types**: Count of tickets for this event
 * - **Active Coupons**: Count of coupons that are valid (date range and usage limits)
 *
 * **Active Coupons Filtering:**
 * - Only active coupons are included in sidebar
 * - Active criteria:
 *   - start_date <= TODAY <= end_date (or end_date is null)
 *   - times_used < max_times_applicable
 * - Expired coupons, not-yet-started coupons, and fully-used coupons are excluded
 * - Discount display formatted: '20% OFF' for percentage, '$50.00 OFF' for flat
 *
 * **Revenue Calculation:**
 * - Revenue calculated per ticket type: sold_quantity * price
 * - Total revenue: Sum of all ticket type revenues
 * - Revenue included in summary cards and event overview
 *
 * **Media Grouping:**
 * - Media is grouped by type: thumbnail, banner, flyer, video
 * - Each type can have multiple files (except thumbnail and banner which are single)
 * - Video duration is included for video media types
 * - File paths are included for all media files
 *
 * **Date/Time Formatting:**
 * - Dates formatted as d-m-Y (e.g., '15-12-2025')
 * - Times formatted as H:i (e.g., '09:00')
 * - Created date formatted as d-m-Y
 * - Valid until date for coupons formatted as d-m-Y
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for invalid event_id or missing parameter
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\Parameter(
 *         name="event_id",
 *         in="query",
 *         required=true,
 *         description="Event ID to retrieve details for. Must exist in events table and belong to authenticated host user.",
 *         @OA\Schema(type="integer", example=1),
 *         example=1
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Event details retrieved successfully. Returns comprehensive event information organized into header, summary cards, event overview, and sidebar sections.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event details retrieved successfully"),
 *                 @OA\Property(
 *                     property="event_details",
 *                     type="object",
 *                     @OA\Property(
 *                         property="header",
 *                         type="object",
 *                         description="Header information with event title, status, category, and created date",
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="event_title", type="string", example="Tech Conference 2025"),
 *                         @OA\Property(property="status", type="string", description="Calculated event status: 'live', 'upcoming', 'completed', or 'draft'", example="live"),
 *                         @OA\Property(property="category_name", type="string", nullable=true, example="Technology"),
 *                         @OA\Property(property="created_date", type="string", format="date", description="Formatted as d-m-Y", example="01-12-2025"),
 *                         @OA\Property(property="is_hidden_by_admin", type="boolean", example=false, description="Flag indicating if event is hidden by super admin. Hidden events are excluded from public listings but remain visible to event hosts."),
 *                         @OA\Property(property="hidden_reason", type="string", nullable=true, example="Content violates platform guidelines", description="Reason for hiding the event (only present if is_hidden_by_admin is true)"),
 *                         @OA\Property(property="hidden_at", type="string", nullable=true, format="date-time", example="28-11-2025 14:30:00", description="Timestamp when the event was hidden (only present if is_hidden_by_admin is true), formatted as d-m-Y H:i:s")
 *                     ),
 *                     @OA\Property(
 *                         property="summary_cards",
 *                         type="object",
 *                         description="Summary cards metrics: registered count, revenue, ticket types, active coupons",
 *                         @OA\Property(property="registered_count", type="integer", example=25, description="Total number of registered attendees (sum of sold_quantity)"),
 *                         @OA\Property(property="revenue", type="number", format="float", example=35820.00, description="Total revenue from ticket sales"),
 *                         @OA\Property(property="ticket_types", type="integer", example=3, description="Number of ticket types created"),
 *                         @OA\Property(property="active_coupons", type="integer", example=2, description="Number of active coupons (valid date range and not fully used)")
 *                     ),
 *                     @OA\Property(
 *                         property="event_overview",
 *                         type="object",
 *                         description="Event overview content: description, media, tickets, artists, terms & conditions",
 *                         @OA\Property(property="description", type="string", description="Full description with rich text formatting", example="<p>Join us for an exciting tech conference...</p>"),
 *                         @OA\Property(property="key_highlights", type="string", nullable=true, description="What to expect section with bullet points", example="<ul><li>Keynote speakers</li></ul>"),
 *                         @OA\Property(
 *                             property="media",
 *                             type="object",
 *                             description="Media grouped by type",
 *                             @OA\Property(property="thumbnail", type="array", @OA\Items(type="object")),
 *                             @OA\Property(property="banner", type="array", @OA\Items(type="object")),
 *                             @OA\Property(property="flyer", type="array", @OA\Items(type="object")),
 *                             @OA\Property(property="video", type="array", @OA\Items(type="object"))
 *                         ),
 *                         @OA\Property(
 *                             property="tickets",
 *                             type="array",
 *                             description="Tickets array with category name, sold count, price, and revenue",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="ticket_id", type="integer", example=1),
 *                                 @OA\Property(property="category_name", type="string", nullable=true, example="Early Bird"),
 *                                 @OA\Property(property="description", type="string", nullable=true, example="Limited time offer"),
 *                                 @OA\Property(property="sold_quantity", type="integer", example=25),
 *                                 @OA\Property(property="total_available", type="integer", example=100),
 *                                 @OA\Property(property="price", type="string", example="199.00"),
 *                                 @OA\Property(property="revenue", type="string", example="4975.00", description="Revenue for this ticket type (sold_quantity * price)")
 *                             )
 *                         ),
 *                         @OA\Property(property="total_revenue", type="string", example="35820.00", description="Total revenue from all ticket types"),
 *                         @OA\Property(
 *                             property="artists",
 *                             type="array",
 *                             description="Artists array with social media links",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_artist_id", type="integer", example=1),
 *                                 @OA\Property(property="artist_name", type="string", example="John Doe"),
 *                                 @OA\Property(property="artist_image", type="string", nullable=true, example="artists/1/john_doe.jpg"),
 *                                 @OA\Property(
 *                                     property="social_media",
 *                                     type="array",
 *                                     @OA\Items(
 *                                         type="object",
 *                                         @OA\Property(property="artist_social_media_id", type="integer", example=1),
 *                                         @OA\Property(property="platform", type="string", example="instagram"),
 *                                         @OA\Property(property="url", type="string", example="https://instagram.com/@johndoe")
 *                                     )
 *                                 )
 *                             )
 *                         ),
 *                         @OA\Property(property="terms_conditions", type="string", nullable=true, description="Terms & conditions content with rich text formatting", example="<p>Terms and conditions content...</p>")
 *                     ),
 *                     @OA\Property(
 *                         property="sidebar",
 *                         type="object",
 *                         description="Sidebar content: event details, venue, social media, active coupons",
 *                         @OA\Property(
 *                             property="event_details",
 *                             type="object",
 *                             @OA\Property(property="start_date", type="string", format="date", description="Formatted as d-m-Y", example="15-12-2025"),
 *                             @OA\Property(property="start_time", type="string", format="time", description="Formatted as H:i", example="09:00"),
 *                             @OA\Property(property="end_date", type="string", format="date", description="Formatted as d-m-Y", example="16-12-2025"),
 *                             @OA\Property(property="end_time", type="string", format="time", description="Formatted as H:i", example="18:00")
 *                         ),
 *                         @OA\Property(
 *                             property="venue",
 *                             type="object",
 *                             nullable=true,
 *                             @OA\Property(property="venue_name", type="string", example="Madison Square Garden"),
 *                             @OA\Property(property="venue_address", type="string", example="4 Pennsylvania Plaza"),
 *                             @OA\Property(property="city", type="string", example="New York"),
 *                             @OA\Property(property="state_province", type="string", example="NY"),
 *                             @OA\Property(property="postal_code", type="string", example="10001"),
 *                             @OA\Property(property="country_name", type="string", nullable=true, example="United States"),
 *                             @OA\Property(property="latitude", type="number", format="float", example=40.7505),
 *                             @OA\Property(property="longitude", type="number", format="float", example=-73.9934)
 *                         ),
 *                         @OA\Property(
 *                             property="social_media",
 *                             type="array",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_social_media_id", type="integer", example=1),
 *                                 @OA\Property(property="platform", type="string", example="facebook"),
 *                                 @OA\Property(property="url", type="string", example="https://facebook.com/eventpage")
 *                             )
 *                         ),
 *                         @OA\Property(
 *                             property="active_coupons",
 *                             type="array",
 *                             description="Active coupons array (filtered by validity and usage)",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="coupon_id", type="integer", example=1),
 *                                 @OA\Property(property="coupon_code", type="string", example="EARLY20"),
 *                                 @OA\Property(property="discount_type", type="string", example="percentage"),
 *                                 @OA\Property(property="discount_display", type="string", example="20% OFF", description="Formatted discount display"),
 *                                 @OA\Property(property="times_used", type="integer", example=45),
 *                                 @OA\Property(property="max_times_applicable", type="integer", example=100),
 *                                 @OA\Property(property="valid_until", type="string", format="date", nullable=true, description="Formatted as d-m-Y", example="31-12-2025")
 *                             )
 *                         )
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. event_id is missing or invalid.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     description="Validation error messages object. Keys are field names, values are arrays of error messages for that field.",
 *                     @OA\Property(
 *                         property="event_id",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The event id field is required.", "The selected event id is invalid."}
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003). User authentication failed. Token is missing, invalid, or expired.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that user authentication failed or token is invalid/expired"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Not found error (E404). Event not found or user does not have permission to view it.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested resource (event) was not found or user doesn't have permission to access it"),
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to view it")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Server error (E002). An unexpected error occurred while retrieving event details.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving event details")
 *             )
 *         )
 *     )
 * )
 */
class GetEventDetails
{
    // Empty class for swagger-php to parse annotations
}

