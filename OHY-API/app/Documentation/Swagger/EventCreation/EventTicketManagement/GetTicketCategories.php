<?php

namespace App\Documentation\Swagger\EventCreation\EventTicketManagement;

/**
 * @OA\Get(
 *     path="/v1/get_ticket_categories",
 *     summary="Get Ticket Categories",
 *     description="Retrieves all ticket categories for a specific event. Used to populate the dropdown when creating tickets in Step 2 of the event creation wizard. Categories are event-specific and not reusable across events. Categories are sorted alphabetically by name for better user experience.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id parameter (required, must exist in events table)
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Category retrieval: Queries ticket_categories table for all categories linked to the event
 * 5. Response formatting: Formats categories array with ticket_category_id and category_name
 * 6. Sorting: Sorts categories alphabetically by category_name for better UX
 * 7. Response: Returns sorted list of ticket categories
 *
 * **Event Ownership:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - If event doesn't exist or doesn't belong to user, returns E404 error
 *
 * **Category Characteristics:**
 * - Categories are event-specific (created per event, not reusable across events)
 * - Categories are created using Create Ticket Category API (when user clicks '+' icon)
 * - Each event starts with no categories (must create first)
 * - Category name is just a label (e.g., 'Early Bird' doesn't imply discount)
 *
 * **Response Sorting:**
 * - Categories are sorted alphabetically by category_name
 * - Ensures consistent ordering in dropdown menus
 * - Improves user experience when selecting categories
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
 *         description="Event ID to retrieve ticket categories for. Must exist in events table and belong to authenticated host user.",
 *
 *         @OA\Schema(type="integer", example=1),
 *         example=1
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Ticket categories retrieved successfully. Returns sorted list of categories.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Ticket categories retrieved successfully"),
 *                 @OA\Property(
 *                     property="ticket_categories",
 *                     type="array",
 *                     description="Array of ticket categories sorted alphabetically by category_name",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="ticket_category_id", type="integer", example=1),
 *                         @OA\Property(property="category_name", type="string", example="Early Bird")
 *                     ),
 *                     example={{"ticket_category_id": 2, "category_name": "Early Bird"}, {"ticket_category_id": 3, "category_name": "Regular"}, {"ticket_category_id": 1, "category_name": "VIP"}}
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
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to view its categories")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred while retrieving ticket categories. This could be due to database connection issues or other server-side exceptions.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving ticket categories")
 *             )
 *         )
 *     )
 * )
 */
class GetTicketCategories
{
    // Get Ticket Categories API documentation
}
