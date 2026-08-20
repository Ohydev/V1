<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Post(
 *     path="/v1/toggle_event_hide_status",
 *     summary="Hide or unhide a published Event",
 *     description="Allows an authenticated Super Admin to hide or unhide a specific published Event. Only published events (is_published = true AND is_draft = false) can be hidden. Hidden events are excluded from public listings but remain visible to event hosts with clear indication of hidden status. Unhiding clears hide metadata so the event appears in public listings again. Returns precise error messaging when invalid or redundant actions are attempted (e.g., hiding a draft event or unhiding an already visible event).",
 *     tags={"Super Admin API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\RequestBody(
 *         required=true,
 *
 *         @OA\MediaType(
 *             mediaType="application/json",
 *
 *             @OA\Schema(
 *                 type="object",
 *                 required={"event_id","action"},
 *
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     example=25,
 *                     description="Unique identifier of the Event (events.event_id) that needs to be hidden or unhidden. Validation rule: 'required|integer|exists:events,event_id'."
 *                 ),
 *                 @OA\Property(
 *                     property="action",
 *                     type="string",
 *                     enum={"hide","unhide"},
 *                     example="hide",
 *                     description="Action to perform. 'hide' sets is_hidden_by_admin true, persists metadata (reason, admin reference, timestamp). 'unhide' clears is_hidden_by_admin, reason, admin reference, and hidden_at. Only published events can be hidden."
 *                 ),
 *                 @OA\Property(
 *                     property="reason",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="Inappropriate content detected",
 *                     description="Optional reason explaining why the event is being hidden. Stored in events.hidden_reason and visible to event hosts. Validation rule: 'nullable|string|max:500'."
 *                 )
 *             ),
 *
 *             @OA\Examples(
 *                 example="HideEvent",
 *                 summary="Hide a published Event",
 *                 value={
 *                     "event_id": 25,
 *                     "action": "hide",
 *                     "reason": "Content violates platform guidelines"
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="UnhideEvent",
 *                 summary="Unhide a hidden Event",
 *                 value={
 *                     "event_id": 25,
 *                     "action": "unhide"
 *                 }
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Event hide status updated successfully.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event hidden successfully")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001) or business logic error (E004).",
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while updating hide status")
 *             )
 *         )
 *     )
 * )
 */
class ToggleEventHideStatus
{
    // Empty class for swagger-php annotations
}
