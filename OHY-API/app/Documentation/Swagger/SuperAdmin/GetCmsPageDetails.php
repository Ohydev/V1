<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Get(
 *     path="/v1/get_cms_page_details",
 *     summary="Get CMS Page Details",
 *     description="Retrieves complete details of a single CMS page by its ID. This endpoint is accessible only to authenticated Super Admins and provides full CMS page information including title, slug, rich text content, active status, and timestamps. Used for viewing or editing a specific CMS page in the admin panel.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Parameter(
 *         name="cms_page_id",
 *         in="query",
 *         required=true,
 *         description="Unique identifier of the CMS page to retrieve",
 *
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="CMS page retrieved successfully",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="CMS page retrieved successfully"),
 *                 @OA\Property(
 *                     property="cms_page",
 *                     type="object",
 *                     @OA\Property(property="cms_page_id", type="integer", example=1),
 *                     @OA\Property(property="title", type="string", example="Terms & Conditions"),
 *                     @OA\Property(property="slug", type="string", example="terms-and-conditions"),
 *                     @OA\Property(property="content", type="string", example="<p>Rich text HTML content from WYSIWYG editor...</p>"),
 *                     @OA\Property(property="is_active", type="boolean", example=true),
 *                     @OA\Property(property="created_at", type="string", example="28-11-2025 12:00:00"),
 *                     @OA\Property(property="updated_at", type="string", example="28-11-2025 12:00:00")
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001)",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001"),
 *                 @OA\Property(property="error_message", type="object", example={"cms_page_id": {"The cms page id field is required."}})
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003)",
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
 *         response=404,
 *         description="CMS page not found (E404)",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", example="CMS page not found")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Server error (E002)",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving CMS page")
 *             )
 *         )
 *     )
 * )
 */
class GetCmsPageDetails
{
    // Empty class for Swagger annotations
}
