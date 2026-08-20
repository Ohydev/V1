<?php

namespace App\Documentation\Swagger\ProfileManagement;

/**
 * @OA\Post(
 *     path="/v1/update_user_profile",
 *     summary="Update User Profile",
 *     description="Allows authenticated End Users to update their profile information, including full name, contact number, and optionally upload a new profile image. This endpoint handles profile updates with file upload support, automatic old file deletion, and database transactions to ensure data consistency. Protected route - requires authentication via Laravel Sanctum token.
 *
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates request fields:
 *    - full_name: required|string|max:255 (Full name is required, must be string, maximum 255 characters)
 *    - contact_number: nullable|string|max:255 (Contact number is optional, must be string if provided, maximum 255 characters)
 *    - profile_image: nullable|image|mimes:jpeg,jpg,gif,png|max:2048 (Profile image is optional, must be image file, supported formats: jpeg, jpg, gif, png, maximum 2MB (2048 KB))
 * 3. User retrieval: Gets authenticated user from request object (set by middleware)
 * 4. Update data preparation: Prepares update data array with:
 *    - full_name: From request data
 *    - contact_number: From request data (null if not provided)
 * 5. Profile image handling (if provided):
 *    - File validation: Checks if profile_image file is present in request using hasFile() method
 *    - File retrieval: Gets uploaded file from request using file() method
 *    - User ID retrieval: Gets user_id for directory path construction
 *    - File extension: Gets original file extension using getClientOriginalExtension()
 *    - Filename generation: Generates unique filename as 'profile_image_' + timestamp + '.' + extension (e.g., 'profile_image_1234567890.jpg')
 *    - Directory path: Constructs directory path as 'users/' + user_id (e.g., 'users/1')
 *    - Directory creation: Creates user directory in storage/public if it doesn't exist using Storage::disk('public')->makeDirectory()
 *    - Old file retrieval: Gets old profile image path from user model (if exists)
 *    - File storage: Stores new profile image file using storeAs() method in storage/public/users/{user_id}/ directory
 *    - Database path storage: Stores relative file path in database as 'users/{user_id}/profile_image_{timestamp}.{ext}'
 *    - Old file deletion: Deletes old profile image file from storage if exists using Storage::disk('public')->delete()
 *    - Update data: Adds profile_image path to update data array
 * 6. Query condition preparation: Prepares query condition array with user_id to find user record
 * 7. Database transaction: Begins transaction to ensure data consistency
 *    - Updates user profile data in database using update_user_data method with query condition and update data
 *    - Commits transaction if all operations succeed
 *    - Rolls back transaction on any error to maintain data integrity
 * 8. User model refresh: Refreshes user model to get updated data from database using refresh() method
 * 9. Response formatting: Prepares updated user profile data array with:
 *    - user_id: User's unique identifier
 *    - full_name: Updated full name
 *    - email: User's email address (read-only, login credential)
 *    - contact_number: Updated contact number
 *    - profile_image: Updated profile image path (if uploaded)
 * 10. Success response: Returns formatted user profile data with updated fields
 *
 * **File Upload Handling:**
 * - File validation: Validates file type (image), mime types (jpeg, jpg, gif, png), and file size (max 2MB = 2048 KB)
 * - Storage location: Files stored in storage/public/users/{user_id}/ directory
 * - Filename format: profile_image_{timestamp}.{extension} (e.g., profile_image_1234567890.jpg)
 * - Directory creation: User directory created automatically if doesn't exist
 * - Old file cleanup: Previous profile image automatically deleted when new one uploaded
 * - Database storage: Relative file path stored in database (e.g., 'users/1/profile_image_1234567890.jpg')
 *
 * **Database Operations:**
 * - Transaction: All database operations wrapped in transaction to ensure atomicity
 * - Update operation: Updates user record in users table with new profile data
 * - Model refresh: User model refreshed after update to get latest data
 *
 * **Data Transformations:**
 * - File path: Absolute file path converted to relative path for database storage
 * - Contact number: Null value stored if not provided in request
 *
 * **Security Considerations:**
 * - Requires valid Sanctum token in request header (Authorization: Bearer {token} or token: {token})
 * - Only authenticated user can update their own profile
 * - File upload validation prevents malicious file uploads
 * - File size limit prevents storage abuse
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if full_name, contact_number, or profile_image validation fails
 * - Server Error (500): Returns E002 error code if database operation fails or file upload/storage fails",
 *     tags={"End User - Profile Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\RequestBody(
 *         required=true,
 *         description="User profile update data with optional file upload",
 *
 *         @OA\MediaType(
 *             mediaType="multipart/form-data",
 *
 *             @OA\Schema(
 *                 type="object",
 *                 required={"full_name"},
 *
 *                 @OA\Property(
 *                     property="full_name",
 *                     type="string",
 *                     maxLength=255,
 *                     description="User's full name. **Required field.** Validation rule: 'required|string|max:255'. Must be a string with maximum 255 characters.",
 *                     example="John Doe"
 *                 ),
 *                 @OA\Property(
 *                     property="contact_number",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     description="User's contact phone number. **Optional field.** Validation rule: 'nullable|string|max:255'. Must be a string with maximum 255 characters if provided. Can be null if not provided.",
 *                     example="+1234567890"
 *                 ),
 *                 @OA\Property(
 *                     property="profile_image",
 *                     type="string",
 *                     format="binary",
 *                     nullable=true,
 *                     description="Profile image file. **Optional field.** Validation rule: 'nullable|image|mimes:jpeg,jpg,gif,png|max:2048'. Must be an image file with one of the following formats: jpeg, jpg, gif, png. Maximum file size: 2MB (2048 KB). If provided, old profile image will be automatically deleted. File will be stored in storage/public/users/{user_id}/ directory with filename format: profile_image_{timestamp}.{extension}",
 *                     example="profile_image.jpg"
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Profile updated successfully",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Profile updated successfully"),
 *                 @OA\Property(
 *                     property="user_profile",
 *                     type="object",
 *                     description="Updated user profile information",
 *                     @OA\Property(property="user_id", type="integer", example=1, description="User's unique identifier"),
 *                     @OA\Property(property="full_name", type="string", example="John Doe", description="Updated full name"),
 *                     @OA\Property(property="email", type="string", format="email", example="john.doe@example.com", description="User's email address (read-only, login credential, not updated)"),
 *                     @OA\Property(property="contact_number", type="string", nullable=true, example="+1234567890", description="Updated contact phone number (nullable, may be null)"),
 *                     @OA\Property(property="profile_image", type="string", nullable=true, example="users/1/profile_image_1234567890.jpg", description="Updated profile image file path stored in storage/public directory (nullable, may be null if not uploaded)")
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error occurred",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="Error code for validation errors"),
 *                 @OA\Property(property="error_message", type="object", description="Validation error messages for each field that failed validation. Format: object with field names as keys and arrays of error messages as values.")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Server error occurred",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="Error code for server errors"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while updating user profile", description="Error message describing what went wrong")
 *             )
 *         )
 *     )
 * )
 */
class UpdateUserProfile
{
    // Empty class - annotations are in docblock
}
