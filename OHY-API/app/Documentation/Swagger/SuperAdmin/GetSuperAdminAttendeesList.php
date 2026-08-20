<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Get(
 *     path="/v1/get_super_admin_attendees_list",
 *     summary="Get Super Admin Attendees List",
 *     description="Returns a paginated list of all attendees (end users who purchased tickets) across the entire platform. Mirrors the Event Host attendees API format but removes host scoping and introduces optional filters for host_user_id and event_id. All date parsing and formatting is performed via Carbon as mandated by Cursor rules.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum": {}}},
 *     @OA\Parameter(name="search", in="query", required=false, @OA\Schema(type="string", maxLength=255), description="Case-insensitive search across attendee name, email, and contact number."),
 *     @OA\Parameter(name="start_date", in="query", required=false, @OA\Schema(type="string", format="date", example="01-11-2025"), description="Filter attendees whose last transaction is on/after this date (format d-m-Y). Carbon startOfDay is applied."),
 *     @OA\Parameter(name="end_date", in="query", required=false, @OA\Schema(type="string", format="date", example="30-11-2025"), description="Filter attendees whose last transaction is on/before this date (format d-m-Y). Carbon endOfDay is applied."),
 *     @OA\Parameter(name="events_filter", in="query", required=false, @OA\Schema(type="string", maxLength=255), description="Free text search on event titles attended by the attendee."),
 *     @OA\Parameter(name="event_id", in="query", required=false, @OA\Schema(type="integer", example=25), description="Filter attendees who purchased tickets for the specified event."),
 *     @OA\Parameter(name="host_user_id", in="query", required=false, @OA\Schema(type="integer", example=12), description="Filter attendees who purchased tickets from events owned by the specified host user."),
 *     @OA\Parameter(name="sort_by", in="query", required=false, @OA\Schema(type="string", enum={"last_txn_date","total_spend","total_txns"}), description="Sorting option. Defaults to last_txn_date."),
 *     @OA\Parameter(name="page", in="query", required=false, @OA\Schema(type="integer", minimum=1, example=1), description="Pagination page number (default 1)."),
 *     @OA\Parameter(name="per_page", in="query", required=false, @OA\Schema(type="integer", minimum=1, maximum=100, example=10), description="Number of attendees per page (default 10, max 100)."),
 *     @OA\Response(
 *         response=200,
 *         description="Attendees retrieved successfully.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Attendees retrieved successfully"),
 *                 @OA\Property(
 *                     property="attendees",
 *                     type="array",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="user_id", type="integer", example=101),
 *                         @OA\Property(property="name", type="string", example="Alicia Stewart"),
 *                         @OA\Property(property="email", type="string", example="alicia@example.com"),
 *                         @OA\Property(property="contact", type="string", nullable=true, example="+1 555 0102"),
 *                         @OA\Property(property="total_txns", type="integer", example=5),
 *                         @OA\Property(property="total_spend", type="number", format="float", example=1099.50),
 *                         @OA\Property(property="last_txn", type="string", nullable=true, example="26-11-2025 18:45:12"),
 *                         @OA\Property(
 *                             property="events",
 *                             type="array",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_id", type="integer", example=55),
 *                                 @OA\Property(property="event_title", type="string", example="Future of Tech Summit"),
 *                                 @OA\Property(property="tickets_purchased", type="integer", example=3),
 *                                 @OA\Property(property="ticket_subtotal", type="number", format="float", example=650.00, description="Sum of ticket line totals before fees/discounts"),
 *                                 @OA\Property(property="coupon_discount", type="number", format="float", example= -15.25, description="Allocated coupon discount portion for this event"),
 *                                 @OA\Property(property="event_spend", type="number", format="float", example=679.75, description="Final amount paid for this event (ticket_subtotal - coupon_discount)")
 *                             )
 *                         )
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="pagination",
 *                     type="object",
 *                     @OA\Property(property="total_records", type="integer", example=240),
 *                     @OA\Property(property="current_page", type="integer", example=1),
 *                     @OA\Property(property="total_pages", type="integer", example=24),
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving attendees")
 *             )
 *         )
 *     )
 * )
 */
class GetSuperAdminAttendeesList
{
    // Empty class for swagger-php to parse annotations
}

