<?php

namespace App\Documentation\Swagger\EventCreation\EventMembersManagement;

/**
 * @OA\Post(
 *     path="/v1/save_event_step_4",
 *     summary="Save Event Step 4 (Event Members/Artists)",
 *     description="Saves all artists/speakers for Step 4 of the event creation wizard. This API uses a 'replace all' approach: it deletes all existing artists (and their social media links) for the event and creates new ones from the provided artists array. This simplifies frontend logic by sending the final desired state of all artists. Uses database transactions to ensure data consistency. Only draft events can have artists updated.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id and artists array with nested validation for each artist and their social media links
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Draft check: Verifies event is draft (is_published = false, is_draft = true)
 * 5. Database transaction begins: All database operations are wrapped in a transaction
 * 6. **Replace All Pattern**:
 *    - Retrieves all existing artists for the event
 *    - Deletes old artist images from storage before deleting records
 *    - Deletes all existing artists (cascade delete automatically removes social media links)
 *    - Creates all new artists from the artists array
 * 7. Artist processing (for each artist in array):
 *    - Creates artist record with name and optional image
 *    - Handles artist image upload (if provided): stores in storage/public/artists/{event_id}/ directory
 *    - Creates social media links for the artist (if provided)
 * 8. Social media processing (for each artist):
 *    - Validates platform enum and URL format
 *    - Creates social media link records linked to the artist
 * 9. Transaction commit: If all operations succeed, transaction is committed
 * 10. Response formatting: Formats all created artists with their social media links
 * 11. Transaction rollback: If any error occurs, all changes are rolled back
 *
 * **Replace All Pattern:**
 * - This API uses a 'replace all' approach instead of create/update/delete individual artists
 * - Frontend sends the complete desired state of all artists
 * - All existing artists are deleted (including their images and social media links), then all new artists are created
 * - Simplifies frontend logic - no need to track individual artist changes
 * - Artists array can be empty (deletes all artists)
 *
 * **Event Ownership & Draft Check:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - Only draft events can have artists updated (is_published = false, is_draft = true)
 * - Published events cannot have artists updated (returns E004 error)
 *
 * **Artist Image Handling:**
 * - Artist image is optional for each artist
 * - If provided: Image is uploaded and stored
 * - If not provided: artist_image is set to null
 * - Old images are automatically deleted from storage before replacement
 * - File storage path: storage/public/artists/{event_id}/{filename}
 * - File naming: artist_image_{timestamp}_{uniqid}.{extension} for uniqueness
 * - File size limit: Max 3MB (3072 KB) per image
 * - Supported formats: JPEG, PNG, JPG, GIF
 * - Recommended size: 1080x1080 pixels
 *
 * **Social Media Links:**
 * - Social media array is optional for each artist
 * - Each social media link requires: platform (enum) and url (valid URL format)
 * - Supported platforms: facebook, instagram, tiktok, linkedin, snapchat, twitter, youtube, spotify
 * - Spotify is optional platform (only for artists, not events)
 * - URL must be valid URL format, maximum 500 characters
 * - Multiple social media links can be added per artist
 *
 * **Nested Array Validation:**
 * - Artists array: required, can be empty (min:0)
 * - Each artist: artist_name (required), artist_image (optional), social_media (optional array)
 * - Each social media link: platform (required, enum), url (required, valid URL)
 * - Validation uses Laravel's nested array validation: 'artists.0.artist_name', 'artists.0.social_media.0.platform', etc.
 *
 * **Empty Artists Array:**
 * - Artists array can be empty (min:0 validation)
 * - Empty array means: delete all existing artists, create no new artists
 * - Useful for clearing all artists from an event
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures (nested array validation)
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Business logic errors (400): E004 error code if event is published (not draft)
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Event Members Management API"},
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
 *                 required={"event_id", "artists"},
 *
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Event ID to save artists for. Required field. Must exist in events table and belong to authenticated host user. Validation rule: 'required|integer|exists:events,event_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="artists",
 *                     type="array",
 *                     minItems=0,
 *                     description="Array of artist objects. Required field. Can be empty array (deletes all artists). Each artist object represents one artist/speaker. All existing artists are deleted and replaced with artists in this array. Validation rule: 'required|array|min:0'",
 *
 *                     @OA\Items(
 *                         type="object",
 *                         required={"artist_name"},
 *
 *                         @OA\Property(
 *                             property="artist_name",
 *                             type="string",
 *                             maxLength=255,
 *                             example="John Doe",
 *                             description="Name of the artist/speaker. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                         ),
 *                         @OA\Property(
 *                             property="artist_image",
 *                             type="string",
 *                             format="binary",
 *                             nullable=true,
 *                             description="Artist image file. Optional field. Must be an image file in one of the following formats: JPEG, PNG, JPG, GIF. Maximum file size: 3MB (3072 KB). Recommended size: 1080x1080 pixels. File stored in storage/public/artists/{event_id}/{filename}. Validation rule: 'nullable|image|mimes:jpeg,png,jpg,gif|max:3072'"
 *                         ),
 *                         @OA\Property(
 *                             property="social_media",
 *                             type="array",
 *                             nullable=true,
 *                             description="Array of social media links for this artist. Optional field. Can be set to null or empty array. Each social media link requires platform and url.",
 *
 *                             @OA\Items(
 *                                 type="object",
 *                                 required={"platform", "url"},
 *
 *                                 @OA\Property(
 *                                     property="platform",
 *                                     type="string",
 *                                     enum={"facebook", "instagram", "tiktok", "linkedin", "snapchat", "twitter", "youtube", "spotify"},
 *                                     example="instagram",
 *                                     description="Social media platform. Required field. Must be one of the valid platforms. Spotify is optional platform (only for artists). Validation rule: 'required|in:facebook,instagram,tiktok,linkedin,snapchat,twitter,youtube,spotify'"
 *                                 ),
 *                                 @OA\Property(
 *                                     property="url",
 *                                     type="string",
 *                                     format="uri",
 *                                     maxLength=500,
 *                                     example="https://instagram.com/@artistname",
 *                                     description="Full URL to social media profile/page. Required field. Must be valid URL format. Maximum 500 characters. Validation rule: 'required|url|max:500'"
 *                                 )
 *                             ),
 *                             example={{"platform": "instagram", "url": "https://instagram.com/@artistname"}, {"platform": "spotify", "url": "https://open.spotify.com/artist/123"}}
 *                         )
 *                     ),
 *                     example={
 *                         {
 *                             "artist_name": "John Doe",
 *                             "artist_image": "(binary file)",
 *                             "social_media": {
 *                                 {"platform": "instagram", "url": "https://instagram.com/@johndoe"},
 *                                 {"platform": "spotify", "url": "https://open.spotify.com/artist/123"}
 *                             }
 *                         },
 *                         {
 *                             "artist_name": "Jane Smith",
 *                             "social_media": {
 *                                 {"platform": "facebook", "url": "https://facebook.com/janesmith"}
 *                             }
 *                         }
 *                     }
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Event Step 4 saved successfully. Returns all created artists with their social media links.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event Step 4 saved successfully"),
 *                 @OA\Property(
 *                     property="artists",
 *                     type="array",
 *                     description="Array of all created artists with their social media links",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="event_artist_id", type="integer", example=1),
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="artist_name", type="string", example="John Doe"),
 *                         @OA\Property(property="artist_image", type="string", nullable=true, example="artists/1/artist_image_1234567890_abc123.jpg", description="File path or null"),
 *                         @OA\Property(
 *                             property="social_media",
 *                             type="array",
 *                             description="Array of social media links for this artist",
 *
 *                             @OA\Items(
 *                                 type="object",
 *
 *                                 @OA\Property(property="artist_social_media_id", type="integer", example=1),
 *                                 @OA\Property(property="event_artist_id", type="integer", example=1),
 *                                 @OA\Property(property="platform", type="string", enum={"facebook", "instagram", "tiktok", "linkedin", "snapchat", "twitter", "youtube", "spotify"}, example="instagram"),
 *                                 @OA\Property(property="url", type="string", example="https://instagram.com/@artistname")
 *                             ),
 *                             example={{"artist_social_media_id": 1, "event_artist_id": 1, "platform": "instagram", "url": "https://instagram.com/@artistname"}}
 *                         )
 *                     ),
 *                     example={{"event_artist_id": 1, "event_id": 1, "artist_name": "John Doe", "artist_image": "artists/1/artist_image_1234567890_abc123.jpg", "social_media": {{"artist_social_media_id": 1, "event_artist_id": 1, "platform": "instagram", "url": "https://instagram.com/@artistname"}}}}
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
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed. E004: Business logic errors - indicates event is published and artists cannot be updated"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *
 *                             @OA\Property(
 *                                 property="artists.0.artist_name",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The artists.0.artist name field is required."}
 *                             ),
 *
 *                             @OA\Property(
 *                                 property="artists.0.social_media.0.platform",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The artists.0.social media.0.platform must be one of the following: facebook, instagram, tiktok, linkedin, snapchat, twitter, youtube, spotify."}
 *                             ),
 *
 *                             @OA\Property(
 *                                 property="artists.0.artist_image",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The artists.0.artist image must be an image.", "The artists.0.artist image must not be greater than 3072 kilobytes."}
 *                             )
 *                         ),
 *
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message",
 *                             example="Artists can only be managed for draft events"
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
 *         description="Internal server error (E002). An unexpected error occurred while saving event Step 4. This could be due to database connection issues, file storage failures, transaction failures, or other server-side exceptions.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while saving event Step 4")
 *             )
 *         )
 *     )
 * )
 */
class SaveEventStep4
{
    // Save Event Step 4 API documentation
}
