<?php

namespace App\Documentation\Swagger\EventCreation\VenueManagement;

/**
 * @OA\Post(
 *     path="/v1/save_event_step_3",
 *     summary="Save Event Step 3 (Venue Details)",
 *     description="Saves or updates venue details for Step 3 of the event creation wizard. Uses create/update pattern: checks if venue exists for the event, updates if exists, creates if not. Handles optional venue image upload with automatic old file deletion when updating. Only draft events can have venue updated. Uses database transactions to ensure data consistency.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates all venue fields including coordinates and optional image upload
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Draft check: Verifies event is draft (is_published = false, is_draft = true)
 * 5. Database transaction begins: All database operations are wrapped in a transaction
 * 6. Venue existence check: Checks if venue already exists for this event
 * 7. **Update Mode** (if venue exists):
 *    - Deletes old venue image from storage if new image is uploaded
 *    - Updates existing venue record with new data
 *    - Preserves existing image if no new image uploaded
 * 8. **Create Mode** (if venue doesn't exist):
 *    - Creates new venue record
 *    - Sets venue_image to null if no image uploaded
 * 9. Venue image processing (if provided):
 *    - Validates image file (JPEG, PNG, JPG, GIF, max 5MB)
 *    - Generates unique filename: venue_image_{timestamp}_{uniqid}.{extension}
 *    - Stores file in storage/public/venues/{event_id}/ directory
 *    - Deletes old image if updating
 * 10. Transaction commit: If all operations succeed, transaction is committed
 * 11. Response formatting: Formats coordinates as strings to preserve decimal precision
 * 12. Transaction rollback: If any error occurs, all changes are rolled back
 *
 * **Create vs Update Logic:**
 * - **Create Mode**: Venue doesn't exist for event. Creates new venue record
 * - **Update Mode**: Venue exists for event. Updates existing venue record
 * - Response doesn't indicate create/update mode (same response structure)
 *
 * **Event Ownership & Draft Check:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - Only draft events can have venue updated (is_published = false, is_draft = true)
 * - Published events cannot have venue updated (returns E004 error)
 *
 * **Venue Image Handling:**
 * - Venue image is optional
 * - If provided when updating: Old image is automatically deleted from storage
 * - If not provided when updating: Existing image is preserved
 * - If not provided when creating: venue_image is set to null
 * - File storage path: storage/public/venues/{event_id}/{filename}
 * - File naming: venue_image_{timestamp}_{uniqid}.{extension} for uniqueness
 * - File size limit: Max 5MB (5120 KB)
 * - Supported formats: JPEG, PNG, JPG, GIF
 *
 * **Coordinate Validation:**
 * - Latitude: Must be between -90 and 90 (decimal degrees)
 * - Longitude: Must be between -180 and 180 (decimal degrees)
 * - Coordinates stored as DECIMAL(10,8) for latitude and DECIMAL(11,8) for longitude
 * - Response formats coordinates as strings to preserve decimal precision
 *
 * **Country Relationship:**
 * - country_id must exist in countries table (foreign key)
 * - Country information is retrieved for display purposes
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Business logic errors (400): E004 error code if event is published (not draft)
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Venue Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="multipart/form-data",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"event_id", "venue_name", "venue_address", "city", "state_province", "postal_code", "country_id", "latitude", "longitude", "maximum_attendees"},
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Event ID to save venue for. Required field. Must exist in events table and belong to authenticated host user. Validation rule: 'required|integer|exists:events,event_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="venue_name",
 *                     type="string",
 *                     maxLength=255,
 *                     example="Madison Square Garden",
 *                     description="Venue name. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="venue_address",
 *                     type="string",
 *                     maxLength=255,
 *                     example="4 Pennsylvania Plaza",
 *                     description="Full street address of the venue. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="city",
 *                     type="string",
 *                     maxLength=255,
 *                     example="New York",
 *                     description="City name. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="state_province",
 *                     type="string",
 *                     maxLength=255,
 *                     example="New York",
 *                     description="State or Province. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="postal_code",
 *                     type="string",
 *                     maxLength=20,
 *                     example="10001",
 *                     description="ZIP/Postal code. Required field. Must be a string with maximum 20 characters. Validation rule: 'required|string|max:20'"
 *                 ),
 *                 @OA\Property(
 *                     property="country_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Country ID. Required field. Must exist in countries table (foreign key). Validation rule: 'required|integer|exists:countries,country_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="latitude",
 *                     type="number",
 *                     format="float",
 *                     example=40.7505,
 *                     description="Latitude coordinate for map pinning. Required field. Must be a numeric value between -90 and 90 (decimal degrees). Stored as DECIMAL(10,8) for precision. Response format: string to preserve decimal precision. Validation rule: 'required|numeric|between:-90,90'"
 *                 ),
 *                 @OA\Property(
 *                     property="longitude",
 *                     type="number",
 *                     format="float",
 *                     example=-73.9934,
 *                     description="Longitude coordinate for map pinning. Required field. Must be a numeric value between -180 and 180 (decimal degrees). Stored as DECIMAL(11,8) for precision. Response format: string to preserve decimal precision. Validation rule: 'required|numeric|between:-180,180'"
 *                 ),
 *                 @OA\Property(
 *                     property="maximum_attendees",
 *                     type="integer",
 *                     example=20000,
 *                     description="Maximum number of people who can attend the event. Required field. Must be an integer and at least 1. Validation rule: 'required|integer|min:1'"
 *                 ),
 *                 @OA\Property(
 *                     property="additional_details",
 *                     type="string",
 *                     nullable=true,
 *                     example="Room 101, Floor 2, Parking available, Wheelchair accessible",
 *                     description="Additional venue details (room number, floor, parking, accessibility, etc.). Optional field. Can be set to null. Validation rule: 'nullable|string'"
 *                 ),
 *                 @OA\Property(
 *                     property="venue_image",
 *                     type="string",
 *                     format="binary",
 *                     nullable=true,
 *                     description="Venue image file. Optional field. Must be an image file in one of the following formats: JPEG, PNG, JPG, GIF. Maximum file size: 5MB (5120 KB). If provided when updating, old venue image is automatically deleted. File stored in storage/public/venues/{event_id}/{filename}. Validation rule: 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120'"
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Event Step 3 saved successfully. Returns venue data with coordinates formatted as strings.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event Step 3 saved successfully"),
 *                 @OA\Property(
 *                     property="venue",
 *                     type="object",
 *                     @OA\Property(property="venue_id", type="integer", example=1),
 *                     @OA\Property(property="event_id", type="integer", example=1),
 *                     @OA\Property(property="venue_name", type="string", example="Madison Square Garden"),
 *                     @OA\Property(property="venue_address", type="string", example="4 Pennsylvania Plaza"),
 *                     @OA\Property(property="city", type="string", example="New York"),
 *                     @OA\Property(property="state_province", type="string", example="New York"),
 *                     @OA\Property(property="postal_code", type="string", example="10001"),
 *                     @OA\Property(property="country_id", type="integer", example=1),
 *                     @OA\Property(property="latitude", type="string", example="40.7505", description="Formatted as string to preserve decimal precision"),
 *                     @OA\Property(property="longitude", type="string", example="-73.9934", description="Formatted as string to preserve decimal precision"),
 *                     @OA\Property(property="maximum_attendees", type="integer", example=20000),
 *                     @OA\Property(property="additional_details", type="string", nullable=true, example="Room 101, Floor 2"),
 *                     @OA\Property(property="venue_image", type="string", nullable=true, example="venues/1/venue_image_1234567890_abc123.jpg", description="File path or null")
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
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed. E004: Business logic errors - indicates event is published and venue cannot be updated"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *                             @OA\Property(
 *                                 property="latitude",
 *                                 type="array",
 *                                 @OA\Items(type="string"),
 *                                 example={"The latitude must be between -90 and 90."}
 *                             ),
 *                             @OA\Property(
 *                                 property="venue_image",
 *                                 type="array",
 *                                 @OA\Items(type="string"),
 *                                 example={"The venue image must be an image.", "The venue image must not be greater than 5120 kilobytes."}
 *                             )
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message",
 *                             example="Venue can only be managed for draft events"
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
 *         description="Internal server error (E002). An unexpected error occurred while saving event Step 3. This could be due to database connection issues, file storage failures, transaction failures, or other server-side exceptions.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while saving event Step 3")
 *             )
 *         )
 *     )
 * )
 */
class SaveEventStep3
{
    // Save Event Step 3 API documentation
}

