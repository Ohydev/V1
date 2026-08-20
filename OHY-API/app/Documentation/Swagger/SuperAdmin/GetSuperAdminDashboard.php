<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Get(
 *     path="/v1/get_super_admin_dashboard",
 *     summary="Get Super Admin Dashboard",
 *     description="Returns global dashboard metrics (active events, completed events, total revenue) and the three most recent events across the entire platform. Response structure matches the Event Host dashboard format, allowing the same frontend component to be reused.",
 *     tags={"Super Admin API"},
 *     security={{"sanctum":{}}},
 *
 *     @OA\Response(
 *         response=200,
 *         description="Dashboard data retrieved successfully.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Dashboard data retrieved successfully"),
 *                 @OA\Property(
 *                     property="summary",
 *                     type="object",
 *                     @OA\Property(property="active_events", type="integer", example=12),
 *                     @OA\Property(property="completed_events", type="integer", example=8),
 *                     @OA\Property(property="total_revenue", type="number", format="float", example=45210.75)
 *                 ),
 *                 @OA\Property(
 *                     property="recent_events",
 *                     type="array",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="event_id", type="integer", example=42),
 *                         @OA\Property(property="event_title", type="string", example="Sunset Music Fest"),
 *                         @OA\Property(property="status", type="string", example="live"),
 *                         @OA\Property(property="date", type="string", example="25-11-2025"),
 *                         @OA\Property(property="time", type="string", example="18:00"),
 *                         @OA\Property(property="attendees", type="integer", example=350),
 *                         @OA\Property(property="venue_name", type="string", nullable=true, example="Madison Square Garden"),
 *                         @OA\Property(property="revenue", type="number", format="float", example=56000.00),
 *                         @OA\Property(property="thumbnail", type="string", nullable=true, example="events/42/thumbnail/banner.jpg"),
 *                         @OA\Property(property="is_hidden_by_admin", type="boolean", example=false, description="Flag indicating if event is hidden by super admin. Hidden events are excluded from public listings but remain visible to event hosts."),
 *                         @OA\Property(property="hidden_reason", type="string", nullable=true, example="Content violates platform guidelines", description="Reason for hiding the event (only present if is_hidden_by_admin is true)")
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003). Missing or invalid token.",
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving dashboard data")
 *             )
 *         )
 *     )
 * )
 */
class GetSuperAdminDashboard
{
    // Swagger documentation for Super Admin dashboard API
}
