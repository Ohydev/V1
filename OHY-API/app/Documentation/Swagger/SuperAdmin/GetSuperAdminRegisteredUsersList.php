<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Post(
 *     path="/v1/get_super_admin_registered_users_list",
 *     summary="Get Registered Users List",
 *     description="Returns all registered end users with search, date filtering, gender, age range, state, zipcode, sorting, and pagination. All filters are sent in the request body.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum":{}}},
 *
 *     @OA\RequestBody(
 *         required=false,
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="page", type="integer", minimum=1, description="Page number (default 1)"),
 *             @OA\Property(property="per_page", type="integer", minimum=1, maximum=100, description="Items per page (default 10)"),
 *             @OA\Property(property="search", type="string", description="Search by full name or email"),
 *             @OA\Property(property="start_date", type="string", example="01-11-2025", description="Filter users created on/after date (d-m-Y)"),
 *             @OA\Property(property="end_date", type="string", example="30-11-2025", description="Filter users created on/before date (d-m-Y)"),
 *             @OA\Property(property="sort_by", type="string", enum={"latest","total_spend","total_orders"}, description="Sort option (default latest)"),
 *             @OA\Property(property="gender", type="string", enum={"Male","Female","Other","Prefer Not to say"}, description="Filter by gender"),
 *             @OA\Property(property="age_range", type="string", enum={"10-20","20-30","30-40","40-50","50-60","60+"}, description="Filter by age range (from dob)"),
 *             @OA\Property(property="state_id", type="integer", nullable=true, description="Filter users by state_id (matches users.state_id from states master)"),
 *             @OA\Property(property="zipcode", type="string", nullable=true, maxLength=20, description="Filter users by zipcode (matches users.zipcode)")
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Users retrieved successfully.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Registered users retrieved successfully"),
 *                 @OA\Property(
 *                     property="users",
 *                     type="array",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="user_id", type="integer", example=10),
 *                         @OA\Property(property="full_name", type="string", example="Jane Doe"),
 *                         @OA\Property(property="email", type="string", example="jane@example.com"),
 *                         @OA\Property(property="contact_number", type="string", nullable=true, example="+1 555 0100"),
 *                         @OA\Property(property="gender", type="string", nullable=true, example="Female", description="User gender: Male, Female, Other, Prefer Not to say"),
 *                         @OA\Property(property="created_at", type="string", example="25-11-2025"),
 *                         @OA\Property(property="total_orders", type="integer", example=5),
 *                         @OA\Property(property="total_spend", type="number", format="float", example=450.75),
 *                         @OA\Property(property="last_order_date", type="string", nullable=true, example="20-11-2025")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="pagination",
 *                     type="object",
 *                     @OA\Property(property="total_records", type="integer", example=120),
 *                     @OA\Property(property="current_page", type="integer", example=1),
 *                     @OA\Property(property="total_pages", type="integer", example=12),
 *                     @OA\Property(property="next_page", type="integer", nullable=true, example=2),
 *                     @OA\Property(property="prev_page", type="integer", nullable=true, example=null)
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
 *                 @OA\Property(property="error_message", type="object", example={"start_date":{"The start date does not match the format d-m-Y."}})
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving users")
 *             )
 *         )
 *     )
 * )
 */
class GetSuperAdminRegisteredUsersList
{
    // Swagger docs for registered users list
}
