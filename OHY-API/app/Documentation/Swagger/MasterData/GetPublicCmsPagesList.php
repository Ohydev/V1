<?php

namespace App\Documentation\Swagger\MasterData;

/**
 * @OA\Get(
 *     path="/v1/get_public_cms_pages_list",
 *     summary="Get Public CMS Pages List",
 *     description="Retrieves all active CMS pages for footer display. This is a public master data API that does not require authentication. Returns only active CMS pages (is_active = true) with minimal data (title and slug) for footer links. Pages are sorted alphabetically by title. Used by both User (Event) Module and Event Host Module to display CMS links in the footer.",
 *     tags={"Master Data API"},
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
 *                     description="Array of all active CMS pages, sorted alphabetically by title",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="cms_page_id", type="integer", example=1, description="CMS page unique identifier"),
 *                         @OA\Property(property="title", type="string", example="Terms & Conditions", description="CMS page title (e.g., 'Terms & Conditions', 'Privacy Policy')"),
 *                         @OA\Property(property="slug", type="string", example="terms-and-conditions", description="URL-friendly slug for accessing the CMS page (e.g., 'terms-and-conditions', 'privacy-policy')")
 *                     )
 *                 )
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving CMS pages", description="Error message describing what went wrong")
 *             )
 *         )
 *     )
 * )
 */
class GetPublicCmsPagesList
{
    // Empty class - annotations are in docblock
}
