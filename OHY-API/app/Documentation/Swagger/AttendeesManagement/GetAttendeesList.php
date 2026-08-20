<?php

namespace App\Documentation\Swagger\AttendeesManagement;

/**
 * @OA\Get(
 *     path="/v1/get_attendees_list",
 *     summary="Get Attendees List",
 *     description="Retrieves a paginated list of attendees (End Users) across all events created by the authenticated Event Host. For each attendee, displays name, email, contact, total transactions, total spend, last transaction date, and a list of events attended. For each event attended, shows the event title, number of tickets purchased, and total spend for that event. Supports search by name, email, and contact; date range filtering by last transaction date; event filtering by event title (free text); and sorting by last transaction date (default), total spend, or total transactions. Uses MVC structure with database queries in models for optimal performance.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates optional query parameters (search, start_date, end_date, events_filter, sort_by, page, per_page)
 * 3. Date format conversion: Converts date parameters from d-m-Y to Y-m-d format for database queries
 * 4. Filter preparation: Prepares filters array for model method calls
 * 5. Model method call: Calls UserModel::get_attendees_list_with_aggregates() to get attendees with aggregates
 * 6. Events data retrieval: Calls OrderModel::get_events_per_users() to get events per attendees for current page
 * 7. Data grouping: Groups events by user_id for easy lookup
 * 8. Response formatting: Formats attendee data with events list, formats last_txn date as d-m-Y H:i:s
 * 9. Pagination metadata: Calculates total_pages, next_page, prev_page
 * 10. Response: Returns paginated list of attendees with events information
 *
 * **MVC Structure:**
 * - Database queries are performed in Model methods (UserModel, OrderModel)
 * - Controller handles business logic, data formatting, and response
 * - This structure ensures separation of concerns and optimal performance
 * - Complex joins and aggregations are handled in models using DB::table()
 *
 * **Search Functionality:**
 * - Searches across user full_name, email, and contact_number fields
 * - Uses LIKE queries for partial matching
 * - Case-insensitive search (MySQL LIKE is case-insensitive by default)
 * - Search is applied in addition to other filters
 *
 * **Date Range Filtering:**
 * - Filters by last transaction date (last_txn_date)
 * - start_date: Start of date range (inclusive, format: d-m-Y)
 * - end_date: End of date range (inclusive, includes end of day 23:59:59, format: d-m-Y)
 * - Date format conversion: d-m-Y (request) → Y-m-d (database)
 * - If only start_date provided, filters from that date onwards
 * - If only end_date provided, filters up to that date
 * - If both provided, filters within date range
 *
 * **Events Filter:**
 * - Free text search on event titles
 * - Uses LIKE queries for partial matching
 * - Case-insensitive search
 * - Filters attendees who have purchased tickets for events matching the search
 * - Applied in addition to other filters
 *
 * **Sorting Options:**
 * - **last_txn_date** (default): Sort by last transaction date (most recent first)
 * - **total_spend**: Sort by total spend across all events (highest first)
 * - **total_txns**: Sort by total transactions (highest first)
 * - Sorting is performed in the database query for optimal performance
 *
 * **Events Per Attendee:**
 * - Each attendee includes a list of events they have attended
 * - For each event, shows:
 *   - event_id: Event identifier
 *   - event_title: Event name
 *   - tickets_purchased: Number of tickets purchased for this event
 *   - event_spend: Total amount spent on this event
 * - Events are retrieved only for current page attendees (optimization)
 * - Events are grouped by user_id for efficient lookup
 *
 * **Pagination:**
 * - Default: 10 attendees per page
 * - Maximum: 100 attendees per page
 * - Minimum: 1 attendee per page
 * - Pagination metadata includes: total_records, current_page, total_pages, next_page, prev_page
 * - next_page is null if on last page
 * - prev_page is null if on first page
 *
 * **Date Formatting:**
 * - last_txn date formatted as d-m-Y H:i:s (e.g., '15-12-2025 14:30:45')
 * - Includes date, time, and seconds for precise transaction timestamp
 * - If no last transaction, last_txn is null
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for invalid query parameters or date formats
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Attendees Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\Parameter(
 *         name="search",
 *         in="query",
 *         required=false,
 *         description="Search query to search across attendee name, email, and contact number. Case-insensitive partial matching. Maximum 255 characters.",
 *         @OA\Schema(type="string", maxLength=255, example="john")
 *     ),
 *     @OA\Parameter(
 *         name="start_date",
 *         in="query",
 *         required=false,
 *         description="Start date for date range filter (last transaction date). Format: d-m-Y (e.g., '01-12-2025'). Inclusive start date.",
 *         @OA\Schema(type="string", format="date", pattern="^\\d{2}-\\d{2}-\\d{4}$", example="01-12-2025")
 *     ),
 *     @OA\Parameter(
 *         name="end_date",
 *         in="query",
 *         required=false,
 *         description="End date for date range filter (last transaction date). Format: d-m-Y (e.g., '31-12-2025'). Inclusive end date (includes end of day 23:59:59).",
 *         @OA\Schema(type="string", format="date", pattern="^\\d{2}-\\d{2}-\\d{4}$", example="31-12-2025")
 *     ),
 *     @OA\Parameter(
 *         name="events_filter",
 *         in="query",
 *         required=false,
 *         description="Free text search on event titles to filter attendees who have purchased tickets for matching events. Case-insensitive partial matching. Maximum 255 characters.",
 *         @OA\Schema(type="string", maxLength=255, example="tech conference")
 *     ),
 *     @OA\Parameter(
 *         name="sort_by",
 *         in="query",
 *         required=false,
 *         description="Sort option for attendees list. Valid values: 'last_txn_date' (default), 'total_spend', 'total_txns'. Default is 'last_txn_date'.",
 *         @OA\Schema(type="string", enum={"last_txn_date", "total_spend", "total_txns"}, example="last_txn_date")
 *     ),
 *     @OA\Parameter(
 *         name="page",
 *         in="query",
 *         required=false,
 *         description="Page number for pagination. Minimum 1. Default is 1.",
 *         @OA\Schema(type="integer", minimum=1, example=1)
 *     ),
 *     @OA\Parameter(
 *         name="per_page",
 *         in="query",
 *         required=false,
 *         description="Number of attendees per page. Minimum 1, maximum 100. Default is 10.",
 *         @OA\Schema(type="integer", minimum=1, maximum=100, example=10)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Attendees retrieved successfully. Returns paginated list of attendees with events information, total transactions, total spend, and last transaction date.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Attendees retrieved successfully"),
 *                 @OA\Property(
 *                     property="attendees",
 *                     type="array",
 *                     description="Array of attendees sorted by selected sort option",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="user_id", type="integer", example=1),
 *                         @OA\Property(property="name", type="string", example="John Doe"),
 *                         @OA\Property(property="email", type="string", example="john.doe@example.com"),
 *                         @OA\Property(property="contact", type="string", nullable=true, example="+1234567890"),
 *                         @OA\Property(property="total_txns", type="integer", example=5, description="Total transactions across all events"),
 *                         @OA\Property(property="total_spend", type="number", format="float", example=995.00, description="Total amount spent across all events"),
 *                         @OA\Property(property="last_txn", type="string", format="date-time", nullable=true, description="Last transaction date formatted as d-m-Y H:i:s", example="15-12-2025 14:30:45"),
 *                         @OA\Property(
 *                             property="events",
 *                             type="array",
 *                             description="List of events attended by this attendee",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_id", type="integer", example=1),
 *                                 @OA\Property(property="event_title", type="string", example="Tech Conference 2025"),
 *                                 @OA\Property(property="tickets_purchased", type="integer", example=2, description="Number of tickets purchased for this event"),
 *                                 @OA\Property(property="event_spend", type="number", format="float", example=398.00, description="Total amount spent on this event")
 *                             ),
 *                             example={{"event_id": 1, "event_title": "Tech Conference 2025", "tickets_purchased": 2, "event_spend": 398.00}, {"event_id": 3, "event_title": "Music Festival 2025", "tickets_purchased": 3, "event_spend": 597.00}}
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
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Query parameters are invalid or date formats are incorrect.",
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
 *                         property="start_date",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The start date does not match the format d-m-Y."}
 *                     ),
 *                     @OA\Property(
 *                         property="sort_by",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The selected sort by is invalid."}
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
 *         description="Server error (E002). An unexpected error occurred while retrieving attendees list.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving attendees list")
 *             )
 *         )
 *     )
 * )
 */
class GetAttendeesList
{
    // Empty class for swagger-php to parse annotations
}

