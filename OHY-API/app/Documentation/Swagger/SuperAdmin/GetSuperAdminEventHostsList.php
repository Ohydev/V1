<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Get(
 *     path="/v1/get_super_admin_event_hosts_list",
 *     summary="Get Super Admin Event Hosts List",
 *     description="Returns a paginated list of event hosts with business info, aggregates, and last login metadata. Filters include search, account_type, business profile flag, date range, and status. All date parsing/formatting uses Carbon per Cursor rules.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum": {}}},
 *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string", maxLength=255), description="Search across host first name, last name, email, and phone number."),
 *     @OA\Parameter(name="account_type", in="query", required=false, @OA\Schema(type="string", enum={"business","personal"}), description="Filter by host account type."),
 *     @OA\Parameter(name="has_business_profile", in="query", required=false, @OA\Schema(type="boolean"), description="Set true to return hosts linked with a business profile, false for hosts without business_id."),
 *     @OA\Parameter(name="start_date", in="query", required=false, @OA\Schema(type="string", format="date", example="01-11-2025"), description="Filter hosts created on/after this date (d-m-Y)."),
 *     @OA\Parameter(name="end_date", in="query", required=false, @OA\Schema(type="string", format="date", example="30-11-2025"), description="Filter hosts created on/before this date (d-m-Y)."),
 *     @OA\Parameter(name="status", in="query", required=false, @OA\Schema(type="string", enum={"active","inactive"}), description="Filter by host status flag."),
 *     @OA\Parameter(name="sort_by", in="query", required=false, @OA\Schema(type="string", enum={"newest","total_revenue","events_created","last_login"}), description="Sorting option. Defaults to newest."),
 *     @OA\Parameter(name="state_id", in="query", required=false, @OA\Schema(type="integer", minimum=1), description="Filter event hosts by host_users.state_id (linked to states master)."),
 *     @OA\Parameter(name="zipcode", in="query", required=false, @OA\Schema(type="string", maxLength=20), description="Filter event hosts by host_users.zipcode."),
 *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", minimum=1, example=1), description="Pagination page number (default 1)."),
 *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", minimum=1, maximum=100, example=10), description="Number of hosts per page (default 10, max 100)."),
 *     @OA\Response(
 *         response=200,
 *         description="Hosts retrieved successfully.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event hosts retrieved successfully"),
 *                 @OA\Property(
 *                     property="hosts",
 *                     type="array",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="host_user_id", type="integer", example=21),
 *                         @OA\Property(property="first_name", type="string", example="Avery"),
 *                         @OA\Property(property="last_name", type="string", example="Sanders"),
 *                         @OA\Property(property="email", type="string", example="avery@ohy.com"),
 *                         @OA\Property(property="phone_number", type="string", nullable=true, example="+1 555 0100"),
 *                         @OA\Property(property="account_type", type="string", nullable=true, example="business"),
 *                         @OA\Property(property="has_business_profile", type="boolean", example=true),
 *                         @OA\Property(
 *                             property="business",
 *                             type="object",
 *                             @OA\Property(property="business_name", type="string", nullable=true, example="OHY Creative Labs"),
 *                             @OA\Property(property="industry", type="string", nullable=true, example="Events & Entertainment"),
 *                             @OA\Property(property="country_name", type="string", nullable=true, example="United States")
 *                         ),
 *                         @OA\Property(
 *                             property="metrics",
 *                             type="object",
 *                             @OA\Property(property="events_created", type="integer", example=12),
 *                             @OA\Property(property="events_live", type="integer", example=3),
 *                             @OA\Property(property="events_completed", type="integer", example=5),
 *                             @OA\Property(property="total_revenue_generated", type="number", format="float", example=45230.75),
 *                             @OA\Property(property="total_tickets_sold", type="integer", example=1250)
 *                         ),
 *                         @OA\Property(property="last_login", type="string", nullable=true, example="25-11-2025 09:45:12"),
 *                         @OA\Property(property="is_blocked", type="boolean", example=false, description="Flag indicating if event host is blocked by super admin. If true, host cannot log in and all active tokens are revoked."),
 *                         @OA\Property(property="blocked_reason", type="string", nullable=true, example="KYC verification failed", description="Reason for blocking the event host. Only present if is_blocked is true. Shown to host when they try to log in."),
 *                         @OA\Property(property="blocked_at", type="string", nullable=true, format="date-time", example="28-11-2025 14:30:00", description="Timestamp when the event host was blocked (only present if is_blocked is true), formatted as d-m-Y H:i:s"),
 *                         @OA\Property(property="blocked_by_super_admin_id", type="integer", nullable=true, example=1, description="ID of the super admin who blocked the event host. Only present if is_blocked is true.")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="pagination",
 *                     type="object",
 *                     @OA\Property(property="total_records", type="integer", example=48),
 *                     @OA\Property(property="current_page", type="integer", example=1),
 *                     @OA\Property(property="total_pages", type="integer", example=5),
 *                     @OA\Property(property="next_page", type="integer", nullable=true, example=2),
 *                     @OA\Property(property="prev_page", type="integer", nullable=true, example=null)
 *                 )
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
 *                 @OA\Property(property="error_message", type="object", example={"start_date":{"The start date does not match the format d-m-Y."}})
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
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving event hosts")
 *             )
 *         )
 *     )
 * )
 */
class GetSuperAdminEventHostsList
{
    // Empty class for swagger-php annotations
}

