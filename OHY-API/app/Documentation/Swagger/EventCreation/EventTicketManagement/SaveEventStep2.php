<?php

namespace App\Documentation\Swagger\EventCreation\EventTicketManagement;

/**
 * @OA\Post(
 *     path="/v1/save_event_step_2",
 *     summary="Save Event Step 2 (Ticketing)",
 *     description="Saves all tickets for Step 2 of event creation wizard. This API uses a 'replace all' approach: it deletes all existing tickets for the event and creates new ones from the provided tickets array. This simplifies frontend logic by sending the final desired state of all tickets. Uses database transactions to ensure data consistency. If any tickets have been sold (sold_quantity > 0), the API will return an error preventing replacement to maintain data integrity.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id and tickets array with nested validation for each ticket object
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Draft check: Verifies event is draft (is_published = false, is_draft = true)
 * 5. Category ownership verification: Verifies all ticket_category_id values belong to the event
 * 6. Database transaction begins: All database operations are wrapped in a transaction
 * 7. Sold tickets check: Checks if any existing tickets have sold_quantity > 0
 * 8. **Replace All Pattern**:
 *    - Deletes all existing tickets for the event (safe because no tickets sold)
 *    - Creates all new tickets from the tickets array
 *    - sold_quantity initialized to 0 for all new tickets
 * 9. Response formatting: Formats all created tickets with category_name and available_quantity
 * 10. Transaction commit: If all operations succeed, transaction is committed
 * 11. Transaction rollback: If any error occurs, all changes are rolled back
 *
 * **Replace All Pattern:**
 * - This API uses a 'replace all' approach instead of create/update/delete individual tickets
 * - Frontend sends the complete desired state of all tickets
 * - All existing tickets are deleted, then all new tickets are created
 * - Simplifies frontend logic - no need to track individual ticket changes
 * - Tickets array can be empty (deletes all tickets)
 *
 * **Sold Tickets Protection:**
 * - Before replacing tickets, API checks if any existing tickets have sold_quantity > 0
 * - If tickets have been sold, replacement is prevented (returns E004 error)
 * - This maintains data integrity and prevents loss of sales data
 * - Error message: 'Cannot modify tickets once they have been sold. Please contact support if you need to make changes.'
 *
 * **Category Ownership Verification:**
 * - All ticket_category_id values must belong to the event
 * - Verifies each category exists and is linked to the event
 * - Prevents using categories from other events
 * - Returns E004 error if any category doesn't belong to event
 *
 * **Ticket Data:**
 * - Each ticket requires: ticket_category_id, ticket_type, price, total_available, max_per_user
 * - Optional fields: description (max 255 chars), ticket_info (rich text)
 * - sold_quantity is automatically initialized to 0 for new tickets
 * - available_quantity is calculated in response: total_available - sold_quantity
 *
 * **Empty Tickets Array:**
 * - Tickets array can be empty (min:0 validation)
 * - Empty array means: delete all existing tickets, create no new tickets
 * - Useful for clearing all tickets from an event
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures (nested array validation)
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Business logic errors (400): E004 error code if event is published, tickets sold, or invalid categories
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
 *                 required={"event_id", "tickets"},
 *
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Event ID to save tickets for. Required field. Must exist in events table and belong to authenticated host user. Validation rule: 'required|integer|exists:events,event_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="tickets",
 *                     type="array",
 *                     minItems=0,
 *                     description="Array of ticket objects. Required field. Can be empty array (deletes all tickets). Each ticket object represents one ticket type. All existing tickets are deleted and replaced with tickets in this array. Validation rule: 'required|array|min:0'",
 *
 *                     @OA\Items(
 *                         type="object",
 *                         required={"ticket_category_id", "ticket_type", "price", "total_available", "max_per_user"},
 *
 *                         @OA\Property(
 *                             property="ticket_category_id",
 *                             type="integer",
 *                             example=1,
 *                             description="Ticket category ID. Required field. Must exist in ticket_categories table and belong to the event. Validation rule: 'required|integer|exists:ticket_categories,ticket_category_id'"
 *                         ),
 *                         @OA\Property(
 *                             property="ticket_type",
 *                             type="string",
 *                             enum={"single_entry", "multiple_entry"},
 *                             example="single_entry",
 *                             description="Ticket type. Required field. Must be either 'single_entry' or 'multiple_entry'. Validation rule: 'required|in:single_entry,multiple_entry'"
 *                         ),
 *                         @OA\Property(
 *                             property="price",
 *                             type="number",
 *                             format="float",
 *                             example=199.99,
 *                             description="Ticket price (includes all taxes). Required field. Must be numeric and non-negative (min: 0). Stored as DECIMAL(10,2) for precision. Validation rule: 'required|numeric|min:0'"
 *                         ),
 *                         @OA\Property(
 *                             property="total_available",
 *                             type="integer",
 *                             example=100,
 *                             description="Total inventory for this ticket type. Required field. Must be an integer and at least 1. This is the maximum number of tickets that can be sold for this ticket type. Validation rule: 'required|integer|min:1'"
 *                         ),
 *                         @OA\Property(
 *                             property="max_per_user",
 *                             type="integer",
 *                             example=5,
 *                             description="Maximum tickets a single user can purchase for this ticket type. Required field. Must be an integer and at least 1. This limit is enforced per ticket type, not per event. Validation rule: 'required|integer|min:1'"
 *                         ),
 *                         @OA\Property(
 *                             property="description",
 *                             type="string",
 *                             nullable=true,
 *                             maxLength=255,
 *                             example="Limited time offer",
 *                             description="Description/tag for the ticket. Optional field. Can be set to null. Maximum 255 characters. Used as a label or tag (e.g., 'Limited time offer', 'Best value'). Validation rule: 'nullable|string|max:255'"
 *                         ),
 *                         @OA\Property(
 *                             property="ticket_info",
 *                             type="string",
 *                             nullable=true,
 *                             example="This ticket includes:\n• Access to VIP area\n• Complimentary drinks\n• Meet & greet with artists",
 *                             description="Rich text description of what's included with this ticket. Optional field. Supports HTML/JSON formatting to preserve styling (bold, italic, bullet points, etc.). Formatting is preserved exactly as entered. Can be set to null. Validation rule: 'nullable|string'"
 *                         )
 *                     ),
 *                     example={
 *                         {
 *                             "ticket_category_id": 1,
 *                             "ticket_type": "single_entry",
 *                             "price": 199.99,
 *                             "total_available": 100,
 *                             "max_per_user": 5,
 *                             "description": "Limited time offer",
 *                             "ticket_info": "Includes access to VIP area..."
 *                         },
 *                         {
 *                             "ticket_category_id": 2,
 *                             "ticket_type": "single_entry",
 *                             "price": 149.99,
 *                             "total_available": 200,
 *                             "max_per_user": 10,
 *                             "description": null,
 *                             "ticket_info": null
 *                         }
 *                     }
 *                 )
 *             ),
 *
 *             @OA\Examples(
 *                 example="MultipleTickets",
 *                 summary="Multiple Tickets Example",
 *                 value={"event_id": 1, "tickets": {{"ticket_category_id": 1, "ticket_type": "single_entry", "price": 199.99, "total_available": 100, "max_per_user": 5, "description": "Early Bird", "ticket_info": "Includes VIP access"}, {"ticket_category_id": 2, "ticket_type": "single_entry", "price": 149.99, "total_available": 200, "max_per_user": 10}}}
 *             ),
 *             @OA\Examples(
 *                 example="EmptyTickets",
 *                 summary="Empty Tickets Array (Delete All)",
 *                 value={"event_id": 1, "tickets": {}}
 *             ),
 *             @OA\Examples(
 *                 example="SingleTicket",
 *                 summary="Single Ticket Example",
 *                 value={"event_id": 1, "tickets": {{"ticket_category_id": 1, "ticket_type": "single_entry", "price": 199.99, "total_available": 100, "max_per_user": 5}}}
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Event Step 2 saved successfully. Returns all created tickets with complete details including category_name and calculated available_quantity.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event Step 2 saved successfully"),
 *                 @OA\Property(
 *                     property="tickets",
 *                     type="array",
 *                     description="Array of all created tickets with complete details",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="ticket_id", type="integer", example=1),
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="ticket_category_id", type="integer", example=1),
 *                         @OA\Property(property="category_name", type="string", example="Early Bird", description="Category name retrieved from ticket_categories table"),
 *                         @OA\Property(property="ticket_type", type="string", enum={"single_entry", "multiple_entry"}, example="single_entry"),
 *                         @OA\Property(property="description", type="string", nullable=true, example="Limited time offer"),
 *                         @OA\Property(property="price", type="string", example="199.99", description="Price as string"),
 *                         @OA\Property(property="total_available", type="integer", example=100),
 *                         @OA\Property(property="sold_quantity", type="integer", example=0, description="Always 0 for newly created tickets"),
 *                         @OA\Property(property="available_quantity", type="integer", example=100, description="Calculated: total_available - sold_quantity"),
 *                         @OA\Property(property="ticket_info", type="string", nullable=true, example="Includes access to VIP area..."),
 *                         @OA\Property(property="max_per_user", type="integer", example=5)
 *                     ),
 *                     example={{"ticket_id": 1, "event_id": 1, "ticket_category_id": 1, "category_name": "Early Bird", "ticket_type": "single_entry", "description": "Limited time offer", "price": "199.99", "total_available": 100, "sold_quantity": 0, "available_quantity": 100, "ticket_info": "Includes VIP access", "max_per_user": 5}}
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001) or Business logic error (E004). Request validation failed, event is published, tickets have been sold, or categories don't belong to event.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed. E004: Business logic errors - indicates event is published, tickets have been sold, or categories don't belong to event"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *
 *                             @OA\Property(
 *                                 property="tickets.0.ticket_category_id",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The tickets.0.ticket category id field is required.", "The selected tickets.0.ticket category id is invalid."}
 *                             ),
 *
 *                             @OA\Property(
 *                                 property="tickets.0.price",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The tickets.0.price must be a number.", "The tickets.0.price must be at least 0."}
 *                             )
 *                         ),
 *
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message",
 *                             example="Tickets can only be managed for draft events"
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Sold tickets error message",
 *                             example="Cannot modify tickets once they have been sold. Please contact support if you need to make changes."
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Invalid categories error message",
 *                             example="One or more ticket categories do not belong to this event"
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
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to update it")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred while saving event Step 2. This could be due to database connection issues, transaction failures, or other server-side exceptions.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while saving event Step 2")
 *             )
 *         )
 *     )
 * )
 */
class SaveEventStep2
{
    // Save Event Step 2 API documentation
}
