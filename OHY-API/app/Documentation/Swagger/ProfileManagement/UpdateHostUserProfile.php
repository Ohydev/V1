<?php

namespace App\Documentation\Swagger\ProfileManagement;

/**
 * @OA\Post(
 *     path="/v1/update_host_user_profile",
 *     summary="Update Host User Profile",
 *     description="Updates personal information for authenticated Host User including profile image, name, phone number, website, and location. Email address is readonly and cannot be updated. Supports multipart/form-data for file uploads.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. User existence check: Queries host_users table by host_user_id to verify user exists
 * 3. Request validation: Validates all provided fields (first_name, last_name required; others optional)
 * 4. Profile image handling (if provided):
 *    - Deletes old profile image from storage if exists
 *    - Generates unique filename with timestamp: profile_image_{timestamp}.{extension}
 *    - Stores file in storage/public/host_users/{host_user_id}/ directory
 *    - Updates profile_image field with file path
 * 5. Data preparation: Prepares update data array with provided fields (only updates fields that are provided)
 * 6. Database update: Updates host_users record using model method
 * 7. Response preparation: Returns updated user_info object with all profile fields
 *
 * **Email Address:**
 * - Email address is readonly and cannot be updated through this API
 * - Email serves as login credential and is preserved in the response
 *
 * **Profile Image Upload:**
 * - Supports multipart/form-data content type for file uploads
 * - Accepted formats: JPEG, JPG, GIF, PNG
 * - Maximum file size: 2MB (2048 KB)
 * - Old profile image is automatically deleted when new one is uploaded
 * - File stored in: storage/public/host_users/{host_user_id}/profile_image_{timestamp}.{extension}
 * - File path is stored in database and can be accessed via asset('storage/' . file_path)
 *
 * **Partial Updates:**
 * - Only provided fields are updated (partial updates supported)
 * - Optional fields can be set to null to clear them
 * - Required fields (first_name, last_name) must always be provided
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if user not found in database
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Host Profile Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="multipart/form-data",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"first_name", "last_name"},
 *                 @OA\Property(
 *                     property="first_name",
 *                     type="string",
 *                     maxLength=255,
 *                     example="John",
 *                     description="First name of the host user. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="last_name",
 *                     type="string",
 *                     maxLength=255,
 *                     example="Doe",
 *                     description="Last name of the host user. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="phone_number",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="+1234567890",
 *                     description="Contact phone number. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="website",
 *                     type="string",
 *                     format="uri",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="https://www.example.com",
 *                     description="Personal or business website URL. Optional field. Must be a valid URL format if provided. Can be set to null to clear the field. Maximum 255 characters. Validation rule: 'nullable|url|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="location",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="New York, NY",
 *                     description="Location information. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="profile_image",
 *                     type="string",
 *                     format="binary",
 *                     nullable=true,
 *                     description="Profile image file. Optional field. Must be an image file in one of the following formats: JPEG, JPG, GIF, PNG. Maximum file size: 2MB (2048 KB). If provided, old profile image is automatically deleted. File is stored in storage/public/host_users/{host_user_id}/profile_image_{timestamp}.{extension}. Validation rule: 'nullable|image|mimes:jpeg,jpg,gif,png|max:2048'"
 *                 )
 *             )
 *         ),
 *         @OA\MediaType(
 *             mediaType="application/json",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"first_name", "last_name"},
 *                 @OA\Property(property="first_name", type="string", maxLength=255, example="John"),
 *                 @OA\Property(property="last_name", type="string", maxLength=255, example="Doe"),
 *                 @OA\Property(property="phone_number", type="string", nullable=true, maxLength=255, example="+1234567890"),
 *                 @OA\Property(property="website", type="string", format="uri", nullable=true, maxLength=255, example="https://www.example.com"),
 *                 @OA\Property(property="location", type="string", nullable=true, maxLength=255, example="New York, NY")
 *             ),
 *             @OA\Examples(
 *                 example="WithOptionalFields",
 *                 summary="Update Profile with Optional Fields",
 *                 value={"first_name": "John", "last_name": "Doe", "phone_number": "+1234567890", "website": "https://www.example.com", "location": "New York, NY"}
 *             ),
 *             @OA\Examples(
 *                 example="MinimalFields",
 *                 summary="Update Profile with Required Fields Only",
 *                 value={"first_name": "John", "last_name": "Doe"}
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Profile updated successfully. Returns updated user information with all profile fields.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Profile updated successfully"),
 *                 @OA\Property(
 *                     property="user_info",
 *                     type="object",
 *                     @OA\Property(property="host_user_id", type="integer", example=1),
 *                     @OA\Property(property="first_name", type="string", example="John"),
 *                     @OA\Property(property="last_name", type="string", example="Doe"),
 *                     @OA\Property(property="email", type="string", format="email", example="john.doe@example.com", description="Email address (readonly, not updated)"),
 *                     @OA\Property(property="profile_image", type="string", nullable=true, example="host_users/1/profile_image_1234567890.jpg", description="Profile image file path or null"),
 *                     @OA\Property(property="phone_number", type="string", nullable=true, example="+1234567890", description="Phone number or null"),
 *                     @OA\Property(property="website", type="string", nullable=true, example="https://www.example.com", description="Website URL or null"),
 *                     @OA\Property(property="location", type="string", nullable=true, example="New York, NY", description="Location or null")
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Returns detailed error messages for each field that failed validation.",
 *         @OA\JsonContent(
 *             type="object",
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
 *                         property="first_name",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The first name field is required.", "The first name must not be greater than 255 characters."}
 *                     ),
 *                     @OA\Property(
 *                         property="website",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The website must be a valid URL."}
 *                     ),
 *                     @OA\Property(
 *                         property="profile_image",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The profile image must be an image.", "The profile image must not be greater than 2048 kilobytes."}
 *                     )
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
 *         description="Not found error (E404). User not found in database.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested user does not exist"),
 *                 @OA\Property(property="error_message", type="string", example="User not found")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred during profile update. This could be due to database connection issues, file storage failures, or other server-side exceptions.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while updating your profile")
 *             )
 *         )
 *     )
 * )
 */
class UpdateHostUserProfile
{
    // Update Host User Profile API documentation
}

