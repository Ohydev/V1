<?php

namespace App\Documentation\Swagger\SuperAdmin;

/**
 * @OA\Post(
 *     path="/v1/toggle_event_host_block_status",
 *     summary="Block or unblock an Event Host",
 *     description="Allows an authenticated Super Admin to block or unblock a specific Event Host. Blocking immediately revokes all active Sanctum tokens, preventing logins and API access. Unblocking clears block metadata so the host can log in again. Returns precise error messaging when redundant actions are attempted (e.g., blocking an already blocked host).",
 *     tags={"Super Admin API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="application/json",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"host_user_id","action"},
 *                 @OA\Property(
 *                     property="host_user_id",
 *                     type="integer",
 *                     example=12,
 *                     description="Unique identifier of the Event Host (host_users.host_user_id) that needs to be blocked or unblocked. Validation rule: 'required|integer|exists:host_users,host_user_id'."
 *                 ),
 *                 @OA\Property(
 *                     property="action",
 *                     type="string",
 *                     enum={"block","unblock"},
 *                     example="block",
 *                     description="Action to perform. 'block' sets is_blocked true, persists metadata, and revokes tokens. 'unblock' clears is_blocked, reason, admin reference, and blocked_at."
 *                 ),
 *                 @OA\Property(
 *                     property="reason",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=500,
 *                     example="Multiple fraudulent events detected",
 *                     description="Optional reason explaining why the host is being blocked. Stored in host_users.blocked_reason and returned to the host during login/middleware checks. Validation rule: 'nullable|string|max:500'."
 *                 )
 *             ),
 *             @OA\Examples(
 *                 example="BlockHost",
 *                 summary="Block an Event Host",
 *                 value={
 *                     "host_user_id": 12,
 *                     "action": "block",
 *                     "reason": "KYC verification failed"
 *                 }
 *             ),
 *             @OA\Examples(
 *                 example="UnblockHost",
 *                 summary="Unblock an Event Host",
 *                 value={
 *                     "host_user_id": 12,
 *                     "action": "unblock"
 *                 }
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Block status updated successfully.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event host blocked successfully")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation or redundant action error (E001/E004).",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E004"),
 *                 @OA\Property(property="error_message", type="string", example="Event host is already blocked")
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
 *         response=404,
 *         description="Host not found (E404).",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", example="Event host not found")
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
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while updating block status")
 *             )
 *         )
 *     )
 * )
 */
class ToggleEventHostBlockStatus
{
    // Empty class for Swagger annotations
}


