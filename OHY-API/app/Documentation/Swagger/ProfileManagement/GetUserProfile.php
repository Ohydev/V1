<?php

namespace App\Documentation\Swagger\ProfileManagement;

/**
 * @OA\Get(
 *     path="/v1/get_user_profile",
 *     summary="Get User Profile",
 *     description="Retrieves the profile information for the authenticated End User, including full name, email, contact number, and profile image. This endpoint retrieves the authenticated user's profile data from the database and returns it in a formatted response. Protected route - requires authentication via Laravel Sanctum token.
 * 
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. User retrieval: Gets authenticated user from request object (set by middleware)
 * 3. Profile data formatting: Prepares user profile data array with:
 *    - user_id: User's unique identifier
 *    - full_name: User's full name
 *    - email: User's email address (read-only, login credential)
 *    - contact_number: User's contact phone number (nullable, may be null)
 *    - profile_image: File path to profile picture (nullable, may be null)
 * 4. Response formatting: Excludes sensitive fields (password, remember_token) from response
 * 5. Success response: Returns formatted user profile data
 * 
 * **Security Considerations:**
 * - Requires valid Sanctum token in request header (Authorization: Bearer {token} or token: {token})
 * - Only authenticated user can access their own profile
 * - Password and other sensitive fields are excluded from response
 * 
 * **Data Relationships:**
 * - User profile data is retrieved directly from users table
 * - No related data is loaded (simple profile retrieval)
 * 
 * **Error Scenarios:**
 * - If authentication fails: Middleware returns 401 error (not handled in controller)
 * - If server error occurs: Returns 500 error with error code E002",
 *     tags={"End User - Profile Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="User profile retrieved successfully",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="User profile retrieved successfully"),
 *                 @OA\Property(
 *                     property="user_profile",
 *                     type="object",
 *                     description="User profile information",
 *                     @OA\Property(property="user_id", type="integer", example=1, description="User's unique identifier"),
 *                     @OA\Property(property="full_name", type="string", example="John Doe", description="User's full name"),
 *                     @OA\Property(property="email", type="string", format="email", example="john.doe@example.com", description="User's email address (read-only, login credential)"),
 *                     @OA\Property(property="contact_number", type="string", nullable=true, example="+1234567890", description="User's contact phone number (nullable, may be null)"),
 *                     @OA\Property(property="profile_image", type="string", nullable=true, example="users/1/profile_image_1234567890.jpg", description="File path to profile picture stored in storage/public directory (nullable, may be null)")
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Server error occurred",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="Error code for server errors"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving user profile", description="Error message describing what went wrong")
 *             )
 *         )
 *     )
 * )
 */
class GetUserProfile
{
    // Empty class - annotations are in docblock
}

