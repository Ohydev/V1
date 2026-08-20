<?php

namespace App\Documentation\Swagger\EventCreation\TermsConditions;

/**
 * @OA\Post(
 *     path="/v1/save_event_step_5",
 *     summary="Save Event Step 5 (Terms & Conditions)",
 *     description="Saves or updates terms and conditions for Step 5 of the event creation wizard. Uses create/update pattern: checks if terms exist for the event, updates if exists, creates if not. Only one terms document per event (one-to-one relationship). Rich text content preserves formatting (bold, italic, bullet points, etc.). Only draft events can have terms updated. Uses database transactions to ensure data consistency.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id and terms_content fields
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Draft check: Verifies event is draft (is_published = false, is_draft = true)
 * 5. Database transaction begins: All database operations are wrapped in a transaction
 * 6. Terms existence check: Checks if terms already exist for this event
 * 7. **Update Mode** (if terms exist):
 *    - Updates existing terms record with new content
 * 8. **Create Mode** (if terms don't exist):
 *    - Creates new terms record
 * 9. Transaction commit: If all operations succeed, transaction is committed
 * 10. Response formatting: Returns terms data excluding timestamps
 * 11. Transaction rollback: If any error occurs, all changes are rolled back
 *
 * **Create vs Update Logic:**
 * - **Create Mode**: Terms don't exist for event. Creates new terms record
 * - **Update Mode**: Terms exist for event. Updates existing terms record
 * - Response doesn't indicate create/update mode (same response structure)
 * - One terms document per event (one-to-one relationship)
 *
 * **Event Ownership & Draft Check:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - Only draft events can have terms updated (is_published = false, is_draft = true)
 * - Published events cannot have terms updated (returns E004 error)
 *
 * **Rich Text Content:**
 * - Terms content supports rich text formatting (HTML/JSON format)
 * - Formatting is preserved exactly as entered (bold, italic, bullet points, etc.)
 * - Content is stored as TEXT field in database (can handle large content)
 * - Formatting must be preserved when displaying terms to End Users
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Business logic errors (400): E004 error code if event is published (not draft)
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Terms & Conditions API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="application/json",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"event_id", "terms_content"},
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Event ID to save terms for. Required field. Must exist in events table and belong to authenticated host user. Validation rule: 'required|integer|exists:events,event_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="terms_content",
 *                     type="string",
 *                     example="<p><strong>Terms and Conditions</strong></p><ul><li>All ticket sales are final</li><li>No refunds unless event is cancelled</li><li>Attendees must arrive on time</li></ul>",
 *                     description="Terms and conditions content in rich text format. Required field. Supports HTML/JSON formatting to preserve styling (bold, italic, bullet points, etc.). Formatting is preserved exactly as entered. Stored as TEXT field in database (can handle large content). Validation rule: 'required|string'"
 *                 )
 *             ),
 *             @OA\Examples(
 *                 example="RichTextTerms",
 *                 summary="Rich Text Terms Example",
 *                 value={"event_id": 1, "terms_content": "<p><strong>Terms and Conditions</strong></p><ul><li>All ticket sales are final</li><li>No refunds unless event is cancelled</li></ul>"}
 *             ),
 *             @OA\Examples(
 *                 example="SimpleTextTerms",
 *                 summary="Simple Text Terms Example",
 *                 value={"event_id": 1, "terms_content": "By purchasing tickets, you agree to all terms and conditions. All sales are final."}
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Event Step 5 saved successfully. Returns terms data with rich text content.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event Step 5 saved successfully"),
 *                 @OA\Property(
 *                     property="terms",
 *                     type="object",
 *                     @OA\Property(property="event_terms_id", type="integer", example=1),
 *                     @OA\Property(property="event_id", type="integer", example=1),
 *                     @OA\Property(property="terms_content", type="string", example="<p><strong>Terms and Conditions</strong></p><ul><li>All ticket sales are final</li></ul>", description="Rich text content with preserved formatting")
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001) or Business logic error (E004). Request validation failed or event is published.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed. E004: Business logic errors - indicates event is published and terms cannot be updated"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *                             @OA\Property(
 *                                 property="terms_content",
 *                                 type="array",
 *                                 @OA\Items(type="string"),
 *                                 example={"The terms content field is required."}
 *                             )
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message",
 *                             example="Terms can only be managed for draft events"
 *                         )
 *                     }
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
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to update it")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred while saving event Step 5. This could be due to database connection issues, transaction failures, or other server-side exceptions.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while saving event Step 5")
 *             )
 *         )
 *     )
 * )
 */
class SaveEventStep5
{
    // Save Event Step 5 API documentation
}

