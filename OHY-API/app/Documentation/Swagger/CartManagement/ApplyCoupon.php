<?php

namespace App\Documentation\Swagger\CartManagement;

/**
 * @OA\Post(
 *     path="/v1/apply_coupon",
 *     summary="Apply Coupon",
 *     description="Allows authenticated End Users to apply a coupon to their cart. This endpoint validates the coupon, verifies it's valid for events in the user's cart, checks date range and usage limits, calculates the discount amount based on cart subtotal, and returns the coupon details with calculated discount. Protected route - requires authentication via Laravel Sanctum token.
 *
 * **Complete Flow:**
 * 1. Authentication check: Middleware (AuthenticateApiToken and AuthenticateUser) verifies Sanctum token and retrieves authenticated user
 * 2. Request validation: Validates required fields (coupon_id: required|integer|min:1, subtotal: required|numeric|min:0)
 * 3. Coupon existence check: Queries coupons table by coupon_id using CouponModel::get_coupon(). If coupon not found, returns 404 error (E404)
 * 4. Cart validation: Verifies coupon's event is in user's cart (security check):
 *    - Queries carts table to get all ticket_ids for authenticated user
 *    - Queries tickets table to get event_ids from user's cart tickets
 *    - Checks if coupon's event_id is in user's event_ids array
 *    - If coupon's event is not in user's cart, returns business logic error (E004)
 * 5. Date range validation: Validates coupon date range:
 *    - Gets current date in Y-m-d format (e.g., '2025-12-15')
 *    - If end_date exists: Checks if current_date >= start_date AND current_date <= end_date
 *    - If end_date is null: Checks if current_date >= start_date
 *    - If date validation fails, returns business logic error (E004) - 'Coupon has expired'
 * 6. Usage limit validation: Validates coupon usage limit:
 *    - Checks if times_used < max_times_applicable
 *    - If usage limit exceeded, returns business logic error (E004) - 'Coupon usage limit exceeded'
 * 7. Discount calculation: Calculates discount amount based on discount type:
 *    - Percentage discount:
 *      - Calculates discount as: subtotal × (discount_percent / 100)
 *      - If max_cap_discount is set, caps discount at max_cap_discount: discount = min(calculated_discount, max_cap_discount)
 *    - Flat discount:
 *      - Uses flat_discount_amount as discount: discount = flat_discount_amount
 * 8. Total calculation: Calculates total after discount: total_after_discount = subtotal - discount
 * 9. Price formatting: Formats all amounts to 2 decimal places using number_format():
 *    - discount_amount: Calculated discount formatted to 2 decimal places
 *    - subtotal: Subtotal formatted to 2 decimal places
 *    - total_after_discount: Total after discount formatted to 2 decimal places
 *    - discount_percent, max_cap_discount, flat_discount_amount: Formatted to 2 decimal places
 * 10. Discount display formatting: Formats discount display string:
 *     - Percentage: Formats as 'XX% OFF' (e.g., '20% OFF') using number_format with 0 decimal places
 *     - Flat: Formats as '$XX.XX OFF' (e.g., '$50.00 OFF') using number_format with 2 decimal places
 * 11. Response: Returns success response with coupon object containing all coupon details and calculated discount amounts
 *
 * **Business Logic:**
 * - Cart validation: Coupon must be valid for at least one event in user's cart
 * - Date range validation: Coupon must be within validity period (start_date to end_date, or from start_date if no end_date)
 * - Usage limit validation: Coupon must not have exceeded maximum usage limit
 * - Discount calculation: Percentage discounts calculated from subtotal, capped at max_cap_discount if set
 * - Flat discounts: Fixed amount discount regardless of subtotal
 *
 * **Discount Calculation Examples:**
 * - Percentage (20% off, max cap $100): Subtotal $500 → Discount $100 (capped), Subtotal $300 → Discount $60
 * - Flat ($50 off): Any subtotal → Discount $50
 *
 * **Data Transformations:**
 * - Price formatting: All prices formatted to 2 decimal places using number_format() (e.g., '150.00', '199.99')
 * - Discount display: Percentage discounts formatted to 0 decimal places for display (e.g., '20% OFF')
 * - Flat discounts formatted to 2 decimal places (e.g., '$50.00 OFF')
 * - Total calculation: total_after_discount = subtotal - discount_amount
 *
 * **Error Scenarios:**
 * - Validation Error (400): Returns E001 error code with detailed validation error messages if coupon_id or subtotal validation fails
 * - Coupon Not Found (404): Returns E404 error code if coupon_id does not exist in coupons table
 * - Business Logic Error (400): Returns E004 error code for:
 *   - Coupon is not valid for events in your cart (coupon's event_id not in user's cart event_ids)
 *   - Coupon has expired (date range validation failed)
 *   - Coupon usage limit exceeded (times_used >= max_times_applicable)
 * - Server Error (500): Returns E002 error code if any exception occurs during processing (logged for debugging)
 *
 * **Security:**
 * - Authentication required: Sanctum token must be provided in request header (Authorization: Bearer {token} or token: {token})
 * - User context: Cart validation ensures coupon is only applied if it's valid for events in authenticated user's cart
 * - Ownership validation: Only coupons for events in user's cart can be applied",
 *     tags={"End User - Cart Management API"},
 *     security={{"sanctum": {}}},
 *
 *     @OA\RequestBody(
 *         required=true,
 *         description="Request body containing coupon and subtotal information",
 *
 *         @OA\JsonContent(
 *             required={"coupon_id", "subtotal"},
 *
 *             @OA\Property(
 *                 property="coupon_id",
 *                 type="integer",
 *                 description="Coupon ID to apply. Must be an integer, minimum 1, and must exist in the 'coupons' table. The coupon must be valid for at least one event in the user's cart. Validation rule: 'required|integer|min:1'",
 *                 example=1
 *             ),
 *             @OA\Property(
 *                 property="subtotal",
 *                 type="number",
 *                 format="float",
 *                 description="Cart subtotal amount to calculate discount from. Must be numeric, minimum 0. This is the sum of all ticket prices in the cart before applying discount. Validation rule: 'required|numeric|min:0'",
 *                 example=500.00
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Success - Coupon applied successfully",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Coupon applied successfully"),
 *                 @OA\Property(
 *                     property="coupon",
 *                     type="object",
 *                     description="Coupon information with calculated discount",
 *                     @OA\Property(property="coupon_id", type="integer", description="Coupon ID", example=1),
 *                     @OA\Property(property="event_id", type="integer", description="Event ID", example=1),
 *                     @OA\Property(property="coupon_code", type="string", description="Coupon code (e.g., 'EARLY20')", example="EARLY20"),
 *                     @OA\Property(property="discount_type", type="string", description="Discount type ('percentage' or 'flat')", example="percentage"),
 *                     @OA\Property(property="discount_percent", type="string", nullable=true, description="Discount percentage formatted to 2 decimal places (null if flat type)", example="20.00"),
 *                     @OA\Property(property="max_cap_discount", type="string", nullable=true, description="Maximum discount cap formatted to 2 decimal places (null if not set or flat type)", example="100.00"),
 *                     @OA\Property(property="flat_discount_amount", type="string", nullable=true, description="Flat discount amount formatted to 2 decimal places (null if percentage type)", example=null),
 *                     @OA\Property(property="discount_display", type="string", description="Formatted discount display string (e.g., '20% OFF' or '$50.00 OFF')", example="20% OFF"),
 *                     @OA\Property(property="discount_amount", type="string", description="Calculated discount amount formatted to 2 decimal places", example="100.00"),
 *                     @OA\Property(property="subtotal", type="string", description="Cart subtotal formatted to 2 decimal places", example="500.00"),
 *                     @OA\Property(property="total_after_discount", type="string", description="Total after discount formatted to 2 decimal places (subtotal - discount_amount)", example="400.00")
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Bad Request - Validation error or business logic error",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", description="Error code: E001 for validation errors, E004 for business logic errors", example="E001"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *
 *                         @OA\Schema(type="object", description="Validation errors object (E001)", example={"coupon_id": {"The coupon id field is required."}, "subtotal": {"The subtotal must be at least 0."}}),
 *                         @OA\Schema(type="string", description="Business logic error message (E004)", example="Coupon is not valid for events in your cart")
 *                     }
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=404,
 *         description="Not Found - Coupon not found",
 *
 *         @OA\JsonContent(
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404"),
 *                 @OA\Property(property="error_message", type="string", example="Coupon not found")
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
class ApplyCoupon
{
    // Empty class - annotations are in docblock
}
