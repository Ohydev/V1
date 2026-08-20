<?php

namespace App\Documentation\Swagger\CartManagement;

/**
 * @OA\Get(
 *     path="/v1/get_available_coupons",
 *     summary="Get Available Coupons",
 *     description="Retrieves all available coupons for specified events with validation for date range and usage limits. This endpoint queries coupons for the provided event IDs, validates each coupon for validity (date range and usage limits), and returns them with active/expired status. Protected route - requires authentication via Laravel Sanctum token.
 *
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates required query parameter event_ids (required|array|min:1, each element: required|integer|min:1)
 * 3. Current date retrieval: Gets current date in Y-m-d format (e.g., '2025-12-15') for validation purposes
 * 4. Database query: Queries coupons table for all coupons matching provided event_ids using whereIn query (CouponModel::whereIn('event_id', $eventIds))
 * 5. Coupon validation loop: Iterates through each coupon to validate and format:
 *    - Date range validation:
 *      - If end_date exists: Checks if current_date >= start_date AND current_date <= end_date
 *      - If end_date is null: Checks if current_date >= start_date
 *    - Usage limit validation: Checks if times_used < max_times_applicable
 *    - Status determination: Sets status to 'active' if both validations pass, 'expired' otherwise
 *    - Discount display formatting:
 *      - For percentage type: Formats as 'XX% OFF' (e.g., '20% OFF') using number_format with 0 decimal places
 *      - For flat type: Formats as '$XX.XX OFF' (e.g., '$50.00 OFF') using number_format with 2 decimal places
 *    - Usage display formatting: Formats as 'Used: X/Y' (e.g., 'Used: 45/100')
 *    - Price field formatting: Formats all price fields (discount_percent, max_cap_discount, flat_discount_amount) to 2 decimal places using number_format()
 * 6. Response formatting: Creates coupon data array with all formatted fields including status
 * 7. Response: Returns success response with coupons array containing all validated and formatted coupons
 *
 * **Business Logic:**
 * - Coupon validation: Each coupon is validated for date range and usage limits
 * - Status determination: Coupon is 'active' only if both date range and usage limit validations pass
 * - Date range handling: If end_date is null, coupon is valid from start_date onwards (no expiry)
 * - Usage limit: Coupon is valid if times_used < max_times_applicable
 * - Multiple events: Can retrieve coupons for multiple events in single request
 *
 * **Data Transformations:**
 * - Price formatting: All price fields formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Discount display: Percentage discounts formatted to 0 decimal places for display (e.g., '20% OFF')
 * - Flat discounts formatted to 2 decimal places (e.g., '$50.00 OFF')
 * - Usage display: Formatted as 'Used: X/Y' string
 *
 * **Response Structure:**
 * - coupons: Array of coupon objects, each containing:
 *   - coupon_id: Coupon ID
 *   - event_id: Event ID
 *   - coupon_code: Coupon code (e.g., 'EARLY20')
 *   - discount_type: Discount type ('percentage' or 'flat')
 *   - discount_percent: Discount percentage formatted to 2 decimal places (null if flat type)
 *   - max_cap_discount: Maximum discount cap formatted to 2 decimal places (null if not set or flat type)
 *   - flat_discount_amount: Flat discount amount formatted to 2 decimal places (null if percentage type)
 *   - discount_display: Formatted discount display string (e.g., '20% OFF' or '$50.00 OFF')
 *   - start_date: Coupon validity start date
 *   - end_date: Coupon validity end date (null if no expiry)
 *   - valid_until: Valid until date (same as end_date, null if no expiry)
 *   - times_used: Number of times coupon has been used
 *   - max_times_applicable: Maximum number of times coupon can be used
 *   - usage_display: Formatted usage display string (e.g., 'Used: 45/100')
 *   - status: Coupon status ('active' or 'expired')
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if event_ids validation fails (not array, empty array, or invalid elements)
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Authenticated user retrieved from token for potential future use",
 *     tags={"End User - Cart Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\Parameter(
 *         name="event_ids",
 *         in="query",
 *         required=true,
 *         description="Array of event IDs to retrieve coupons for. Must be an array with at least 1 element. Each element must be an integer, minimum 1. Can retrieve coupons for multiple events in a single request. Validation rule: 'required|array|min:1', each element: 'required|integer|min:1'. Example: ?event_ids[]=1&event_ids[]=2",
 *
 *         @OA\Schema(
 *             type="array",
 *
 *             @OA\Items(type="integer", example=1),
 *             minItems=1
 *         ),
 *         style="form",
 *         explode=true
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Success - Available coupons retrieved successfully",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Available coupons retrieved successfully"),
 *                 @OA\Property(
 *                     property="coupons",
 *                     type="array",
 *                     description="Array of formatted coupons with validation status",
 *
 *                     @OA\Items(
 *                         type="object",
 *
 *                         @OA\Property(property="coupon_id", type="integer", description="Coupon ID", example=1),
 *                         @OA\Property(property="event_id", type="integer", description="Event ID", example=1),
 *                         @OA\Property(property="coupon_code", type="string", description="Coupon code (e.g., 'EARLY20')", example="EARLY20"),
 *                         @OA\Property(property="discount_type", type="string", description="Discount type ('percentage' or 'flat')", example="percentage"),
 *                         @OA\Property(property="discount_percent", type="string", nullable=true, description="Discount percentage formatted to 2 decimal places (null if flat type)", example="20.00"),
 *                         @OA\Property(property="max_cap_discount", type="string", nullable=true, description="Maximum discount cap formatted to 2 decimal places (null if not set or flat type)", example="100.00"),
 *                         @OA\Property(property="flat_discount_amount", type="string", nullable=true, description="Flat discount amount formatted to 2 decimal places (null if percentage type)", example=null),
 *                         @OA\Property(property="discount_display", type="string", description="Formatted discount display string (e.g., '20% OFF' or '$50.00 OFF')", example="20% OFF"),
 *                         @OA\Property(property="start_date", type="string", description="Coupon validity start date", example="2025-12-01"),
 *                         @OA\Property(property="end_date", type="string", nullable=true, description="Coupon validity end date (null if no expiry)", example="2025-12-31"),
 *                         @OA\Property(property="valid_until", type="string", nullable=true, description="Valid until date (same as end_date, null if no expiry)", example="2025-12-31"),
 *                         @OA\Property(property="times_used", type="integer", description="Number of times coupon has been used", example=45),
 *                         @OA\Property(property="max_times_applicable", type="integer", description="Maximum number of times coupon can be used", example=100),
 *                         @OA\Property(property="usage_display", type="string", description="Formatted usage display string (e.g., 'Used: 45/100')", example="Used: 45/100"),
 *                         @OA\Property(property="status", type="string", description="Coupon status ('active' or 'expired')", example="active")
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Bad Request - Validation error",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     description="Validation errors object",
 *                     example={"event_ids": {"The event ids field is required."}, "event_ids.0": {"The event ids.0 must be an integer."}}
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal Server Error",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while processing your request")
 *             )
 *         )
 *     )
 * )
 */
class GetAvailableCoupons
{
    // Empty class - annotations are in docblock
}
