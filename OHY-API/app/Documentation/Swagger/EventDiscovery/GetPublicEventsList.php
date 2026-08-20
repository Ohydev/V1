<?php

namespace App\Documentation\Swagger\EventDiscovery;

/**
 * @OA\Get(
 *     path="/v1/get_public_events_list",
 *     summary="Get Public Events List",
 *     description="Retrieves a paginated list of published events with optional search, filtering, and pagination capabilities. This is a public endpoint that does not require authentication. Only events that are published (is_published = true, is_draft = false) AND not hidden by admin (is_hidden_by_admin = false) are returned. Hidden events are excluded from public listings but remain visible to event hosts.
 *
 * **Complete Flow:**
 * 1. Request validation: Validates all optional query parameters (search, category_id, location, start_date, end_date, page)
 * 2. Query parameter preparation: Prepares query parameters array with default values (page defaults to 1)
 * 3. Database query: Calls EventModel::get_public_events_list() which:
 *    - Filters events where is_published = true AND is_draft = false AND is_hidden_by_admin = false
 *    - Applies search filter using LIKE queries on event_title and description if search term provided
 *    - Applies category filter if category_id provided (must exist in event_categories table)
 *    - Applies location filter using LIKE queries on venue city and state_province if location provided
 *    - Applies date range filters: start_date >= provided date, end_date <= provided date
 *    - Eager loads relationships: eventCategory, venue, media, tickets (to prevent N+1 queries)
 *    - Sorts results by start_date ASC, then start_time ASC (earliest events first)
 *    - Paginates results: 30 events per page (hardcoded in model)
 * 4. Data formatting: Formats each event in the response:
 *    - Extracts thumbnail media (first thumbnail found)
 *    - Calculates price range from all ticket prices (min, max, display format)
 *    - Formats venue data (venue_name, city, state_province) or null if no venue
 *    - Formats category data (event_category_id, category_name) or null if no category
 *    - Formats dates as d-m-Y (e.g., '15-12-2025') - day-month-year format
 *    - Formats times as H:i (e.g., '09:00') - hours and minutes only
 * 5. Pagination calculation: Calculates pagination metadata (total_records, current_page, total_pages, next_page, prev_page)
 * 6. Response: Returns formatted events array with pagination information
 *
 * **Search Functionality:**
 * - Search term is applied to event_title and description fields using LIKE queries
 * - Case-insensitive partial matching (e.g., 'music' matches 'Music Festival')
 * - Search is optional - if not provided, all published events are returned (subject to other filters)
 *
 * **Filtering Capabilities:**
 * - Category filter: Filters by event_category_id (must exist in event_categories table)
 * - Location filter: Searches in venue city and state_province fields using LIKE queries
 * - Date range filter: Filters events by start_date and end_date. If both are provided, end_date must be after or equal to start_date.
 *
 * **Pagination Details:**
 * - Default page: 1 (if not provided)
 * - Events per page: 30 (hardcoded in model, not configurable)
 * - Pagination object includes: total_records, current_page, total_pages, next_page (null if last page), prev_page (null if first page)
 *
 * **Data Transformations:**
 * - Date formatting: All dates formatted as d-m-Y (e.g., '15-12-2025') - day-month-year format
 * - Time formatting: All times formatted as H:i (e.g., '09:00') - hours and minutes only, no seconds or timezone
 * - Price range calculation: Calculated from all ticket prices for the event:
 *   - min: Minimum ticket price
 *   - max: Maximum ticket price
 *   - display: Formatted string ('$X.00' for single price, '$X - $Y' for price range)
 *
 * **Response Structure:**
 * - Success (200): Returns events array with formatted data and pagination object
 * - Validation Error (400): Returns E001 error code with detailed validation error messages
 * - Server Error (500): Returns E002 error code if any exception occurs during processing",
 *     tags={"End User - Event Discovery API"},
 *
 *     @OA\Parameter(
 *         name="search",
 *         in="query",
 *         required=false,
 *         description="Search term for event title and description. Searches using LIKE queries on event_title and description fields. Case-insensitive partial matching. Optional field. Maximum 255 characters. Validation rule: 'nullable|string|max:255'",
 *
 *         @OA\Schema(type="string", maxLength=255, example="music festival")
 *     ),
 *
 *     @OA\Parameter(
 *         name="category_id",
 *         in="query",
 *         required=false,
 *         description="Filter events by event category ID. Must be an integer and exist in the 'event_categories' table. Optional field. Validation rule: 'nullable|integer|exists:event_categories,event_category_id'",
 *
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *
 *     @OA\Parameter(
 *         name="location",
 *         in="query",
 *         required=false,
 *         description="Filter events by location (venue city or state/province). Searches using LIKE queries on venue city and state_province fields. Case-insensitive partial matching. Optional field. Maximum 255 characters. Validation rule: 'nullable|string|max:255'",
 *
 *         @OA\Schema(type="string", maxLength=255, example="New York")
 *     ),
 *
 *     @OA\Parameter(
 *         name="start_date",
 *         in="query",
 *         required=false,
 *         description="Filter events starting from this date. Filters events where start_date >= provided date. Date format: Y-m-d (e.g., '2025-12-15'). Optional field. If both start_date and end_date are provided, end_date must be after or equal to start_date. Validation rule: 'nullable|date'",
 *
 *         @OA\Schema(type="string", format="date", example="2025-12-15")
 *     ),
 *
 *     @OA\Parameter(
 *         name="end_date",
 *         in="query",
 *         required=false,
 *         description="Filter events ending before this date. Filters events where end_date <= provided date. Date format: Y-m-d (e.g., '2025-12-31'). Optional field. If both start_date and end_date are provided, end_date must be after or equal to start_date. Validation rule: 'nullable|date|after_or_equal:start_date' (conditional validation)",
 *
 *         @OA\Schema(type="string", format="date", example="2025-12-31")
 *     ),
 *
 *     @OA\Parameter(
 *         name="page",
 *         in="query",
 *         required=false,
 *         description="Page number for pagination. Minimum 1. Default is 1. Validation rule: 'nullable|integer|min:1'",
 *
 *         @OA\Schema(type="integer", minimum=1, example=1)
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Events retrieved successfully. Returns a paginated list of public events with formatted details.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true, description="Indicates successful operation"),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Events retrieved successfully", description="Success message"),
 *                 @OA\Property(
 *                     property="events",
 *                     type="array",
 *                     description="Array of public events, each with formatted details.",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="event_id", type="integer", example=1, description="Unique event identifier"),
 *                         @OA\Property(property="event_title", type="string", example="Music Festival 2025", description="Event title/name"),
 *                         @OA\Property(property="description", type="string", example="A spectacular music festival featuring top artists...", description="Event description (rich text format, formatting preserved)"),
 *                         @OA\Property(property="start_date", type="string", example="15-12-2025", description="Event start date formatted as d-m-Y (day-month-year). Format: d-m-Y (e.g., '15-12-2025')"),
 *                         @OA\Property(property="end_date", type="string", example="16-12-2025", description="Event end date formatted as d-m-Y (day-month-year). Format: d-m-Y (e.g., '16-12-2025')"),
 *                         @OA\Property(property="start_time", type="string", example="09:00", description="Event start time formatted as H:i (hours:minutes). Format: H:i (e.g., '09:00'), no seconds or timezone"),
 *                         @OA\Property(property="end_time", type="string", example="18:00", description="Event end time formatted as H:i (hours:minutes). Format: H:i (e.g., '18:00'), no seconds or timezone"),
 *                         @OA\Property(
 *                             property="category",
 *                             type="object",
 *                             nullable=true,
 *                             description="Event category information. Null if event has no category assigned.",
 *                             @OA\Property(property="event_category_id", type="integer", example=1, description="Category ID"),
 *                             @OA\Property(property="category_name", type="string", example="Music", description="Category name")
 *                         ),
 *                         @OA\Property(
 *                             property="venue",
 *                             type="object",
 *                             nullable=true,
 *                             description="Venue information. Null if event has no venue assigned.",
 *                             @OA\Property(property="venue_name", type="string", example="Grand Arena", description="Venue name"),
 *                             @OA\Property(property="city", type="string", example="New York", description="City of the venue"),
 *                             @OA\Property(property="state_province", type="string", example="NY", description="State or province of the venue")
 *                         ),
 *                         @OA\Property(
 *                             property="thumbnail",
 *                             type="object",
 *                             nullable=true,
 *                             description="Thumbnail image information. Null if no thumbnail is available.",
 *                             @OA\Property(property="file_path", type="string", example="events/1/thumbnail/image.jpg", description="File path of the thumbnail image")
 *                         ),
 *                         @OA\Property(
 *                             property="price_range",
 *                             type="object",
 *                             description="Price range calculated from all ticket prices for this event.",
 *                             @OA\Property(property="min", type="number", format="float", nullable=true, example=50.00, description="Minimum ticket price. Null if event has no tickets."),
 *                             @OA\Property(property="max", type="number", format="float", nullable=true, example=199.00, description="Maximum ticket price. Null if event has no tickets."),
 *                             @OA\Property(property="display", type="string", nullable=true, example="$50.00 - $199.00", description="Formatted price display string. Format: '$X.00' for single price, '$X - $Y' for price range. Null if event has no tickets.")
 *                         )
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
 *         description="Validation error (E001). Request validation failed. Returns detailed error messages for each field that failed validation.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed operation"),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     description="Validation error messages object. Keys are field names, values are arrays of error messages for that field.",
 *                     @OA\Property(
 *                         property="category_id",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The selected category id is invalid."}
 *                     ),
 *
 *                     @OA\Property(
 *                         property="start_date",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The start date is not a valid date."}
 *                     ),
 *
 *                     @OA\Property(
 *                         property="end_date",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The end date must be a date after or equal to start date."}
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred during event retrieval. This could be due to database connection issues or other server-side exceptions.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed operation"),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving events")
 *             )
 *         )
 *     )
 * )
 */
class GetPublicEventsList
{
    // Empty class - annotations are in docblock
}
