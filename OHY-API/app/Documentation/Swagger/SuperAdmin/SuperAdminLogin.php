<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Post(
 *     path="/v1/super_admin_login",
 *    summary="Super Admin Login",
 *     description="Authenticates Super Admin using email/password, generates Sanctum token, and returns Super Admin profile information. Token expiration is controlled by the remember_me flag using Carbon-based date handling (1 hour default, 30 days when remember_me=true).",
 *     tags={"Super Admin API"},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="application/json",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"email","password"},
 *                 @OA\Property(
 *                     property="email",
 *                     type="string",
 *                     format="email",
 *                     example="owner@ohy.com",
 *                     description="Super Admin login email. Validation: required|email."
 *                 ),
 *                 @OA\Property(
 *                     property="password",
 *                     type="string",
 *                     format="password",
 *                     example="SuperSecure@123",
 *                     description="Super Admin password in plain text. Validation: required."
 *                 ),
 *                 @OA\Property(
 *                     property="remember_me",
 *                     type="string",
 *                     nullable=true,
 *                     example="true",
 *                     description="Optional remember me flag. Treat values such as boolean true, the string true, the string 1, or the integer 1 as extended sessions (30 days). Any other input or omission keeps the token valid for 1 hour. Carbon handles the expiration timestamps."
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Login successful.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Logged In Successfully"),
 *                 @OA\Property(
 *                     property="super_admin_info",
 *                     type="object",
 *                     @OA\Property(property="super_admin_id", type="integer", example=1),
 *                     @OA\Property(property="email", type="string", example="owner@ohy.com"),
 *                     @OA\Property(property="first_name", type="string", example="Platform"),
 *                     @OA\Property(property="last_name", type="string", example="Owner"),
 *                     @OA\Property(property="phone_number", type="string", nullable=true, example="+1 555 0100"),
 *                     @OA\Property(property="profile_image", type="string", nullable=true, example="super_admins/1/profile_image_1732500000.jpg")
 *                 ),
 *                 @OA\Property(property="token", type="string", example="1|abcdefghijklmnopqrstuvwxyz123456")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001).",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     example={"email":{"The email field is required."}}
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003).",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003"),
 *                 @OA\Property(property="error_message", type="string", example="Invalid email or password")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Server error (E002).",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while processing your request")
 *             )
 *         )
 *     )
 * )
 */
class SuperAdminLogin
{
    // Super Admin Login API documentation
}

