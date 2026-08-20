<?php

namespace App\Documentation\Swagger\Dashboard;

/**
 * @OA\Get(
 *     path="/v1/get_host_user_dashboard",
 *     summary="Get Host User Dashboard",
 *     description="Retrieves dashboard data for the authenticated Event Host. Returns summary metrics (active events count, completed events count, total revenue) and recent events (limit 3) with complete details including event thumbnail, title, date, attendees count, location, revenue, and status badge. Recent events are sorted by creation date (newest first) and include eager loading for optimal performance. Event status is calculated dynamically for each recent event based on dates and draft/published flags. This API is used in the Host User Dashboard page to display key metrics and recent activity.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Model method calls: Calls EventModel and TicketModel methods to retrieve aggregated data
 * 3. Active events count: Retrieves count of active events (published and current time between start and end)
 * 4. Completed events count: Retrieves count of completed events (published and end time has passed)
 * 5. Total revenue: Calculates total revenue across all events for the host user
 * 6. Recent events retrieval: Retrieves 3 most recent events with eager loading (tickets, venue, media relationships)
 * 7. Recent events processing: For each recent event, calculates status, attendees count, revenue, and retrieves thumbnail
 * 8. Response formatting: Formats all data with proper date/time formatting (d-m-Y, H:i)
 * 9. Response: Returns dashboard data with summary metrics and recent events
 *
 * **Summary Metrics:**
 * - **Active Events**: Count of events that are published and currently live (current time between start and end)
 * - **Completed Events**: Count of events that are published and have ended (end time has passed)
 * - **Total Revenue**: Sum of (sold_quantity * price) for all ticket types across all events for the host user
 *
 * **Recent Events:**
 * - Limited to 3 most recent events (sorted by created_at DESC)
 * - Includes eager loading of tickets, venue, and media relationships for optimal performance
 * - For each event, includes:
 *   - Event ID, title, status (calculated dynamically)
 *   - Date and time (formatted as d-m-Y, H:i)
 *   - Attendees count (sum of sold_quantity from tickets)
 *   - Venue name (from venue relationship)
 *   - Revenue (sum of sold_quantity * price from tickets)
 *   - Thumbnail (first thumbnail media file path)
 *
 * **Event Status Calculation:**
 * - Status is calculated dynamically for each recent event
 * - **draft**: is_draft = true OR is_published = false
 * - **live**: Published AND current time between start and end
 * - **upcoming**: Published AND start time in future
 * - **completed**: Published AND end time has passed
 * - Status is included in each recent event
 *
 * **Attendees Count Calculation:**
 * - Sum of sold_quantity from all tickets for the event
 * - If no tickets exist or no tickets sold, count is 0
 * - Count is calculated from eager loaded tickets relationship
 *
 * **Revenue Calculation:**
 * - Revenue calculated per event: Sum of (sold_quantity * price) from tickets
 * - Total revenue: Sum across all events for the host user
 * - If no tickets sold, revenue is 0
 *
 * **Thumbnail Retrieval:**
 * - Retrieves first thumbnail media file from eager loaded media relationship
 * - Filters media by media_type = 'thumbnail'
 * - Thumbnail file_path is included in response
 * - If no thumbnail exists, thumbnail is null
 *
 * **Performance Optimization:**
 * - Uses eager loading for recent events (tickets, venue, media relationships)
 * - Prevents N+1 query problem by loading all related data upfront
 * - Model methods use optimized queries for aggregated data
 * - Single query for recent events with all relationships
 *
 * **Date/Time Formatting:**
 * - Dates formatted as d-m-Y (e.g., '15-12-2025')
 * - Times formatted as H:i (e.g., '09:00')
 * - This format matches frontend expectations for display
 *
 * **Error Handling:**
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Host Dashboard"},
 *     security={{"sanctum": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="Dashboard data retrieved successfully. Returns summary metrics (active events, completed events, total revenue) and recent events (limit 3) with complete details.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Dashboard data retrieved successfully"),
 *                 @OA\Property(
 *                     property="summary",
 *                     type="object",
 *                     description="Summary metrics: active events count, completed events count, total revenue",
 *                     @OA\Property(property="active_events", type="integer", example=5, description="Count of active events (published and currently live)"),
 *                     @OA\Property(property="completed_events", type="integer", example=12, description="Count of completed events (published and ended)"),
 *                     @OA\Property(property="total_revenue", type="number", format="float", example=125430.50, description="Total revenue across all events for the host user")
 *                 ),
 *                 @OA\Property(
 *                     property="recent_events",
 *                     type="array",
 *                     description="Array of 3 most recent events sorted by creation date (newest first)",
 *                     maxItems=3,
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="event_title", type="string", example="Tech Conference 2025"),
 *                         @OA\Property(property="status", type="string", description="Calculated event status: 'live', 'upcoming', 'completed', or 'draft'", example="live"),
 *                         @OA\Property(property="date", type="string", format="date", description="Start date formatted as d-m-Y", example="15-12-2025"),
 *                         @OA\Property(property="time", type="string", format="time", description="Start time formatted as H:i", example="09:00"),
 *                         @OA\Property(property="attendees", type="integer", example=25, description="Total number of tickets sold (sum of sold_quantity)"),
 *                         @OA\Property(property="venue_name", type="string", nullable=true, example="Madison Square Garden", description="Venue name from venue relationship (null if not set)"),
 *                         @OA\Property(property="revenue", type="number", format="float", example=35820.00, description="Total revenue for this event (sum of sold_quantity * price)"),
 *                         @OA\Property(property="thumbnail", type="string", nullable=true, example="events/1/thumbnail/image.jpg", description="Thumbnail file path (null if not exists)")
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
 *         response=500,
 *         description="Server error (E002). An unexpected error occurred while retrieving dashboard data.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving dashboard data")
 *             )
 *         )
 *     )
 * )
 */
class GetHostUserDashboard
{
    // Empty class for swagger-php to parse annotations
}

