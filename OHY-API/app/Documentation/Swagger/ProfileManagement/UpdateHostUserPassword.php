<?php

namespace App\Documentation\Swagger\ProfileManagement;

/**
 * @OA\Post(
 *     path="/v1/update_host_user_password",
 *     summary="Update Host User Password",
 *     description="Updates password for authenticated Host User. Validates current password, enforces strict password requirements, and updates password in database. Password is manually hashed before storage because update() bypasses model casts.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. User existence check: Queries host_users table by host_user_id to verify user exists
 * 3. Request validation: Validates all password fields (current_password, new_password, confirm_new_password)
 * 4. Current password verification: Uses Laravel's Hash::check() to verify provided current password against stored bcrypt hash
 * 5. Password validation: If current password is incorrect, returns E003 authentication error (401 Unauthorized)
 * 6. Password hashing: New password is manually hashed using Hash::make() before update
 *    - Note: update() method bypasses model's 'hashed' cast, so manual hashing is required
 *    - Model's Hashed cast only works with create() or save() on model instances, not with query builder update()
 * 7. Database update: Updates host_users.password field with hashed password
 * 8. Response preparation: Returns success message only (no sensitive data included)
 *
 * **Password Security Requirements:**
 * - Minimum 8 characters in length
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character from the set: @$!%*?&
 * - Regex pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
 * - Custom error message: 'The new password must be at least 8 characters long and contain both letters and numbers.'
 *
 * **Current Password Verification:**
 * - Current password is verified using Hash::check(plain_password, hashed_password)
 * - Accesses password attribute directly from model (bypasses Hashed cast for verification)
 * - If current password is incorrect, returns E003 authentication error (401 Unauthorized)
 * - Same error code and message used for security (prevents user enumeration)
 *
 * **Password Hashing:**
 * - New password is hashed using Laravel's Hash::make() before database update
 * - Uses bcrypt algorithm (default Laravel hashing)
 * - Manual hashing is required because update_host_user_data() uses Model::where()->update() which bypasses model casts
 * - Model's 'hashed' cast only works with create() or save() on model instances
 *
 * **Response Security:**
 * - Response does not include any password information (neither current nor new)
 * - Only success message is returned
 * - No sensitive data is exposed in response
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures (password requirements, confirmation mismatch)
 * - Authentication errors (401): E003 error code if user not authenticated or current password is incorrect
 * - Not found errors (404): E404 error code if user not found in database
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Host Profile Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="application/json",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"current_password", "new_password", "confirm_new_password"},
 *                 @OA\Property(
 *                     property="current_password",
 *                     type="string",
 *                     format="password",
 *                     example="OldSecurePass123!",
 *                     description="Current password in plain text. Required field. Password is verified against stored bcrypt hash using Laravel's Hash::check(). If incorrect, returns E003 authentication error (401 Unauthorized). Validation rule: 'required'"
 *                 ),
 *                 @OA\Property(
 *                     property="new_password",
 *                     type="string",
 *                     format="password",
 *                     minLength=8,
 *                     example="NewSecurePass456!",
 *                     description="New password in plain text. Required field. Must meet strict security requirements:
 * - Minimum 8 characters in length
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character from the set: @$!%*?&
 * - Regex pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
 * - Custom error message: 'The new password must be at least 8 characters long and contain both letters and numbers.'
 * - Password is manually hashed using Hash::make() before storage (update() bypasses model casts)
 * - Validation rules: 'required|min:8|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/'"
 *                 ),
 *                 @OA\Property(
 *                     property="confirm_new_password",
 *                     type="string",
 *                     format="password",
 *                     example="NewSecurePass456!",
 *                     description="Password confirmation field. Required field. Must exactly match the 'new_password' field. Validation rule: 'required|same:new_password'"
 *                 )
 *             ),
 *             @OA\Examples(
 *                 example="PasswordUpdate",
 *                 summary="Password Update Example",
 *                 value={"current_password": "OldSecurePass123!", "new_password": "NewSecurePass456!", "confirm_new_password": "NewSecurePass456!"}
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Password updated successfully. Returns success message only (no sensitive data).",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Password updated successfully")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Returns detailed error messages for password requirements or confirmation mismatch.",
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
 *                         property="new_password",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The new password must be at least 8 characters long and contain both letters and numbers.", "The new password field is required."}
 *                     ),
 *                     @OA\Property(
 *                         property="confirm_new_password",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The confirm new password field must match new password."}
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003). User authentication failed or current password is incorrect. Same error message used for both scenarios to prevent user enumeration.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that authentication failed. This can occur in two scenarios: 1) User not authenticated (token missing/invalid/expired), 2) Current password provided is incorrect"),
 *                 @OA\Property(property="error_message", type="string", example="Current password is incorrect")
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
 *         description="Internal server error (E002). An unexpected error occurred during password update. This could be due to database connection issues, hashing failures, or other server-side exceptions.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while updating your password")
 *             )
 *         )
 *     )
 * )
 */
class UpdateHostUserPassword
{
    // Update Host User Password API documentation
}

