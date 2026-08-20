<?php

namespace App\Documentation\Swagger\Authentication;

/**
 * @OA\Post(
 *     path="/v1/host_user_login",
 *     summary="Host User Login",
 *     description="Authenticates Host User using email and password, generates Laravel Sanctum authentication token, and returns complete user information including business details if applicable. Supports Remember Me functionality for extended session management.
 *
 * **Authentication Flow:**
 * 1. Request validation: Validates email format and password presence
 * 2. User lookup: Queries host_users table by email address to find the user record
 * 3. User existence check: If user not found, returns E003 authentication error (401 Unauthorized)
 * 4. Password verification: Uses Laravel's Hash::check() to verify provided password against stored bcrypt hash
 * 5. Password validation: If password is incorrect, returns E003 authentication error (401 Unauthorized)
 * 6. Block status verification: If the host has been blocked by a Super Admin, the API returns E004 with the stored block reason (or a generic message) and halts authentication
 * 7. Remember Me processing: Determines token expiration based on remember_me value (flexible format support)
 * 8. Token generation: Creates Laravel Sanctum token with appropriate expiration:
 *    - If remember_me is true: Token expires in 30 days (extended session)
 *    - If remember_me is false/not provided: Token expires in 1 hour (regular session)
 *    - Token name: host-user-token
 *    - Token abilities: all permissions
 * 9. Business information retrieval: If user is linked to a business (business_id is not null), queries businesses table and includes business details in response
 * 10. Response preparation: Returns success response with user_info object, token, and success message
 *
 * **Remember Me Functionality:**
 * The API accepts remember_me in multiple formats for flexibility:
 * - Boolean true: Token expires in 30 days
 * - String true: Token expires in 30 days
 * - String 1: Token expires in 30 days
 * - Integer 1: Token expires in 30 days
 * - Any other value or not provided: Token expires in 1 hour
 *
 * **Token Usage:**
 * - Token must be included in subsequent authenticated API requests
 * - Token can be sent in either format:
 *   - Header: token: {token_value}
 *   - Header: Authorization: Bearer {token_value}
 * - Token expiration is enforced by Laravel Sanctum
 * - Expired tokens will result in 401 Unauthorized responses
 *
 * **Business Information Inclusion:**
 * - Business information is only included in the response if the user is linked to a business (business_id is not null)
 * - Business object contains: `business_name` and `account_type` (either 'business' or 'personal')
 * - If user is not linked to a business, the `business` property is not included in the response
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for invalid email format or missing required fields
 * - Authentication errors (401): E003 error code for user not found or incorrect password (same message for security)
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
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
 *                 required={"email", "password"},
 *
 *                 @OA\Property(
 *                     property="email",
 *                     type="string",
 *                     format="email",
 *                     example="john.doe@example.com",
 *                     description="Email address used during registration. For business accounts, this is the Business Email. For personal accounts, this is the Email Address. Must be a valid email format. Validation rule: 'required|email'"
 *                 ),
 *                 @OA\Property(
 *                     property="password",
 *                     type="string",
 *                     format="password",
 *                     example="SecurePass123!",
 *                     description="User password in plain text. Password is verified against stored bcrypt hash using Laravel's Hash::check(). Validation rule: 'required'"
 *                 ),
 *                 @OA\Property(
 *                     property="remember_me",
 *                     type="string",
 *                     nullable=true,
 *                     example="true",
 *                     description="Remember Me option for extended session management. Accepts multiple formats: Boolean true, String true, String 1, Integer 1 (all result in 30-day token expiration). Any other value, false, or not provided results in 1-hour token expiration.
 *
 * The API processes this field flexibly to handle different client implementations. Validation rule: 'nullable'"
 *                 )
 *             ),
 *
 *             @OA\Examples(
 *                 example="WithRememberMe",
 *                 summary="Login with Remember Me (Boolean)",
 *                 description="Example request with remember_me as boolean true. Token will expire in 30 days.",
 *                 value={
 *                     "email": "john.doe@example.com",
 *                     "password": "SecurePass123!",
 *                     "remember_me": true
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="WithoutRememberMe",
 *                 summary="Login without Remember Me",
 *                 description="Example request without remember_me field. Token will expire in 1 hour.",
 *                 value={
 *                     "email": "john.doe@example.com",
 *                     "password": "SecurePass123!"
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="RememberMeString",
 *                 summary="Login with Remember Me (String)",
 *                 description="Example request with remember_me as string 'true'. Token will expire in 30 days.",
 *                 value={
 *                     "email": "john.doe@example.com",
 *                     "password": "SecurePass123!",
 *                     "remember_me": "true"
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="RememberMeOne",
 *                 summary="Login with Remember Me (String '1')",
 *                 description="Example request with remember_me as string '1'. Token will expire in 30 days.",
 *                 value={
 *                     "email": "john.doe@example.com",
 *                     "password": "SecurePass123!",
 *                     "remember_me": "1"
 *                 }
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Login successful. User authenticated and token generated. Returns complete user information and authentication token.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true, description="Indicates successful authentication"),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Logged In Successfully", description="Success confirmation message"),
 *                 @OA\Property(
 *                     property="user_info",
 *                     type="object",
 *                     description="Complete user information object. Contains all user profile fields and optionally business information.",
 *                     @OA\Property(property="host_user_id", type="integer", example=1, description="Unique identifier for the host user"),
 *                     @OA\Property(property="first_name", type="string", example="John", description="User's first name"),
 *                     @OA\Property(property="last_name", type="string", example="Doe", description="User's last name"),
 *                     @OA\Property(property="email", type="string", example="john.doe@example.com", description="User's email address (login credential)"),
 *                     @OA\Property(property="profile_image", type="string", nullable=true, example=null, description="File path to profile image in storage/public directory, or null if not uploaded"),
 *                     @OA\Property(property="phone_number", type="string", nullable=true, example=null, description="User's phone number, or null if not provided"),
 *                     @OA\Property(property="website", type="string", nullable=true, example=null, description="User's website URL, or null if not provided"),
 *                     @OA\Property(property="location", type="string", nullable=true, example=null, description="User's location, or null if not provided"),
 *                     @OA\Property(property="business_id", type="integer", nullable=true, example=1, description="Business ID if user is linked to a business, or null if not linked"),
 *                     @OA\Property(property="is_primary", type="boolean", example=true, description="Indicates if user is the primary business owner. true if user created the business, false if added as team member"),
 *                     @OA\Property(
 *                         property="business",
 *                         type="object",
 *                         nullable=true,
 *                         description="Business information object. Only present if user is linked to a business (business_id is not null). Contains business details retrieved from businesses table.",
 *                         @OA\Property(property="business_name", type="string", example="ABC Events Company", description="Name of the business"),
 *                         @OA\Property(property="account_type", type="string", enum={"business", "personal"}, example="business", description="Original account type when business was created. Can be 'business' or 'personal'")
 *                     )
 *                 ),
 *                 @OA\Property(property="token", type="string", example="1|abcdefghijklmnopqrstuvwxyz1234567890", description="Laravel Sanctum authentication token. Format: '{token_id}|{hashed_token}'. Include this token in the 'token' header or 'Authorization: Bearer' header for all subsequent authenticated API requests. Token expiration depends on remember_me value: 30 days if remember_me is true, 1 hour otherwise.")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Email format or required field validation failed.",
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
 *                         property="email",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The email field is required.", "The email must be a valid email address."},
 *                         description="Error messages for email field validation failures"
 *                     ),
 *
 *                     @OA\Property(
 *                         property="password",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The password field is required."},
 *                         description="Error messages for password field validation failures"
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003). User authentication failed. This error is returned for both 'user not found' and 'incorrect password' scenarios to prevent user enumeration attacks. The same error message is used for security purposes.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed authentication"),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that authentication failed. This can occur in two scenarios: 1) User with provided email does not exist in host_users table, 2) Password provided does not match the stored password hash"),
 *                 @OA\Property(property="error_message", type="string", example="Invalid email or password", description="Generic authentication error message. Same message is returned for both 'user not found' and 'incorrect password' scenarios for security purposes")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=403,
 *         description="Blocked host error (E004). Returned when the requested host account is blocked by a Super Admin. The response includes the stored block reason if available, otherwise a generic message instructing the host to contact support.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed login due to block status"),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E004", description="E004: Business logic/authorization restriction indicating the host is blocked"),
 *                 @OA\Property(property="error_message", type="string", example="KYC verification failed. Contact support.", description="Detailed block reason if provided by Super Admin, otherwise a generic 'You are blocked by the admin. Please contact support.' message")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred during authentication. This could be due to database connection issues, token generation failures, or other server-side exceptions.",
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
class HostUserLogin
{
    // Host User Login API documentation
}
