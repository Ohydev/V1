<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Get(
 *     path="/v1/get_super_admin_profile",
 *     summary="Get Super Admin Profile",
 *     description="Returns the authenticated Super Admin's profile information. Requires valid Sanctum token (token header or Authorization Bearer). Response includes first name, last name, phone number, and profile image path. Email is read-only.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum":{}}},
 *
 *     @OA\Response(
 *         response=200,
 *         description="Profile retrieved successfully.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Profile information retrieved successfully"),
 *                 @OA\Property(
 *                     property="super_admin_info",
 *                     type="object",
 *                     @OA\Property(property="super_admin_id", type="integer", example=1),
 *                     @OA\Property(property="email", type="string", example="owner@ohy.com"),
 *                     @OA\Property(property="first_name", type="string", example="Platform"),
 *                     @OA\Property(property="last_name", type="string", example="Owner"),
 *                     @OA\Property(property="phone_number", type="string", nullable=true, example="+1 555 0100"),
 *                     @OA\Property(property="profile_image", type="string", nullable=true, example="super_admins/1/profile_image_1732500000.jpg")
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=401,
 *         description="Authentication required.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     )
 * )
 */
class GetSuperAdminProfile
{
    // Documentation class for Get Super Admin Profile API
}
