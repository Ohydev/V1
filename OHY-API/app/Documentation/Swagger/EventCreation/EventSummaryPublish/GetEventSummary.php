<?php

namespace App\Documentation\Swagger\EventCreation\EventSummaryPublish;

/**
 * @OA\Get(
 *     path="/v1/get_event_summary",
 *     summary="Get Event Summary",
 *     description="Retrieves comprehensive event data from all 7 steps for display in the summary page (Step 7). This API aggregates data from all previous steps including event information, media, social links, tickets, venue, artists, terms & conditions, coupons, and calculates event data score. Only active coupons are included (filtered by validity dates and usage limits). Revenue is calculated per ticket type and aggregated as total revenue. Dates and times are formatted as d-m-Y and H:i respectively.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id parameter (required, must exist in events table)
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Data aggregation from all 7 steps:
 *    - **Step 1**: Event information, media (grouped by type), social media links
 *    - **Step 2**: Tickets with category information, pricing, availability, revenue
 *    - **Step 3**: Venue details with country name
 *    - **Step 4**: Artists with social media links
 *    - **Step 5**: Terms & conditions (null if not set)
 *    - **Step 6**: Active coupons (filtered by validity and usage)
 * 5. Event data score calculation: Calculates completion percentage based on 5 required sections
 * 6. Response formatting: Formats all data excluding timestamps, formats dates/times, calculates revenue
 * 7. Response: Returns comprehensive event summary with all aggregated data
 *
 * **Event Ownership:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - If event doesn't exist or doesn't belong to user, returns E404 error
 *
 * **Event Data Score Calculation:**
 * - Calculates completion percentage based on 5 required sections:
 *   1. Event Information (Step 1): title, description, category, dates, times
 *   2. Event Media (Step 1): at least thumbnail or banner
 *   3. Tickets (Step 2): at least one ticket created
 *   4. Venue (Step 3): venue record exists
 *   5. Terms & Conditions (Step 5): terms record exists
 * - Artists and coupons are optional, so they don't count toward score
 * - Percentage calculation: (completed_sections / total_sections) * 100
 * - Score labels: Excellent (81-100%), Good (61-80%), Fair (41-60%), Poor (0-40%)
 *
 * **Active Coupons Filtering:**
 * - Only active coupons are included in response
 * - Active criteria:
 *   - start_date <= TODAY <= end_date (or end_date is null)
 *   - times_used < max_times_applicable
 * - Expired coupons, not-yet-started coupons, and fully-used coupons are excluded
 *
 * **Revenue Calculation:**
 * - Revenue calculated per ticket type: sold_quantity * price
 * - Total revenue: Sum of all ticket type revenues
 * - Revenue returned as string format
 * - Available quantity calculated: total_available - sold_quantity
 *
 * **Date and Time Formatting:**
 * - Dates formatted as d-m-Y (e.g., '15-12-2025')
 * - Times formatted as H:i (e.g., '09:00') - hours and minutes only
 * - Coupon dates formatted as d-m-Y
 *
 * **Media Grouping:**
 * - Media grouped by type: thumbnail, banner, flyer, video
 * - Each media type is an array (can have multiple files for flyer and video)
 * - Video duration included for video media type
 *
 * **Response Structure:**
 * - event_information: Basic event data with formatted dates/times
 * - event_media: Grouped by type (thumbnail, banner, flyer, video)
 * - social_media: Array of social media links
 * - tickets: Array with category names, pricing, revenue per ticket type
 * - total_revenue: Aggregated total revenue from all tickets
 * - venue: Venue details with country name (null if not set)
 * - artists: Array of artists with nested social media links
 * - terms_conditions: Terms content (null if not set)
 * - coupons: Array of active coupons only
 * - event_data_score: Completion percentage, label, completed_sections, total_sections",
 *     tags={"Event Creation Management API - Event Summary & Publish Event API"},
 *     security={{"sanctum": {}}},
 *     @OA\Parameter(
 *         name="event_id",
 *         in="query",
 *         required=true,
 *         description="Event ID to retrieve summary for. Must exist in events table and belong to authenticated host user.",
 *         @OA\Schema(type="integer", example=1),
 *         example=1
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Event summary retrieved successfully. Returns comprehensive data from all 7 steps with event data score.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event summary retrieved successfully"),
 *                 @OA\Property(
 *                     property="event_summary",
 *                     type="object",
 *                     @OA\Property(
 *                         property="event_information",
 *                         type="object",
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="event_title", type="string", example="Summer Music Festival 2025"),
 *                         @OA\Property(property="description", type="string", example="Join us for an amazing summer music festival..."),
 *                         @OA\Property(property="category_name", type="string", example="Music"),
 *                         @OA\Property(property="start_date", type="string", example="15-12-2025", description="Formatted as d-m-Y"),
 *                         @OA\Property(property="end_date", type="string", example="16-12-2025", description="Formatted as d-m-Y"),
 *                         @OA\Property(property="start_time", type="string", example="09:00", description="Formatted as H:i"),
 *                         @OA\Property(property="end_time", type="string", example="18:00", description="Formatted as H:i"),
 *                         @OA\Property(property="key_highlights", type="string", nullable=true, example="• Top artists performing")
 *                     ),
 *                     @OA\Property(
 *                         property="event_media",
 *                         type="object",
 *                         description="Media grouped by type",
 *                         @OA\Property(
 *                             property="thumbnail",
 *                             type="array",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_media_id", type="integer", example=1),
 *                                 @OA\Property(property="media_type", type="string", example="thumbnail"),
 *                                 @OA\Property(property="file_path", type="string", example="events/1/thumbnail/image.jpg"),
 *                                 @OA\Property(property="file_name", type="string", example="image.jpg"),
 *                                 @OA\Property(property="file_size", type="integer", example=1024000)
 *                             )
 *                         ),
 *                         @OA\Property(
 *                             property="banner",
 *                             type="array",
 *                             @OA\Items(type="object")
 *                         ),
 *                         @OA\Property(
 *                             property="flyer",
 *                             type="array",
 *                             @OA\Items(type="object")
 *                         ),
 *                         @OA\Property(
 *                             property="video",
 *                             type="array",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="video_duration", type="string", example="2:30", description="Only for video type")
 *                             )
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="social_media",
 *                         type="array",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="event_social_media_id", type="integer", example=1),
 *                             @OA\Property(property="platform", type="string", example="facebook"),
 *                             @OA\Property(property="url", type="string", example="https://facebook.com/eventpage")
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="tickets",
 *                         type="array",
 *                         description="Tickets with category names and revenue",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="ticket_id", type="integer", example=1),
 *                             @OA\Property(property="category_name", type="string", example="Early Bird"),
 *                             @OA\Property(property="ticket_type", type="string", example="single_entry"),
 *                             @OA\Property(property="price", type="string", example="199.00"),
 *                             @OA\Property(property="total_available", type="integer", example=100),
 *                             @OA\Property(property="sold_quantity", type="integer", example=25),
 *                             @OA\Property(property="available_quantity", type="integer", example=75),
 *                             @OA\Property(property="revenue", type="string", example="4975.00", description="Revenue for this ticket type")
 *                         )
 *                     ),
 *                     @OA\Property(property="total_revenue", type="string", example="4975.00", description="Total revenue from all tickets"),
 *                     @OA\Property(
 *                         property="venue",
 *                         type="object",
 *                         nullable=true,
 *                         description="Venue details with country name, null if not set",
 *                         @OA\Property(property="venue_id", type="integer", example=1),
 *                         @OA\Property(property="venue_name", type="string", example="Madison Square Garden"),
 *                         @OA\Property(property="country_name", type="string", example="United States"),
 *                         @OA\Property(property="latitude", type="string", example="40.7505"),
 *                         @OA\Property(property="longitude", type="string", example="-73.9934")
 *                     ),
 *                     @OA\Property(
 *                         property="artists",
 *                         type="array",
 *                         description="Artists with nested social media links",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="event_artist_id", type="integer", example=1),
 *                             @OA\Property(property="artist_name", type="string", example="John Doe"),
 *                             @OA\Property(property="artist_image", type="string", nullable=true),
 *                             @OA\Property(
 *                                 property="social_media",
 *                                 type="array",
 *                                 @OA\Items(
 *                                     type="object",
 *                                     @OA\Property(property="platform", type="string", example="instagram"),
 *                                     @OA\Property(property="url", type="string", example="https://instagram.com/@artistname")
 *                                 )
 *                             )
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="terms_conditions",
 *                         type="object",
 *                         nullable=true,
 *                         description="Terms & conditions content, null if not set",
 *                         @OA\Property(property="event_terms_id", type="integer", example=1),
 *                         @OA\Property(property="terms_content", type="string", example="<p><strong>Terms and Conditions</strong></p>")
 *                     ),
 *                     @OA\Property(
 *                         property="coupons",
 *                         type="array",
 *                         description="Active coupons only (filtered by validity and usage)",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="coupon_id", type="integer", example=1),
 *                             @OA\Property(property="coupon_code", type="string", example="EARLY20"),
 *                             @OA\Property(property="discount_type", type="string", example="percentage"),
 *                             @OA\Property(property="start_date", type="string", example="15-12-2025", description="Formatted as d-m-Y"),
 *                             @OA\Property(property="end_date", type="string", nullable=true, example="31-12-2025", description="Formatted as d-m-Y or null"),
 *                             @OA\Property(property="times_used", type="integer", example=5)
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="event_data_score",
 *                         type="object",
 *                         description="Event completion score",
 *                         @OA\Property(property="percentage", type="integer", example=80, description="Completion percentage (0-100)"),
 *                         @OA\Property(property="label", type="string", example="Good", description="Score label: Excellent (81-100%), Good (61-80%), Fair (41-60%), Poor (0-40%)"),
 *                         @OA\Property(property="completed_sections", type="integer", example=4, description="Number of completed sections"),
 *                         @OA\Property(property="total_sections", type="integer", example=5, description="Total number of sections")
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
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that authentication failed"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Not found error (E404). Event not found or doesn't belong to authenticated user.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested event does not exist or doesn't belong to the authenticated user"),
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to view it")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred while retrieving event summary. This could be due to database connection issues or other server-side exceptions.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving event summary")
 *             )
 *         )
 *     )
 * )
 */
class GetEventSummary
{
    // Get Event Summary API documentation
}

