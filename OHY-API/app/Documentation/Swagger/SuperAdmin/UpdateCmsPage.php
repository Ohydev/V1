<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Post(
 *     path="/v1/update_cms_page",
 *     summary="Update CMS Page",
 *     description="Allows an authenticated Super Admin to update an existing CMS page. Supports partial updates - only provided fields will be updated. If title is updated and slug is not explicitly provided, the slug will be automatically regenerated from the new title. The slug uniqueness is ensured (excluding the current page). All fields are optional except cms_page_id, allowing flexible partial updates.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="application/json",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"cms_page_id"},
 *                 @OA\Property(
 *                     property="cms_page_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Unique identifier of the CMS page to update. Validation rule: 'required|integer|exists:cms_pages,cms_page_id'."
 *                 ),
 *                 @OA\Property(
 *                     property="title",
 *                     type="string",
 *                     maxLength=255,
 *                     nullable=true,
 *                     example="Terms & Conditions Updated",
 *                     description="Updated CMS page title. If provided and slug is not provided, slug will be auto-regenerated. Validation rule: 'nullable|string|max:255|unique:cms_pages,title,{cms_page_id},cms_page_id'."
 *                 ),
 *                 @OA\Property(
 *                     property="slug",
 *                     type="string",
 *                     maxLength=255,
 *                     nullable=true,
 *                     example="terms-and-conditions-updated",
 *                     description="Updated URL-friendly slug. If title is updated but slug is not provided, slug will be auto-generated from title. Validation rule: 'nullable|string|max:255|unique:cms_pages,slug,{cms_page_id},cms_page_id'."
 *                 ),
 *                 @OA\Property(
 *                     property="content",
 *                     type="string",
 *                     nullable=true,
 *                     example="<p>Updated rich text HTML content from WYSIWYG editor...</p>",
 *                     description="Updated rich text content. Stored as HTML format. Validation rule: 'nullable|string'."
 *                 ),
 *                 @OA\Property(
 *                     property="is_active",
 *                     type="boolean",
 *                     nullable=true,
 *                     example=false,
 *                     description="Updated active status. If false, page will not appear in footer links. Validation rule: 'nullable|boolean'."
 *                 )
 *             ),
 *             @OA\Examples(
 *                 example="UpdateTitle",
 *                 summary="Update Title Only",
 *                 value={
 *                     "cms_page_id": 1,
 *                     "title": "Terms & Conditions Updated"
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="UpdateContent",
 *                 summary="Update Content Only",
 *                 value={
 *                     "cms_page_id": 1,
 *                     "content": "<p>Updated content...</p>"
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="UpdateStatus",
 *                 summary="Update Active Status Only",
 *                 value={
 *                     "cms_page_id": 1,
 *                     "is_active": false
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="UpdateAll",
 *                 summary="Update All Fields",
 *                 value={
 *                     "cms_page_id": 1,
 *                     "title": "Terms & Conditions Updated",
 *                     "content": "<p>Updated content...</p>",
 *                     "is_active": true
 *                 }
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="CMS page updated successfully",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="CMS page updated successfully"),
 *                 @OA\Property(
 *                     property="cms_page",
 *                     type="object",
 *                     @OA\Property(property="cms_page_id", type="integer", example=1),
 *                     @OA\Property(property="title", type="string", example="Terms & Conditions Updated"),
 *                     @OA\Property(property="slug", type="string", example="terms-and-conditions-updated"),
 *                     @OA\Property(property="content", type="string", example="<p>Updated content...</p>"),
 *                     @OA\Property(property="is_active", type="boolean", example=true),
 *                     @OA\Property(property="created_at", type="string", example="28-11-2025 12:00:00"),
 *                     @OA\Property(property="updated_at", type="string", example="28-11-2025 14:30:00")
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001)",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001"),
 *                 @OA\Property(property="error_message", type="object", example={"cms_page_id": {"The cms page id field is required."}})
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003)",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="CMS page not found (E404)",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", example="CMS page not found")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Server error (E002)",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while updating CMS page")
 *             )
 *         )
 *     )
 * )
 */
class UpdateCmsPage
{
    // Empty class for Swagger annotations
}

