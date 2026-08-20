<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Get(
 *     path="/v1/get_super_admin_events_list",
 *     summary="Get Super Admin Events List",
 *     description="Lists all published events across the platform (drafts excluded) with the same structure as the Event Host events list. Includes status counts for Live/Ongoing, Upcoming, Completed tabs, search, status filter, and pagination metadata.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum":{}}},
 *     @OA\Parameter(
 *         name="page",
 *         in="query",
 *         required=false,
 *         @OA\Schema(type="integer", minimum=1),
 *         description="Page number (default 1)"
 *     ),
 *     @OA\Parameter(
 *         name="per_page",
 *         in="query",
 *         required=false,
 *         @OA\Schema(type="integer", minimum=1, maximum=100),
 *         description="Number of events per page (default 10)"
 *     ),
 *     @OA\Parameter(
 *         name="status",
 *         in="query",
 *         required=false,
 *         @OA\Schema(type="string", enum={"live","upcoming","completed"}),
 *         description="Filter by event status tab (Live/Ongoing, Upcoming, Completed)"
 *     ),
 *     @OA\Parameter(
 *         name="search",
 *         in="query",
 *         required=false,
 *         @OA\Schema(type="string"),
 *         description="Search term for event title or description"
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Events retrieved successfully.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Events retrieved successfully"),
 *                 @OA\Property(
 *                     property="status_counts",
 *                     type="object",
 *                     @OA\Property(property="live", type="integer", example=3),
 *                     @OA\Property(property="upcoming", type="integer", example=5),
 *                     @OA\Property(property="completed", type="integer", example=12)
 *                 ),
 *                 @OA\Property(
 *                     property="events",
 *                     type="array",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="event_id", type="integer", example=42),
 *                         @OA\Property(property="event_title", type="string", example="International Auto & Mobility Expo 2025"),
 *                         @OA\Property(property="description", type="string", example="<p>Event description...</p>"),
 *                         @OA\Property(property="status", type="string", example="live"),
 *                         @OA\Property(property="date", type="string", example="18-11-2025"),
 *                         @OA\Property(property="time", type="string", example="18:12"),
 *                         @OA\Property(property="attendees", type="integer", example=120),
 *                         @OA\Property(property="venue_name", type="string", nullable=true, example="City Convention Center"),
 *                         @OA\Property(property="revenue", type="number", format="float", example=56000.00),
 *                         @OA\Property(property="thumbnail", type="string", nullable=true, example="events/42/thumbnail/banner.jpg"),
 *                         @OA\Property(property="is_hidden_by_admin", type="boolean", example=false, description="Flag indicating if event is hidden by super admin. Hidden events are excluded from public listings but remain visible to event hosts."),
 *                         @OA\Property(property="hidden_reason", type="string", nullable=true, example="Content violates platform guidelines", description="Reason for hiding the event (only present if is_hidden_by_admin is true)"),
 *                         @OA\Property(property="hidden_at", type="string", nullable=true, format="date-time", example="28-11-2025 14:30:00", description="Timestamp when the event was hidden (only present if is_hidden_by_admin is true), formatted as d-m-Y H:i:s")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="pagination",
 *                     type="object",
 *                     @OA\Property(property="total_records", type="integer", example=42),
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
 *                 @OA\Property(property="error_message", type="object", example={"status":{"The selected status is invalid."}})
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving events")
 *             )
 *         )
 *     )
 * )
 */
class GetSuperAdminEventsList
{
    // Swagger documentation for Super Admin events list
}

