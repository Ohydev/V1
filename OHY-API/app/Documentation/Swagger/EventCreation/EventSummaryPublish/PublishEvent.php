<?php

namespace App\Documentation\Swagger\EventCreation\EventSummaryPublish;

/**
 * @OA\Post(
 *     path="/v1/publish_event",
 *     summary="Publish Event",
 *     description="Publishes an event by updating status flags (is_draft = false, is_published = true). Makes the event visible to End Users on public listing pages. Only draft events can be published. Basic validation is performed (not too rigid) - checks for basic information but doesn't block publishing if missing. Uses database transactions to ensure data consistency.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id parameter (required, must exist in events table)
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Already published check: Checks if event is already published (returns error if already published)
 * 5. Draft check: Verifies event is draft (is_draft = true)
 * 6. Basic validation (not too rigid): Checks for basic information (title, description, category, dates, times) but doesn't block publishing
 * 7. Database transaction begins: All database operations are wrapped in a transaction
 * 8. Status update: Updates event status flags (is_draft = false, is_published = true)
 * 9. Transaction commit: If all operations succeed, transaction is committed
 * 10. Response formatting: Returns updated event data with new status
 * 11. Transaction rollback: If any error occurs, all changes are rolled back
 *
 * **Event Ownership:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - If event doesn't exist or doesn't belong to user, returns E404 error
 *
 * **Publishing Rules:**
 * - Only draft events can be published (is_draft = true)
 * - Already published events cannot be published again (returns E004 error)
 * - Event must not be published already (is_published = false)
 * - Publishing makes event visible to End Users on public listing pages
 *
 * **Basic Validation (Not Too Rigid):**
 * - Checks for basic information: event_title, description, event_category_id, start_date, end_date, start_time, end_time
 * - Validation is performed but doesn't block publishing if information is missing
 * - Warnings can be added in the future but won't prevent publishing
 * - This follows PRD requirement: 'Basic validation (not too rigid)'
 *
 * **Status Update:**
 * - is_draft: Changed from true to false
 * - is_published: Changed from false to true
 * - Event becomes visible to End Users immediately after publishing
 * - Published events remain editable (can be updated after publishing)
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Business logic errors (400): E004 error code if event is already published or not a draft
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Event Summary & Publish Event API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="application/json",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"event_id"},
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Event ID to publish. Required field. Must exist in events table and belong to authenticated host user. Must be a draft event (is_draft = true, is_published = false). Validation rule: 'required|integer|exists:events,event_id'"
 *                 )
 *             ),
 *             @OA\Examples(
 *                 example="PublishEvent",
 *                 summary="Publish Event Example",
 *                 value={"event_id": 1}
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Event published successfully. Returns updated event data with new status flags.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event published successfully"),
 *                 @OA\Property(
 *                     property="event",
 *                     type="object",
 *                     @OA\Property(property="event_id", type="integer", example=1),
 *                     @OA\Property(property="event_title", type="string", example="Summer Music Festival 2025"),
 *                     @OA\Property(property="is_draft", type="boolean", example=false, description="Changed from true to false"),
 *                     @OA\Property(property="is_published", type="boolean", example=true, description="Changed from false to true")
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001) or Business logic error (E004). Request validation failed, event is already published, or event is not a draft.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed. E004: Business logic errors - indicates event is already published or not a draft"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *                             @OA\Property(
 *                                 property="event_id",
 *                                 type="array",
 *                                 @OA\Items(type="string"),
 *                                 example={"The event id field is required.", "The selected event id is invalid."}
 *                             )
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message - already published",
 *                             example="Event is already published"
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message - not a draft",
 *                             example="Only draft events can be published"
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
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to publish it")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred while publishing event. This could be due to database connection issues, transaction failures, or other server-side exceptions.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while publishing event")
 *             )
 *         )
 *     )
 * )
 */
class PublishEvent
{
    // Publish Event API documentation
}

