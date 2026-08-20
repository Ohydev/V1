<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Get(
 *     path="/v1/get_super_admin_event_details",
 *     summary="Get Super Admin Event Details",
 *     description="Returns full event details (all 7 steps) for any published event. Response matches the Event Host get_event_details structure so the frontend component can be reused.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum":{}}},
 *
 *     @OA\Parameter(
 *         name="event_id",
 *         in="query",
 *         required=true,
 *
 *         @OA\Schema(type="integer"),
 *         description="Event ID to retrieve"
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Event details retrieved successfully.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event details retrieved successfully"),
 *                 @OA\Property(
 *                     property="event",
 *                     type="object",
 *                     @OA\Property(property="event_id", type="integer", example=42),
 *                     @OA\Property(property="event_title", type="string", example="International Auto & Mobility Expo 2025"),
 *                     @OA\Property(property="description", type="string", example="<p>Event description...</p>"),
 *                     @OA\Property(property="event_category_id", type="integer", example=1),
 *                     @OA\Property(property="start_date", type="string", example="18-11-2025"),
 *                     @OA\Property(property="end_date", type="string", example="20-11-2025"),
 *                     @OA\Property(property="start_time", type="string", example="18:12"),
 *                     @OA\Property(property="end_time", type="string", example="20:00"),
 *                     @OA\Property(property="key_highlights", type="string", nullable=true, example="Key highlights text"),
 *                     @OA\Property(property="is_hidden_by_admin", type="boolean", example=false, description="Flag indicating if event is hidden by super admin. Hidden events are excluded from public listings but remain visible to event hosts."),
 *                     @OA\Property(property="hidden_reason", type="string", nullable=true, example="Content violates platform guidelines", description="Reason for hiding the event (only present if is_hidden_by_admin is true)"),
 *                     @OA\Property(property="hidden_at", type="string", nullable=true, format="date-time", example="28-11-2025 14:30:00", description="Timestamp when the event was hidden (only present if is_hidden_by_admin is true), formatted as d-m-Y H:i:s")
 *                 ),
 *                 @OA\Property(property="media", type="object"),
 *                 @OA\Property(property="social_media", type="array", @OA\Items(type="object")),
 *                 @OA\Property(property="tickets", type="array", @OA\Items(type="object")),
 *                 @OA\Property(property="venue", type="object", nullable=true),
 *                 @OA\Property(property="artists", type="array", @OA\Items(type="object")),
 *                 @OA\Property(property="terms", type="object", nullable=true),
 *                 @OA\Property(property="coupons", type="array", @OA\Items(type="object")),
 *                 @OA\Property(property="host", type="object", nullable=true)
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
 *                 @OA\Property(property="error_message", type="object", example={"event_id":{"The event id field is required."}})
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=404,
 *         description="Event not found (E404).",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", example="Event not found")
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving event details")
 *             )
 *         )
 *     )
 * )
 */
class GetSuperAdminEventDetails
{
    // Swagger docs for Super Admin event details endpoint
}
