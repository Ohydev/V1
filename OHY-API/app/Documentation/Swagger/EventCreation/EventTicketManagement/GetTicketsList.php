<?php

namespace App\Documentation\Swagger\EventCreation\EventTicketManagement;

/**
 * @OA\Get(
 *     path="/v1/get_tickets_list",
 *     summary="Get Tickets List",
 *     description="Retrieves all tickets for a specific event with complete details including category information. Used to display the list of created tickets in Step 2 of the event creation wizard. Tickets are sorted by ticket_id (creation order) for consistent display.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id parameter (required, must exist in events table)
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Ticket retrieval: Queries tickets table for all tickets linked to the event
 * 5. Category information: For each ticket, retrieves category name from ticket_categories table
 * 6. Available quantity calculation: Calculates available_quantity = total_available - sold_quantity for each ticket
 * 7. Response formatting: Formats tickets array with complete details including category_name
 * 8. Sorting: Sorts tickets by ticket_id (creation order) for consistent display
 * 9. Response: Returns sorted list of tickets with all details
 *
 * **Event Ownership:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - If event doesn't exist or doesn't belong to user, returns E404 error
 *
 * **Ticket Information:**
 * - Each ticket includes complete details: ID, category, type, price, availability, etc.
 * - Category name is included for each ticket (retrieved from ticket_categories table)
 * - Available quantity is calculated: total_available - sold_quantity
 * - Price is returned as string format
 * - Ticket info (rich text) is included if available
 *
 * **Response Sorting:**
 * - Tickets are sorted by ticket_id (creation order)
 * - Ensures consistent ordering in ticket lists
 * - Maintains chronological order of ticket creation
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for invalid event_id or missing parameter
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Event Ticket Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Parameter(
 *         name="event_id",
 *         in="query",
 *         required=true,
 *         description="Event ID to retrieve tickets for. Must exist in events table and belong to authenticated host user.",
 *
 *         @OA\Schema(type="integer", example=1),
 *         example=1
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Tickets retrieved successfully. Returns sorted list of tickets with complete details including category information.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Tickets retrieved successfully"),
 *                 @OA\Property(
 *                     property="tickets",
 *                     type="array",
 *                     description="Array of tickets sorted by ticket_id (creation order)",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="ticket_id", type="integer", example=1),
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="ticket_category_id", type="integer", example=1),
 *                         @OA\Property(property="category_name", type="string", example="Early Bird", description="Category name retrieved from ticket_categories table"),
 *                         @OA\Property(property="ticket_type", type="string", enum={"single_entry", "multiple_entry"}, example="single_entry"),
 *                         @OA\Property(property="description", type="string", nullable=true, example="Limited time offer", description="Description/tag or null"),
 *                         @OA\Property(property="price", type="string", example="199.00", description="Ticket price as string"),
 *                         @OA\Property(property="total_available", type="integer", example=100, description="Total inventory for this ticket type"),
 *                         @OA\Property(property="sold_quantity", type="integer", example=25, description="Number of tickets sold"),
 *                         @OA\Property(property="available_quantity", type="integer", example=75, description="Calculated available quantity (total_available - sold_quantity)"),
 *                         @OA\Property(property="ticket_info", type="string", nullable=true, example="Includes access to VIP area...", description="Rich text description of what's included or null"),
 *                         @OA\Property(property="max_per_user", type="integer", example=5, description="Maximum tickets a single user can purchase")
 *                     ),
 *                     example={{"ticket_id": 1, "event_id": 1, "ticket_category_id": 1, "category_name": "Early Bird", "ticket_type": "single_entry", "description": "Limited time offer", "price": "199.00", "total_available": 100, "sold_quantity": 0, "available_quantity": 100, "ticket_info": "Includes access to VIP area...", "max_per_user": 5}}
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. event_id is missing or invalid.",
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
 *                         property="event_id",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The event id field is required.", "The selected event id is invalid."}
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
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that authentication failed"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=404,
 *         description="Not found error (E404). Event not found or doesn't belong to authenticated user.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested event does not exist or doesn't belong to the authenticated user"),
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to view its tickets")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred while retrieving tickets. This could be due to database connection issues or other server-side exceptions.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving tickets")
 *             )
 *         )
 *     )
 * )
 */
class GetTicketsList
{
    // Get Tickets List API documentation
}
