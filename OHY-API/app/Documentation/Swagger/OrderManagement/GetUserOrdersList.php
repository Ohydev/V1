<?php

namespace App\Documentation\Swagger\OrderManagement;

/**
 * @OA\Get(
 *     path="/v1/get_user_orders_list",
 *     summary="Get User Orders List",
 *     description="Retrieves a paginated list of orders for the authenticated End User with event information and calculated event status. This endpoint retrieves all orders for the authenticated user, calculates event status (Live/Upcoming/Completed) based on current date/time and event dates/times, and returns paginated results sorted by order date (newest first). Protected route - requires authentication via Laravel Sanctum token.
 *
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates optional query parameters (page: nullable|integer|min:1, per_page: nullable|integer|min:1|max:100)
 * 3. Parameter preparation: Gets page number (default: 1) and per_page (default: 30, max: 100)
 * 4. Database query: Queries orders table for authenticated user with eager loading:
 *    - Eager loads: orderTickets, orderTickets.ticket, orderTickets.ticket.event
 *    - Filters by user_id to ensure only authenticated user's orders are retrieved
 *    - Sorts by order_date DESC, then created_at DESC (newest orders first)
 *    - Paginates results using Laravel pagination
 * 5. Event status calculation: Loops through each order to calculate event status:
 *    - Gets first order ticket to access event information (all tickets in an order belong to same event)
 *    - If event exists, calculates event status based on current date/time and event dates/times:
 *      - Combines start_date and start_time to create start datetime
 *      - Combines end_date and end_time to create end datetime
 *      - Compares current datetime with start and end datetimes:
 *        - Live: If current datetime >= start datetime AND current datetime <= end datetime
 *        - Upcoming: If current datetime < start datetime
 *        - Completed: If current datetime > end datetime
 * 6. Order formatting: Formats each order with:
 *    - order_id, order_number, event_id, event_title, event_status, event_date, event_time
 *    - total_tickets: Sum of all quantities from order_tickets
 *    - total_amount: Formatted to 2 decimal places
 *    - order_date: Order creation date
 * 7. Pagination metadata: Calculates pagination information:
 *    - total_records: Total number of orders
 *    - current_page: Current page number
 *    - total_pages: Total number of pages
 *    - per_page: Items per page
 *    - next_page: Next page number (null if last page)
 *    - prev_page: Previous page number (null if first page)
 * 8. Response: Returns success response with orders array and pagination object
 *
 * **Business Logic:**
 * - Order filtering: Only orders belonging to authenticated user are returned
 * - Event status calculation: Based on current datetime compared to event start/end datetimes
 * - Sorting: Orders sorted by order_date DESC, then created_at DESC (newest first)
 * - Total tickets: Calculated as sum of all quantities from order_tickets for each order
 *
 * **Data Transformations:**
 * - Price formatting: All prices formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Date/time handling: Event dates and times returned as-is from database (not formatted)
 * - Event status: Calculated dynamically based on current datetime
 *
 * **Pagination Details:**
 * - Default page: 1 (if not provided)
 * - Default per_page: 30 (if not provided)
 * - Maximum per_page: 100
 * - Pagination object includes: total_records, current_page, total_pages, per_page, next_page (null if last page), prev_page (null if first page)
 *
 * **Response Structure:**
 * - orders: Array of order objects, each containing:
 *   - order_id: Order ID
 *   - order_number: Order number (e.g., 'OHY1763043605664592')
 *   - event_id: Event ID (if available)
 *   - event_title: Event name (if available)
 *   - event_status: Event status badge ('Live', 'Upcoming', or 'Completed')
 *   - event_date: Event start date (if available, as-is from database)
 *   - event_time: Event start time (if available, as-is from database)
 *   - total_tickets: Total number of tickets purchased in this order
 *   - total_amount: Total amount paid formatted to 2 decimal places
 *   - order_date: Order creation date
 * - pagination: Pagination object with metadata
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if page or per_page validation fails
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Only orders belonging to authenticated user are returned (filtered by user_id from token)
 * - Ownership validation: Users can only view their own orders",
 *     tags={"End User - Order Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Parameter(
 *         name="page",
 *         in="query",
 *         required=false,
 *         description="Page number for pagination. Minimum 1. Default is 1. Validation rule: 'nullable|integer|min:1'",
 *
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *
 *     @OA\Parameter(
 *         name="per_page",
 *         in="query",
 *         required=false,
 *         description="Number of items per page. Minimum 1, maximum 100. Default is 30. Validation rule: 'nullable|integer|min:1|max:100'",
 *
 *         @OA\Schema(type="integer", minimum=1, maximum=100, example=30)
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Success - Orders retrieved successfully",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Orders retrieved successfully"),
 *                 @OA\Property(
 *                     property="orders",
 *                     type="array",
 *                     description="Array of formatted orders with event information",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="order_id", type="integer", description="Order ID", example=1),
 *                         @OA\Property(property="order_number", type="string", description="Order number (e.g., 'OHY1763043605664592')", example="OHY1763043605664592"),
 *                         @OA\Property(property="event_id", type="integer", nullable=true, description="Event ID (if available)", example=1),
 *                         @OA\Property(property="event_title", type="string", nullable=true, description="Event name (if available)", example="Music Festival 2025"),
 *                         @OA\Property(property="event_status", type="string", nullable=true, description="Event status badge ('Live', 'Upcoming', or 'Completed')", example="Upcoming"),
 *                         @OA\Property(property="event_date", type="string", nullable=true, description="Event start date (if available, as-is from database)", example="2025-12-15"),
 *                         @OA\Property(property="event_time", type="string", nullable=true, description="Event start time (if available, as-is from database)", example="09:00:00"),
 *                         @OA\Property(property="total_tickets", type="integer", description="Total number of tickets purchased in this order", example=3),
 *                         @OA\Property(property="total_amount", type="string", description="Total amount paid formatted to 2 decimal places", example="450.00"),
 *                         @OA\Property(property="order_date", type="string", description="Order creation date", example="2025-12-15")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="pagination",
 *                     type="object",
 *                     description="Pagination information",
 *                     @OA\Property(property="total_records", type="integer", description="Total number of orders", example=250),
 *                     @OA\Property(property="current_page", type="integer", description="Current page number", example=1),
 *                     @OA\Property(property="total_pages", type="integer", description="Total number of pages", example=9),
 *                     @OA\Property(property="per_page", type="integer", description="Items per page", example=30),
 *                     @OA\Property(property="next_page", type="integer", nullable=true, description="Next page number (null if last page)", example=2),
 *                     @OA\Property(property="prev_page", type="integer", nullable=true, description="Previous page number (null if first page)", example=null)
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Bad Request - Validation error",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     description="Validation errors object",
 *                     example={"page": {"The page must be at least 1."}, "per_page": {"The per page may not be greater than 100."}}
 *                 )
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving orders")
 *             )
 *         )
 *     )
 * )
 */
class GetUserOrdersList
{
    // Empty class - annotations are in docblock
}
