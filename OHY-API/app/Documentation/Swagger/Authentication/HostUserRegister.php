<?php

namespace App\Documentation\Swagger\Authentication;

/**
 * @OA\Post(
 *     path="/v1/host_user_register",
 *     summary="Host User Registration",
 *     description="Creates a new Host User account for either Business or Personal account types. This API handles the complete registration flow using database transactions to ensure data consistency.
 *
 * **Registration Flow:**
 * 1. Request validation: Validates all required fields, email format, password strength, and email uniqueness
 * 2. Database transaction begins: All database operations are wrapped in a transaction
 * 3. Host user record creation: Creates a new record in the `host_users` table with email, password (automatically hashed by model), first_name, last_name
 * 4. Business account handling: If account_type is 'business', creates a business record in the `businesses` table and links it to the host user by setting `business_id` and `is_primary = true`
 * 5. Personal account handling: If account_type is 'personal', no business record is created initially (can be added later in profile section)
 * 6. Transaction commit: If all operations succeed, transaction is committed; otherwise, all changes are rolled back
 *
 * **Password Security:**
 * - Password is automatically hashed using Laravel's bcrypt before storage (handled by model's Hashed cast)
 * - Password must meet strict requirements: minimum 8 characters, at least one uppercase letter, one lowercase letter, one number, and one special character from the set (@$!%*?&)
 *
 * **Email Uniqueness:**
 * - Email must be unique within the `host_users` table
 * - Same email can exist in other tables (e.g., `users` table for End Users)
 *
 * **Account Types:**
 * - **Business Account**: Requires `business_name` field. Business record is created immediately during registration with `account_type = 'business'`. User is linked to business and set as primary owner (`is_primary = true`)
 * - **Personal Account**: Does not require `business_name`. No business record is created during registration. Business information can be added later in the profile section
 *
 * **Response:**
 * - Success (200): Returns confirmation message 'Account created successfully'
 * - Validation Error (400): Returns E001 error code with detailed validation error messages
 * - Server Error (500): Returns E002 error code if any exception occurs during processing",
 *     tags={"Authentication API"},
 *
 *     @OA\RequestBody(
 *         required=true,
 *
 *         @OA\MediaType(
 *             mediaType="application/json",
 *
 *             @OA\Schema(
 *                 type="object",
 *                 required={"account_type", "first_name", "last_name", "email", "password", "confirm_password"},
 *
 *                 @OA\Property(
 *                     property="account_type",
 *                     type="string",
 *                     enum={"business", "personal"},
 *                     example="business",
 *                     description="Account type selection. Must be either 'business' or 'personal'. Determines whether business record is created during registration."
 *                 ),
 *                 @OA\Property(
 *                     property="first_name",
 *                     type="string",
 *                     minLength=1,
 *                     example="John",
 *                     description="First name of the host user. Required field. No specific length restrictions."
 *                 ),
 *                 @OA\Property(
 *                     property="last_name",
 *                     type="string",
 *                     minLength=1,
 *                     example="Doe",
 *                     description="Last name of the host user. Required field. No specific length restrictions."
 *                 ),
 *                 @OA\Property(
 *                     property="email",
 *                     type="string",
 *                     format="email",
 *                     example="john.doe@example.com",
 *                     description="Email address used for login. For business accounts, this is the Business Email. For personal accounts, this is the Email Address. Must be a valid email format and must be unique in the `host_users` table. Validation rule: 'required|email|unique:host_users,email'"
 *                 ),
 *                 @OA\Property(
 *                     property="password",
 *                     type="string",
 *                     format="password",
 *                     minLength=8,
 *                     example="SecurePass123!",
 *                     description="User password. Must meet strict security requirements:
 * - Minimum 8 characters in length
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character from the set: @$!%*?&
 * - Regex pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
 * - Password is automatically hashed using bcrypt before storage (handled by model's Hashed cast)
 * - Custom error message: 'The password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&), and be at least 8 characters long.'"
 *                 ),
 *                 @OA\Property(
 *                     property="confirm_password",
 *                     type="string",
 *                     format="password",
 *                     example="SecurePass123!",
 *                     description="Password confirmation field. Must exactly match the 'password' field. Required field. Validation rule: 'required|same:password'"
 *                 ),
 *                 @OA\Property(
 *                     property="business_name",
 *                     type="string",
 *                     minLength=1,
 *                     example="ABC Events Company",
 *                     description="Business/company name. **Required only when account_type is 'business'**. Not required for personal accounts. Validation rule: 'required_if:account_type,business'. When provided for business accounts, a business record is created in the `businesses` table with this name and `account_type = 'business'`"
 *                 )
 *             ),
 *
 *             @OA\Examples(
 *                 example="BusinessAccount",
 *                 summary="Business Account Registration",
 *                 description="Example request for registering a business account. Note that business_name is required.",
 *                 value={
 *                     "account_type": "business",
 *                     "first_name": "John",
 *                     "last_name": "Doe",
 *                     "email": "john.doe@business.com",
 *                     "password": "SecurePass123!",
 *                     "confirm_password": "SecurePass123!",
 *                     "business_name": "ABC Events Company"
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="PersonalAccount",
 *                 summary="Personal Account Registration",
 *                 description="Example request for registering a personal account. Note that business_name is not required and should not be included.",
 *                 value={
 *                     "account_type": "personal",
 *                     "first_name": "Jane",
 *                     "last_name": "Smith",
 *                     "email": "jane.smith@example.com",
 *                     "password": "MySecure123!",
 *                     "confirm_password": "MySecure123!"
 *                 }
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Registration successful. Account has been created and all database operations completed successfully.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true, description="Indicates successful operation"),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Account created successfully", description="Success confirmation message")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Returns detailed error messages for each field that failed validation.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed operation"),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     description="Validation error messages object. Keys are field names, values are arrays of error messages for that field.",
 *                     @OA\Property(
 *                         property="account_type",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The account type field is required.", "The selected account type is invalid."},
 *                         description="Error messages for account_type field validation failures"
 *                     ),
 *
 *                     @OA\Property(
 *                         property="first_name",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The first name field is required."},
 *                         description="Error messages for first_name field validation failures"
 *                     ),
 *
 *                     @OA\Property(
 *                         property="last_name",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The last name field is required."},
 *                         description="Error messages for last_name field validation failures"
 *                     ),
 *
 *                     @OA\Property(
 *                         property="email",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The email field is required.", "The email must be a valid email address.", "The email has already been taken."},
 *                         description="Error messages for email field validation failures. Can include: required, invalid format, or uniqueness violation"
 *                     ),
 *
 *                     @OA\Property(
 *                         property="password",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The password field is required.", "The password must be at least 8 characters.", "The password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&), and be at least 8 characters long."},
 *                         description="Error messages for password field validation failures. Can include: required, minimum length, or regex pattern validation"
 *                     ),
 *
 *                     @OA\Property(
 *                         property="confirm_password",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The confirm password field is required.", "The confirm password field must match password."},
 *                         description="Error messages for confirm_password field validation failures. Can include: required or mismatch with password"
 *                     ),
 *
 *                     @OA\Property(
 *                         property="business_name",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The business name field is required when account type is business."},
 *                         description="Error messages for business_name field validation failures. Only appears when account_type is 'business' and business_name is missing"
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred during account creation. This could be due to database connection issues, transaction failures, or other server-side exceptions. All database changes are rolled back if transaction fails.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed operation"),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while processing your request", description="Generic error message. Detailed error information is logged server-side for debugging")
 *             )
 *         )
 *     )
 * )
 */
class HostUserRegister
{
    // Host User Registration API documentation
}
