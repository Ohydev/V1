<?php

namespace App\Documentation\Swagger\EventManagement;

/**
 * @OA\Get(
 *     path="/v1/get_events_list",
 *     summary="Get Events List",
 *     description="Retrieves a paginated list of events for the authenticated Event Host with support for status filtering (live, upcoming, completed, drafts), search functionality across event titles and descriptions, and comprehensive event information including revenue, attendees count, ticket pricing, and thumbnails. Events are sorted by start_date DESC and start_time DESC (newest first). This API is used in the Manage Events page to display all events with filtering and search capabilities.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates optional query parameters (status, search, page, per_page)
 * 3. Base query building: Filters events by authenticated host_user_id
 * 4. Status filtering: Applies status-specific filters based on status parameter (live, upcoming, completed, drafts)
 * 5. Search filtering: Applies LIKE queries on event_title and description if search parameter provided
 * 6. Eager loading: Loads eventCategory and venue relationships to optimize queries
 * 7. Sorting: Orders by start_date DESC, start_time DESC (newest first)
 * 8. Pagination: Calculates total records, applies skip/take for pagination
 * 9. Data aggregation: For each event, calculates revenue, attendees count, ticket price range, and retrieves thumbnail
 * 10. Status calculation: Calculates event status dynamically based on dates and draft/published flags
 * 11. Response formatting: Formats all data with proper date/time formatting (d-m-Y, H:i)
 * 12. Pagination metadata: Calculates total_pages, next_page, prev_page
 * 13. Response: Returns paginated list of events with comprehensive information
 *
 * **Status Filters:**
 * - **live**: Current date/time between start and end date/time, and published (is_draft = false, is_published = true)
 * - **upcoming**: Start date/time in future, and published (is_draft = false, is_published = true)
 * - **completed**: End date/time has passed, and published (is_draft = false, is_published = true)
 * - **drafts**: is_draft = true and is_published = false
 * - If no status filter provided, returns all events for the host user
 *
 * **Search Functionality:**
 * - Searches across event_title and description fields using LIKE queries
 * - Case-insensitive search (MySQL LIKE is case-insensitive by default)
 * - Partial matching supported (e.g., 'tech' matches 'Technology Conference')
 * - Search is applied in addition to status filter (if provided)
 *
 * **Event Status Calculation:**
 * - Status is calculated dynamically for each event based on current date/time
 * - **draft**: is_draft = true OR is_published = false
 * - **live**: Published AND current time between start and end
 * - **upcoming**: Published AND start time in future
 * - **completed**: Published AND end time has passed
 * - Status is included in response for each event
 *
 * **Revenue Calculation:**
 * - Revenue calculated per event: Sum of (sold_quantity * price) for all ticket types
 * - Revenue display: Formatted as currency (e.g., '$35,820 Revenue')
 * - If no tickets sold, revenue is 0
 *
 * **Attendees Count:**
 * - Total sold tickets: Sum of sold_quantity from all ticket types
 * - Maximum attendees: Retrieved from venue.maximum_attendees
 * - Display format: 'X/Y attendees' if maximum exists, or 'X attendees' if no maximum
 * - If no tickets sold, displays '0 attendees'
 *
 * **Ticket Price Range:**
 * - Minimum price: Lowest price across all ticket types
 * - Maximum price: Highest price across all ticket types
 * - Display format: '$X per ticket' if min = max, or '$X - $Y' if different
 * - If no tickets exist, displays 'No tickets'
 *
 * **Thumbnail Retrieval:**
 * - Retrieves first thumbnail media file for each event
 * - Thumbnail file_path is included in response
 * - If no thumbnail exists, thumbnail is null
 *
 * **Pagination:**
 * - Default: 30 events per page
 * - Maximum: 100 events per page
 * - Minimum: 1 event per page
 * - Pagination metadata includes: total_records, current_page, total_pages, next_page, prev_page
 * - next_page is null if on last page
 * - prev_page is null if on first page
 *
 * **Date/Time Formatting:**
 * - Dates formatted as d-m-Y (e.g., '15-12-2025')
 * - Times formatted as H:i (e.g., '09:00')
 * - This format matches frontend expectations for display
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for invalid query parameters
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Parameter(
 *         name="status",
 *         in="query",
 *         required=false,
 *         description="Status filter to filter events by status. Valid values: 'live', 'upcoming', 'completed', 'drafts'. If not provided, returns all events for the host user.",
 *
 *         @OA\Schema(type="string", enum={"live", "upcoming", "completed", "drafts"}, example="live")
 *     ),
 *
 *     @OA\Parameter(
 *         name="search",
 *         in="query",
 *         required=false,
 *         description="Search query to search across event titles and descriptions. Case-insensitive partial matching. Maximum 255 characters.",
 *
 *         @OA\Schema(type="string", maxLength=255, example="tech conference")
 *     ),
 *
 *     @OA\Parameter(
 *         name="page",
 *         in="query",
 *         required=false,
 *         description="Page number for pagination. Minimum 1. Default is 1.",
 *
 *         @OA\Schema(type="integer", minimum=1, example=1)
 *     ),
 *
 *     @OA\Parameter(
 *         name="per_page",
 *         in="query",
 *         required=false,
 *         description="Number of events per page. Minimum 1, maximum 100. Default is 30.",
 *
 *         @OA\Schema(type="integer", minimum=1, maximum=100, example=30)
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Events retrieved successfully. Returns paginated list of events with comprehensive information including status, revenue, attendees, ticket pricing, and thumbnails.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Events retrieved successfully"),
 *                 @OA\Property(
 *                     property="events",
 *                     type="array",
 *                     description="Array of events sorted by start_date DESC, start_time DESC (newest first)",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="event_title", type="string", example="Tech Conference 2025"),
 *                         @OA\Property(property="description", type="string", description="Event description with rich text formatting", example="<p>Join us for an exciting tech conference...</p>"),
 *                         @OA\Property(property="status", type="string", description="Calculated event status: 'live', 'upcoming', 'completed', or 'draft'", example="live"),
 *                         @OA\Property(property="category_name", type="string", nullable=true, example="Technology"),
 *                         @OA\Property(property="start_date", type="string", format="date", description="Formatted as d-m-Y", example="15-12-2025"),
 *                         @OA\Property(property="start_time", type="string", format="time", description="Formatted as H:i", example="09:00"),
 *                         @OA\Property(property="end_date", type="string", format="date", description="Formatted as d-m-Y", example="16-12-2025"),
 *                         @OA\Property(property="end_time", type="string", format="time", description="Formatted as H:i", example="18:00"),
 *                         @OA\Property(property="venue_name", type="string", nullable=true, example="Madison Square Garden"),
 *                         @OA\Property(
 *                             property="attendees",
 *                             type="object",
 *                             description="Attendees information with sold count, maximum, and display string",
 *                             @OA\Property(property="sold", type="integer", example=25, description="Total number of tickets sold"),
 *                             @OA\Property(property="maximum", type="integer", nullable=true, example=20000, description="Maximum attendees from venue (null if not set)"),
 *                             @OA\Property(property="display", type="string", example="25/20000 attendees", description="Formatted display string")
 *                         ),
 *                         @OA\Property(
 *                             property="ticket_price",
 *                             type="object",
 *                             description="Ticket price range with min, max, and display string",
 *                             @OA\Property(property="min", type="number", format="float", nullable=true, example=199.00, description="Minimum ticket price (null if no tickets)"),
 *                             @OA\Property(property="max", type="number", format="float", nullable=true, example=299.00, description="Maximum ticket price (null if no tickets)"),
 *                             @OA\Property(property="display", type="string", example="$199.00 - $299.00", description="Formatted display string")
 *                         ),
 *                         @OA\Property(
 *                             property="revenue",
 *                             type="object",
 *                             description="Revenue information with amount and display string",
 *                             @OA\Property(property="amount", type="number", format="float", example=35820.00, description="Total revenue amount"),
 *                             @OA\Property(property="display", type="string", example="$35,820 Revenue", description="Formatted display string with currency")
 *                         ),
 *                         @OA\Property(property="thumbnail", type="string", nullable=true, example="events/1/thumbnail/image.jpg", description="Thumbnail file path (null if not exists)"),
 *                         @OA\Property(property="is_hidden_by_admin", type="boolean", example=false, description="Flag indicating if event is hidden by super admin. Hidden events are excluded from public listings but remain visible to event hosts."),
 *                         @OA\Property(property="hidden_reason", type="string", nullable=true, example="Content violates platform guidelines", description="Reason for hiding the event (only present if is_hidden_by_admin is true)"),
 *                         @OA\Property(property="hidden_at", type="string", nullable=true, format="date-time", example="28-11-2025 14:30:00", description="Timestamp when the event was hidden (only present if is_hidden_by_admin is true), formatted as d-m-Y H:i:s")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="pagination",
 *                     type="object",
 *                     description="Pagination metadata",
 *                     @OA\Property(property="total_records", type="integer", example=250, description="Total number of records matching filters"),
 *                     @OA\Property(property="current_page", type="integer", example=1, description="Current page number"),
 *                     @OA\Property(property="total_pages", type="integer", example=25, description="Total number of pages"),
 *                     @OA\Property(property="next_page", type="integer", nullable=true, example=2, description="Next page number (null if on last page)"),
 *                     @OA\Property(property="prev_page", type="integer", nullable=true, example=null, description="Previous page number (null if on first page)")
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Query parameters are invalid.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
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
 *                         property="status",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The selected status is invalid."}
 *                     ),
 *
 *                     @OA\Property(
 *                         property="per_page",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The per page must not be greater than 100."}
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003). User authentication failed. Token is missing, invalid, or expired.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that user authentication failed or token is invalid/expired"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Server error (E002). An unexpected error occurred while retrieving events list.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving events list")
 *             )
 *         )
 *     )
 * )
 */
class GetEventsList
{
    // Empty class for swagger-php to parse annotations
}
