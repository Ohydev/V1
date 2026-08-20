<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Delete(
 *     path="/v1/delete_cms_page/{cms_page_id}",
 *     summary="Delete CMS Page",
 *     description="Allows an authenticated Super Admin to permanently delete a CMS page by its ID. This is a hard delete operation - the CMS page record will be permanently removed from the database. The operation is irreversible. Returns an error if the CMS page does not exist.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Parameter(
 *         name="cms_page_id",
 *         in="path",
 *         required=true,
 *         description="Unique identifier of the CMS page to delete",
 *
 *         @OA\Schema(type="integer", example=1)
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="CMS page deleted successfully",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="CMS page deleted successfully")
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while deleting CMS page")
 *             )
 *         )
 *     )
 * )
 */
class DeleteCmsPage
{
    // Empty class for Swagger annotations
}
