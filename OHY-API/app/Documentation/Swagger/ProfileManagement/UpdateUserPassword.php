<?php

namespace App\Documentation\Swagger\ProfileManagement;

/**
 * @OA\Post(
 *     path="/v1/update_user_password",
 *     summary="Update User Password",
 *     description="Allows authenticated End Users to change their password. This endpoint handles password update with comprehensive validation, current password verification, password hashing using Laravel's bcrypt algorithm, and database transactions to ensure data consistency. Protected route - requires authentication via Laravel Sanctum token.
 *
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates request fields:
 *    - current_password: required (Current password is required)
 *    - new_password: required|string|min:8|regex:/^(?=.*[A-Za-z])(?=.*\d)/ (New password is required, minimum 8 characters, must contain both letters and numbers)
 *    - confirm_password: required|same:new_password (Confirm password is required, must match new_password field)
 * 3. User retrieval: Gets authenticated user from request object (set by middleware)
 * 4. Current password verification: Uses Hash::check() method to verify current password:
 *    - Compares plain text current_password from request with hashed password stored in database
 *    - Hash::check() uses bcrypt algorithm to securely compare passwords
 *    - If current password is incorrect, returns 401 error (E003) with error message 'Current password is incorrect'
 * 5. Password hashing: If current password is correct, hashes new password:
 *    - Uses Laravel Hash facade (Hash::make()) to hash new password
 *    - Hash::make() uses bcrypt algorithm with automatic salt generation
 *    - Hashed password is stored in database (plain text password is never stored)
 * 6. Update data preparation: Prepares update data array with hashed new password
 * 7. Query condition preparation: Prepares query condition array with user_id to find user record
 * 8. Database transaction: Begins transaction to ensure data consistency
 *    - Updates user password in database using update_user_data method with query condition and update data
 *    - Commits transaction if all operations succeed
 *    - Rolls back transaction on any error to maintain data integrity
 * 9. Success response: Returns success message only (no user data returned for security)
 *
 * **Password Security:**
 * - Password hashing: Uses Laravel Hash facade with bcrypt algorithm (one-way hashing, cannot be reversed)
 * - Password requirements: Minimum 8 characters, must contain both letters and numbers
 * - Regex pattern: /^(?=.*[A-Za-z])(?=.*\d)/ (ensures at least one letter and one number)
 * - Current password verification: Uses Hash::check() to securely compare plain text with stored hash
 * - Password storage: Only hashed password stored in database, plain text never stored
 * - Response security: No user data returned in response (only success message)
 *
 * **Password Validation Rules:**
 * - current_password: Required field, no format validation (any string accepted)
 * - new_password: Required, minimum 8 characters, must match regex pattern /^(?=.*[A-Za-z])(?=.*\d)/
 *   - Must contain at least one letter (A-Z or a-z)
 *   - Must contain at least one number (0-9)
 *   - Minimum length: 8 characters
 * - confirm_password: Required, must exactly match new_password field (validation rule: 'same:new_password')
 *
 * **Database Operations:**
 * - Transaction: All database operations wrapped in transaction to ensure atomicity
 * - Update operation: Updates password field in users table with hashed new password
 * - Password field: Only password field updated, other user fields remain unchanged
 *
 * **Security Considerations:**
 * - Requires valid Sanctum token in request header (Authorization: Bearer {token} or token: {token})
 * - Only authenticated user can update their own password
 * - Current password must be verified before allowing password change
 * - Password hashing ensures plain text passwords are never stored
 * - Response does not include user data for additional security
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if current_password, new_password, or confirm_password validation fails
 * - Authentication Error (401): Returns E003 error code if current password is incorrect (Hash::check() returns false)
 * - Server Error (500): Returns E002 error code if database operation fails",
 *     tags={"End User - Profile Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\RequestBody(
 *         required=true,
 *         description="Password update data with current password, new password, and confirmation",
 *
 *         @OA\JsonContent(
 *             type="object",
 *             required={"current_password", "new_password", "confirm_password"},
 *
 *             @OA\Property(
 *                 property="current_password",
 *                 type="string",
 *                 format="password",
 *                 description="User's current password. **Required field.** Validation rule: 'required'. Must match the password currently stored in the database. This field is verified using Hash::check() to securely compare with the stored hashed password.",
 *                 example="CurrentPass123"
 *             ),
 *             @OA\Property(
 *                 property="new_password",
 *                 type="string",
 *                 format="password",
 *                 minLength=8,
 *                 description="User's new password. **Required field.** Validation rule: 'required|string|min:8|regex:/^(?=.*[A-Za-z])(?=.*\d)/'. Must meet strict security requirements:
 * - Minimum 8 characters
 * - Must contain at least one letter (A-Z or a-z)
 * - Must contain at least one number (0-9)
 * - Regex pattern: /^(?=.*[A-Za-z])(?=.*\d)/
 * The new password will be hashed using Laravel's bcrypt algorithm before storage.",
 *                 example="NewPass123"
 *             ),
 *             @OA\Property(
 *                 property="confirm_password",
 *                 type="string",
 *                 format="password",
 *                 description="Confirmation of the new password. **Required field.** Validation rule: 'required|same:new_password'. Must exactly match the new_password field. Used to prevent password typos during password change.",
 *                 example="NewPass123"
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Password updated successfully",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Password updated successfully", description="Success message confirming password update. No user data is returned in the response for security reasons.")
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
 *         response=401,
 *         description="Current password is incorrect",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003", description="Error code for authentication errors"),
 *                 @OA\Property(property="error_message", type="string", example="Current password is incorrect", description="Error message indicating that the provided current password does not match the stored password")
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while updating password", description="Error message describing what went wrong")
 *             )
 *         )
 *     )
 * )
 */
class UpdateUserPassword
{
    // Empty class - annotations are in docblock
}
