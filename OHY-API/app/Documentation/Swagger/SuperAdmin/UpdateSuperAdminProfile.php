<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Post(
 *     path="/v1/update_super_admin_profile",
 *     summary="Update Super Admin Profile",
 *     description="Updates first name, last name, phone number, and profile image for the authenticated Super Admin. Email address remains read-only. Profile images are stored in storage/public/super_admins/{id}.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum":{}}},
 *
 *     @OA\RequestBody(
 *         required=true,
 *
 *         @OA\MediaType(
 *             mediaType="multipart/form-data",
 *
 *             @OA\Schema(
 *                 type="object",
 *                 required={"first_name","last_name"},
 *
 *                 @OA\Property(property="first_name", type="string", maxLength=255, example="Platform"),
 *                 @OA\Property(property="last_name", type="string", maxLength=255, example="Owner"),
 *                 @OA\Property(property="phone_number", type="string", nullable=true, example="+1 555 0100"),
 *                 @OA\Property(
 *                     property="profile_image",
 *                     type="string",
 *                     format="binary",
 *                     nullable=true,
 *                     description="Optional profile image. Allowed types: jpeg, jpg, png, gif. Max 2MB."
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Profile updated successfully.",
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
 *                     property="super_admin_info",
 *                     type="object",
 *                     @OA\Property(property="super_admin_id", type="integer", example=1),
 *                     @OA\Property(property="email", type="string", example="owner@ohy.com"),
 *                     @OA\Property(property="first_name", type="string", example="Platform"),
 *                     @OA\Property(property="last_name", type="string", example="Owner"),
 *                     @OA\Property(property="phone_number", type="string", nullable=true, example="+1 555 0100"),
 *                     @OA\Property(property="profile_image", type="string", nullable=true, example="super_admins/1/profile_image_1732501111.jpg")
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001).",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     example={"first_name":{"The first name field is required."}}
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003).",
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
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Server error (E002).",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
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
class UpdateSuperAdminProfile
{
    // Documentation class for Update Super Admin Profile API
}
