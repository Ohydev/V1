<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Get(
 *     path="/v1/get_cms_pages_list",
 *     summary="Get CMS Pages List",
 *     description="Retrieves a paginated list of CMS pages with optional search, filtering, and sorting capabilities. This endpoint is accessible only to authenticated Super Admins and provides comprehensive CMS page management functionality. Supports pagination (default 30 per page), search by title, filter by active status, and sorting by title or creation date.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Parameter(
 *         name="page",
 *         in="query",
 *         required=false,
 *         description="Page number for pagination (default: 1, minimum: 1)",
 *
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *
 *     @OA\Parameter(
 *         name="per_page",
 *         in="query",
 *         required=false,
 *         description="Number of items per page (default: 30, minimum: 1, maximum: 100)",
 *
 *         @OA\Schema(type="integer", example=30)
 *     ),
 *
 *     @OA\Parameter(
 *         name="search",
 *         in="query",
 *         required=false,
 *         description="Search term to filter CMS pages by title (case-insensitive partial match)",
 *
 *         @OA\Schema(type="string", maxLength=255, example="Terms")
 *     ),
 *
 *     @OA\Parameter(
 *         name="is_active",
 *         in="query",
 *         required=false,
 *         description="Filter by active status (true for active pages, false for inactive pages)",
 *
 *         @OA\Schema(type="boolean", example=true)
 *     ),
 *
 *     @OA\Parameter(
 *         name="sort_by",
 *         in="query",
 *         required=false,
 *         description="Field to sort by (options: 'title', 'created_at'). Default: 'created_at'",
 *
 *         @OA\Schema(type="string", enum={"title", "created_at"}, example="title")
 *     ),
 *
 *     @OA\Parameter(
 *         name="sort_order",
 *         in="query",
 *         required=false,
 *         description="Sort direction (options: 'asc', 'desc'). Default: 'desc'",
 *
 *         @OA\Schema(type="string", enum={"asc", "desc"}, example="asc")
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="CMS pages retrieved successfully",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="CMS pages retrieved successfully"),
 *                 @OA\Property(
 *                     property="cms_pages",
 *                     type="array",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="cms_page_id", type="integer", example=1),
 *                         @OA\Property(property="title", type="string", example="Terms & Conditions"),
 *                         @OA\Property(property="slug", type="string", example="terms-and-conditions"),
 *                         @OA\Property(property="content", type="string", example="<p>Rich text HTML content from WYSIWYG editor...</p>"),
 *                         @OA\Property(property="is_active", type="boolean", example=true),
 *                         @OA\Property(property="created_at", type="string", example="28-11-2025 12:00:00"),
 *                         @OA\Property(property="updated_at", type="string", example="28-11-2025 12:00:00")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="pagination",
 *                     type="object",
 *                     @OA\Property(property="total_records", type="integer", example=25),
 *                     @OA\Property(property="current_page", type="integer", example=1),
 *                     @OA\Property(property="total_pages", type="integer", example=1),
 *                     @OA\Property(property="next_page", type="integer", nullable=true, example=null),
 *                     @OA\Property(property="prev_page", type="integer", nullable=true, example=null)
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
 *                 @OA\Property(property="error_message", type="object", example={"page": {"The page must be an integer."}})
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving CMS pages")
 *             )
 *         )
 *     )
 * )
 */
class GetCmsPagesList
{
    // Empty class for Swagger annotations
}
