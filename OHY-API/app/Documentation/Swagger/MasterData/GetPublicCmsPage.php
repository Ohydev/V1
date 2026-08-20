<?php

namespace App\Documentation\Swagger\MasterData;

/**
 * @OA\Get(
 *     path="/v1/get_public_cms_page/{slug}",
 *     summary="Get Public CMS Page by Slug",
 *     description="Retrieves a single active CMS page by its slug for public viewing. This is a public API that does not require authentication. Returns complete page data (title, content, slug) only if the page is active (is_active = true). If the page is inactive or does not exist, returns a 404 error. Used when users click on CMS links in the footer to view the full page content.",
 *     tags={"Master Data API"},
 *     @OA\Parameter(
 *         name="slug",
 *         in="path",
 *         required=true,
 *         description="URL-friendly slug identifier of the CMS page (e.g., 'terms-and-conditions', 'privacy-policy')",
 *         @OA\Schema(type="string", example="terms-and-conditions")
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="CMS page retrieved successfully",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="CMS page retrieved successfully"),
 *                 @OA\Property(
 *                     property="cms_page",
 *                     type="object",
 *                     @OA\Property(property="cms_page_id", type="integer", example=1, description="CMS page unique identifier"),
 *                     @OA\Property(property="title", type="string", example="Terms & Conditions", description="CMS page title"),
 *                     @OA\Property(property="slug", type="string", example="terms-and-conditions", description="URL-friendly slug"),
 *                     @OA\Property(property="content", type="string", example="<p>Rich text HTML content from WYSIWYG editor. Supports <strong>bold</strong>, <em>italic</em>, lists, links, and other HTML formatting.</p>", description="Rich text HTML content from WYSIWYG editor. Formatting is preserved exactly as entered (bold, italic, bullet points, etc.)")
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="CMS page not found or inactive",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="Error code for not found errors"),
 *                 @OA\Property(property="error_message", type="string", example="CMS page not found", description="Error message indicating the CMS page was not found or is inactive")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Server error occurred",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="Error code for server errors"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving CMS page", description="Error message describing what went wrong")
 *             )
 *         )
 *     )
 * )
 */
class GetPublicCmsPage
{
    // Empty class - annotations are in docblock
}

