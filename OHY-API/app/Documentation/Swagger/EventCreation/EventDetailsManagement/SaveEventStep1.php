<?php

namespace App\Documentation\Swagger\EventCreation\EventDetailsManagement;

/**
 * @OA\Post(
 *     path="/v1/save_event_step_1",
 *     summary="Save Event Step 1 (Event Details)",
 *     description="Saves or updates event basic information, media files, and social media links for Step 1 of the event creation wizard. Supports both create (new event) and update (existing draft event) operations. Uses database transactions to ensure data consistency. All media files are stored in storage/public/events/{event_id}/{media_type}/ directory.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Create/Update determination: Checks if event_id is provided to determine operation type
 * 3. Request validation: Validates all provided fields including file uploads and social media URLs
 * 4. Database transaction begins: All database operations are wrapped in a transaction
 * 5. **Update Mode** (if event_id provided):
 *    - Verifies event exists and belongs to authenticated host user
 *    - Verifies event is draft (is_published = false, is_draft = true)
 *    - Updates existing event record with new data
 * 6. **Create Mode** (if event_id not provided):
 *    - Creates new event record with is_draft = true, is_published = false
 *    - Gets created event_id for media processing
 * 7. Media file processing (if provided):
 *    - **Thumbnail**: Single file, replaces existing if updating
 *    - **Banner**: Single file, replaces existing if updating
 *    - **Flyer**: Multiple files allowed, replaces all existing if updating
 *    - **Video**: Multiple files allowed (max 50MB each), replaces all existing if updating
 *    - Old files are deleted from storage before new ones are uploaded
 *    - Files stored with unique filenames: {media_type}_{timestamp}_{uniqid}.{extension}
 * 8. Social media links processing:
 *    - For each platform (Facebook, Instagram, TikTok, LinkedIn, Snapchat, Twitter, YouTube):
 *      - If URL provided: Creates new record or updates existing
 *      - If URL empty/not provided: Deletes existing record if exists
 * 9. Transaction commit: If all operations succeed, transaction is committed
 * 10. Response formatting: Formats dates as d-m-Y, times as H:i, includes is_new_event flag
 * 11. Transaction rollback: If any error occurs, all changes are rolled back
 *
 * **Create vs Update Logic:**
 * - **Create Mode**: event_id not provided or empty. Creates new event, sets is_draft = true, is_published = false
 * - **Update Mode**: event_id provided and exists. Updates existing event, preserves draft status
 * - Response includes is_new_event flag: true for create, false for update
 *
 * **Event Ownership & Draft Check:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - Only draft events can be updated (is_published = false, is_draft = true)
 * - Published events cannot be updated through this API (returns E004 error)
 *
 * **Media File Handling:**
 * - All media files are optional
 * - Thumbnail and Banner: Single file each, replaces existing when updating
 * - Flyer and Video: Multiple files allowed, replaces all existing when updating
 * - Old files are automatically deleted from storage before new uploads
 * - File storage path: storage/public/events/{event_id}/{media_type}/{filename}
 * - File naming: {media_type}_{timestamp}_{uniqid}.{extension} for uniqueness
 * - Video files: Max 50MB each (51200 KB), formats: mp4, avi, mov, wmv, flv
 * - Image files: Max 5MB each (5120 KB), formats: jpeg, png, jpg, gif
 *
 * **Social Media Links:**
 * - All social media URLs are optional
 * - Platform mapping: facebook_url → 'facebook', instagram_url → 'instagram', etc.
 * - Create/Update/Delete logic: URL provided = create/update, URL empty = delete
 * - Each platform can have only one URL per event
 *
 * **Date and Time Formatting:**
 * - Dates formatted as d-m-Y (e.g., '15-12-2025') in response
 * - Times formatted as H:i (e.g., '09:00') in response (hours and minutes only)
 * - Input validation: start_date must be today or future, end_date must be after or equal to start_date
 * - Time format: H:i:s (HH:MM:SS) for input validation
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Business logic errors (400): E004 error code if event is published (not draft)
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Event Details Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\RequestBody(
 *         required=true,
 *
 *         @OA\MediaType(
 *             mediaType="multipart/form-data",
 *
 *             @OA\Schema(
 *                 type="object",
 *                 required={"event_title", "description", "event_category_id", "start_date", "end_date", "start_time", "end_time"},
 *
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     nullable=true,
 *                     example=1,
 *                     description="Event ID for update operation. Optional field. If provided, updates existing draft event. If not provided or empty, creates new event. Must exist in events table if provided. Validation rule: 'nullable|integer|exists:events,event_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="event_title",
 *                     type="string",
 *                     maxLength=255,
 *                     example="Summer Music Festival 2025",
 *                     description="Event title/name. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="description",
 *                     type="string",
 *                     example="Join us for an amazing summer music festival featuring top artists...",
 *                     description="Event description in rich text format. Required field. Supports HTML/JSON formatting to preserve styling (bold, italic, bullet points, etc.). Formatting is preserved exactly as entered. Validation rule: 'required|string'"
 *                 ),
 *                 @OA\Property(
 *                     property="event_category_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Event category ID. Required field. Must exist in event_categories table. Validation rule: 'required|integer|exists:event_categories,event_category_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="start_date",
 *                     type="string",
 *                     format="date",
 *                     example="2025-12-15",
 *                     description="Event start date. Required field. Must be a valid date in YYYY-MM-DD format. Must be today or future date. Validation rule: 'required|date|after_or_equal:today'. Response format: d-m-Y (e.g., '15-12-2025')"
 *                 ),
 *                 @OA\Property(
 *                     property="end_date",
 *                     type="string",
 *                     format="date",
 *                     example="2025-12-16",
 *                     description="Event end date. Required field. Must be a valid date in YYYY-MM-DD format. Must be after or equal to start_date. Validation rule: 'required|date|after_or_equal:start_date'. Response format: d-m-Y (e.g., '16-12-2025')"
 *                 ),
 *                 @OA\Property(
 *                     property="start_time",
 *                     type="string",
 *                     example="09:00:00",
 *                     description="Event start time. Required field. Must be in HH:MM:SS format (24-hour). Validation rule: 'required|date_format:H:i:s'. Response format: H:i (e.g., '09:00') - hours and minutes only"
 *                 ),
 *                 @OA\Property(
 *                     property="end_time",
 *                     type="string",
 *                     example="18:00:00",
 *                     description="Event end time. Required field. Must be in HH:MM:SS format (24-hour). Validation rule: 'required|date_format:H:i:s'. Response format: H:i (e.g., '18:00') - hours and minutes only"
 *                 ),
 *                 @OA\Property(
 *                     property="key_highlights",
 *                     type="string",
 *                     nullable=true,
 *                     example="• Top artists performing\n• Food and drinks available\n• Free parking",
 *                     description="Key highlights of the event in rich text format. Optional field. Supports HTML/JSON formatting to preserve styling. Can be set to null. Validation rule: 'nullable|string'"
 *                 ),
 *                 @OA\Property(
 *                     property="event_thumbnail",
 *                     type="string",
 *                     format="binary",
 *                     nullable=true,
 *                     description="Event thumbnail image file. Optional field. Single file only. Must be an image file in one of the following formats: JPEG, PNG, JPG, GIF. Maximum file size: 5MB (5120 KB). If provided when updating, old thumbnail is automatically deleted. File stored in storage/public/events/{event_id}/thumbnail/{filename}. Validation rule: 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120'"
 *                 ),
 *                 @OA\Property(
 *                     property="event_banner",
 *                     type="string",
 *                     format="binary",
 *                     nullable=true,
 *                     description="Event banner image file. Optional field. Single file only. Must be an image file in one of the following formats: JPEG, PNG, JPG, GIF. Maximum file size: 5MB (5120 KB). If provided when updating, old banner is automatically deleted. File stored in storage/public/events/{event_id}/banner/{filename}. Validation rule: 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120'"
 *                 ),
 *                 @OA\Property(
 *                     property="event_flyer",
 *                     type="array",
 *                     nullable=true,
 *
 *                     @OA\Items(type="string", format="binary"),
 *                     description="Event flyer image files. Optional field. Multiple files allowed (array). Each file must be an image in one of the following formats: JPEG, PNG, JPG, GIF. Maximum file size per file: 5MB (5120 KB). If provided when updating, all old flyers are automatically deleted. Files stored in storage/public/events/{event_id}/flyer/{filename}. Validation rule: 'nullable|array' for array, 'image|mimes:jpeg,png,jpg,gif|max:5120' for each file"
 *                 ),
 *
 *                 @OA\Property(
 *                     property="event_video",
 *                     type="array",
 *                     nullable=true,
 *
 *                     @OA\Items(type="string", format="binary"),
 *                     description="Event video files. Optional field. Multiple files allowed (array). Each file must be a video in one of the following formats: MP4, AVI, MOV, WMV, FLV. Maximum file size per file: 50MB (51200 KB). If provided when updating, all old videos are automatically deleted. Files stored in storage/public/events/{event_id}/video/{filename}. Validation rule: 'nullable|array' for array, 'mimes:mp4,avi,mov,wmv,flv|max:51200' for each file"
 *                 ),
 *
 *                 @OA\Property(
 *                     property="facebook_url",
 *                     type="string",
 *                     format="uri",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="https://facebook.com/eventpage",
 *                     description="Facebook page/profile URL. Optional field. Must be valid URL format if provided. Maximum 500 characters. If provided, creates or updates social media record. If empty/not provided, deletes existing record if exists. Validation rule: 'nullable|url|max:500'"
 *                 ),
 *                 @OA\Property(
 *                     property="instagram_url",
 *                     type="string",
 *                     format="uri",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="https://instagram.com/eventpage",
 *                     description="Instagram profile URL. Optional field. Must be valid URL format if provided. Maximum 500 characters. If provided, creates or updates social media record. If empty/not provided, deletes existing record if exists. Validation rule: 'nullable|url|max:500'"
 *                 ),
 *                 @OA\Property(
 *                     property="tiktok_url",
 *                     type="string",
 *                     format="uri",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="https://tiktok.com/@eventpage",
 *                     description="TikTok profile URL. Optional field. Must be valid URL format if provided. Maximum 500 characters. If provided, creates or updates social media record. If empty/not provided, deletes existing record if exists. Validation rule: 'nullable|url|max:500'"
 *                 ),
 *                 @OA\Property(
 *                     property="linkedin_url",
 *                     type="string",
 *                     format="uri",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="https://linkedin.com/company/eventpage",
 *                     description="LinkedIn page/profile URL. Optional field. Must be valid URL format if provided. Maximum 500 characters. If provided, creates or updates social media record. If empty/not provided, deletes existing record if exists. Validation rule: 'nullable|url|max:500'"
 *                 ),
 *                 @OA\Property(
 *                     property="snapchat_url",
 *                     type="string",
 *                     format="uri",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="https://snapchat.com/add/eventpage",
 *                     description="Snapchat profile URL. Optional field. Must be valid URL format if provided. Maximum 500 characters. If provided, creates or updates social media record. If empty/not provided, deletes existing record if exists. Validation rule: 'nullable|url|max:500'"
 *                 ),
 *                 @OA\Property(
 *                     property="twitter_url",
 *                     type="string",
 *                     format="uri",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="https://twitter.com/eventpage",
 *                     description="Twitter/X profile URL. Optional field. Must be valid URL format if provided. Maximum 500 characters. If provided, creates or updates social media record. If empty/not provided, deletes existing record if exists. Validation rule: 'nullable|url|max:500'"
 *                 ),
 *                 @OA\Property(
 *                     property="youtube_url",
 *                     type="string",
 *                     format="uri",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="https://youtube.com/channel/eventpage",
 *                     description="YouTube channel/profile URL. Optional field. Must be valid URL format if provided. Maximum 500 characters. If provided, creates or updates social media record. If empty/not provided, deletes existing record if exists. Validation rule: 'nullable|url|max:500'"
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Event Step 1 saved successfully. Returns event data with formatted dates and times, and is_new_event flag.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event Step 1 saved successfully"),
 *                 @OA\Property(
 *                     property="event",
 *                     type="object",
 *                     @OA\Property(property="event_id", type="integer", example=1),
 *                     @OA\Property(property="event_title", type="string", example="Summer Music Festival 2025"),
 *                     @OA\Property(property="description", type="string", example="Join us for an amazing summer music festival..."),
 *                     @OA\Property(property="event_category_id", type="integer", example=1),
 *                     @OA\Property(property="start_date", type="string", example="15-12-2025", description="Formatted as d-m-Y"),
 *                     @OA\Property(property="end_date", type="string", example="16-12-2025", description="Formatted as d-m-Y"),
 *                     @OA\Property(property="start_time", type="string", example="09:00", description="Formatted as H:i (hours:minutes)"),
 *                     @OA\Property(property="end_time", type="string", example="18:00", description="Formatted as H:i (hours:minutes)"),
 *                     @OA\Property(property="key_highlights", type="string", nullable=true, example="• Top artists performing"),
 *                     @OA\Property(property="is_draft", type="boolean", example=true, description="Always true for Step 1"),
 *                     @OA\Property(property="is_published", type="boolean", example=false, description="Always false for Step 1"),
 *                     @OA\Property(property="is_new_event", type="boolean", example=true, description="true if event was created, false if updated")
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
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed. E004: Business logic errors - indicates event is published and cannot be updated"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *
 *                             @OA\Property(
 *                                 property="event_title",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The event title field is required."}
 *                             ),
 *
 *                             @OA\Property(
 *                                 property="start_date",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The start date must be a date after or equal to today."}
 *                             ),
 *
 *                             @OA\Property(
 *                                 property="event_thumbnail",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The event thumbnail must be an image.", "The event thumbnail must not be greater than 5120 kilobytes."}
 *                             )
 *                         ),
 *
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message",
 *                             example="Only draft events can be updated through this API"
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
 *         description="Internal server error (E002). An unexpected error occurred during event save. This could be due to database connection issues, file storage failures, transaction failures, or other server-side exceptions.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while saving event Step 1")
 *             )
 *         )
 *     )
 * )
 */
class SaveEventStep1
{
    // Save Event Step 1 API documentation
}
