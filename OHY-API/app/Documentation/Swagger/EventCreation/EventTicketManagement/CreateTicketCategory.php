<?php

namespace App\Documentation\Swagger\EventCreation\EventTicketManagement;

/**
 * @OA\Post(
 *     path="/v1/create_ticket_category",
 *     summary="Create Ticket Category",
 *     description="Creates a new ticket category for a specific event. Called when user clicks '+' icon beside the Ticket Category dropdown in Step 2 of event creation wizard. Categories are event-specific and not reusable across events. Only draft events can have ticket categories created.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id and category_name fields
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Draft check: Verifies event is draft (is_published = false, is_draft = true)
 * 5. Category creation: Creates new ticket category record in ticket_categories table
 * 6. Response formatting: Returns created category with id, event_id, and category_name
 * 7. Response: Returns success response with created category data
 *
 * **Event Ownership & Draft Check:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - Only draft events can have ticket categories created
 * - Published events cannot have categories created (returns E004 error)
 * - If event doesn't exist or doesn't belong to user, returns E404 error
 *
 * **Category Characteristics:**
 * - Categories are event-specific (created per event, not reusable across events)
 * - Each event starts with no categories (must create first)
 * - Category name is just a label (e.g., 'Early Bird' doesn't imply discount)
 * - Multiple categories can be created for each event
 * - Categories are used when creating tickets in Step 2
 *
 * **Usage Context:**
 * - Called when user clicks '+' icon beside Ticket Category dropdown
 * - Newly created category immediately available in dropdown
 * - Category can be used when creating tickets in the same Step 2 session
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Business logic errors (400): E004 error code if event is published (not draft)
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Event Ticket Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\RequestBody(
 *         required=true,
 *
 *         @OA\MediaType(
 *             mediaType="application/json",
 *
 *             @OA\Schema(
 *                 type="object",
 *                 required={"event_id", "category_name"},
 *
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Event ID to create category for. Required field. Must exist in events table and belong to authenticated host user. Validation rule: 'required|integer|exists:events,event_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="category_name",
 *                     type="string",
 *                     maxLength=255,
 *                     example="Early Bird",
 *                     description="Ticket category name. Required field. Must be a string with maximum 255 characters. Examples: 'Early Bird', 'Regular', 'VIP', 'Premium'. Category name is just a label and doesn't imply any discount or special treatment. Validation rule: 'required|string|max:255'"
 *                 )
 *             ),
 *
 *             @OA\Examples(
 *                 example="EarlyBird",
 *                 summary="Early Bird Category",
 *                 value={"event_id": 1, "category_name": "Early Bird"}
 *             ),
 *             @OA\Examples(
 *                 example="VIP",
 *                 summary="VIP Category",
 *                 value={"event_id": 1, "category_name": "VIP"}
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Ticket category created successfully. Returns created category with id, event_id, and category_name.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Ticket category created successfully"),
 *                 @OA\Property(
 *                     property="ticket_category",
 *                     type="object",
 *                     @OA\Property(property="ticket_category_id", type="integer", example=1),
 *                     @OA\Property(property="event_id", type="integer", example=1),
 *                     @OA\Property(property="category_name", type="string", example="Early Bird")
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001) or Business logic error (E004). Request validation failed or event is published.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed. E004: Business logic errors - indicates event is published and categories cannot be created"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *
 *                             @OA\Property(
 *                                 property="event_id",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The event id field is required.", "The selected event id is invalid."}
 *                             ),
 *
 *                             @OA\Property(
 *                                 property="category_name",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The category name field is required.", "The category name must not be greater than 255 characters."}
 *                             )
 *                         ),
 *
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message",
 *                             example="Ticket categories can only be created for draft events"
 *                         )
 *                     }
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
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to create categories for it")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred while creating ticket category. This could be due to database connection issues or other server-side exceptions.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while creating ticket category")
 *             )
 *         )
 *     )
 * )
 */
class CreateTicketCategory
{
    // Create Ticket Category API documentation
}
