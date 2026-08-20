<?php

namespace App\Documentation\Swagger\EventCreation\CouponsManagement;

/**
 * @OA\Post(
 *     path="/v1/save_event_step_6",
 *     summary="Save Event Step 6 (Coupons)",
 *     description="Saves all discount coupons for Step 6 of the event creation wizard. This API uses a 'replace all' approach: it deletes all existing coupons for the event and creates new ones from the provided coupons array. This simplifies frontend logic by sending the final desired state of all coupons. Uses database transactions to ensure data consistency. If any coupons have been used (times_used > 0), the API will return an error preventing replacement to maintain data integrity. Only draft events can have coupons updated.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id and coupons array with conditional validation based on discount_type
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Draft check: Verifies event is draft (is_published = false, is_draft = true)
 * 5. Database transaction begins: All database operations are wrapped in a transaction
 * 6. Used coupons check: Checks if any existing coupons have times_used > 0
 * 7. Duplicate code check: Checks for duplicate coupon codes within the request array
 * 8. Global uniqueness check: Checks if coupon codes already exist globally (across all events)
 * 9. **Replace All Pattern**:
 *    - Deletes all existing coupons for the event (safe because no coupons used)
 *    - Creates all new coupons from the coupons array
 *    - times_used initialized to 0 for all new coupons
 * 10. Date format conversion: Converts dates from d-m-Y (input) to Y-m-d (database storage)
 * 11. Conditional field handling: Sets fields to null based on discount_type (percentage vs flat)
 * 12. Transaction commit: If all operations succeed, transaction is committed
 * 13. Response formatting: Formats dates back to d-m-Y format, includes discount-specific fields
 * 14. Transaction rollback: If any error occurs, all changes are rolled back
 *
 * **Replace All Pattern:**
 * - This API uses a 'replace all' approach instead of create/update/delete individual coupons
 * - Frontend sends the complete desired state of all coupons
 * - All existing coupons are deleted, then all new coupons are created
 * - Simplifies frontend logic - no need to track individual coupon changes
 * - Coupons array can be empty (deletes all coupons)
 *
 * **Used Coupons Protection:**
 * - Before replacing coupons, API checks if any existing coupons have times_used > 0
 * - If coupons have been used, replacement is prevented (returns E004 error)
 * - This maintains data integrity and prevents loss of usage data
 * - Error message: 'Cannot modify coupons once they have been used. Please contact support if you need to make changes.'
 *
 * **Global Coupon Code Uniqueness:**
 * - Coupon codes must be globally unique (across all events, not just per event)
 * - API checks if coupon code already exists in a different event
 * - If duplicate found globally, returns E004 error with specific coupon code
 * - Error message: 'Coupon code already exists. Coupon codes must be globally unique.'
 *
 * **Duplicate Code Check:**
 * - API checks for duplicate coupon codes within the request array
 * - If duplicates found in request, returns E001 error
 * - Error message: 'Duplicate coupon codes found in the request. Each coupon code must be unique.'
 *
 * **Conditional Validation:**
 * - Validation rules change based on discount_type
 * - **Percentage Discount**: Requires discount_percent (0-100), optional max_cap_discount, flat_discount_amount must be null
 * - **Flat Discount**: Requires flat_discount_amount (non-negative), discount_percent and max_cap_discount must be null
 * - Validation uses conditional rules: 'required_if:discount_type,percentage' etc.
 *
 * **Date Format Conversion:**
 * - Input format: d-m-Y (e.g., '15-12-2025')
 * - Database storage: Y-m-d (e.g., '2025-12-15')
 * - Response format: d-m-Y (e.g., '15-12-2025')
 * - Conversion happens automatically during save and response formatting
 *
 * **Discount Types:**
 * - **Percentage Discount**: Discount based on percentage (e.g., 20% off)
 *   - discount_percent: Required, 0-100
 *   - max_cap_discount: Optional, maximum discount amount cap
 *   - flat_discount_amount: Must be null
 * - **Flat Discount**: Fixed discount amount (e.g., $50 off)
 *   - flat_discount_amount: Required, non-negative
 *   - discount_percent: Must be null
 *   - max_cap_discount: Must be null
 *
 * **Empty Coupons Array:**
 * - Coupons array can be empty (min:0 validation)
 * - Empty array means: delete all existing coupons, create no new coupons
 * - Useful for clearing all coupons from an event
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures (conditional validation, duplicate codes)
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Business logic errors (400): E004 error code if event is published, coupons used, or global uniqueness violation
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Coupons Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\RequestBody(
 *         required=true,
 *         @OA\MediaType(
 *             mediaType="application/json",
 *             @OA\Schema(
 *                 type="object",
 *                 required={"event_id", "coupons"},
 *                 @OA\Property(
 *                     property="event_id",
 *                     type="integer",
 *                     example=1,
 *                     description="Event ID to save coupons for. Required field. Must exist in events table and belong to authenticated host user. Validation rule: 'required|integer|exists:events,event_id'"
 *                 ),
 *                 @OA\Property(
 *                     property="coupons",
 *                     type="array",
 *                     minItems=0,
 *                     description="Array of coupon objects. Required field. Can be empty array (deletes all coupons). Each coupon object represents one discount coupon. All existing coupons are deleted and replaced with coupons in this array. Validation rule: 'required|array|min:0'",
 *                     @OA\Items(
 *                         type="object",
 *                         required={"coupon_code", "discount_type", "max_times_applicable", "start_date"},
 *                         @OA\Property(
 *                             property="coupon_code",
 *                             type="string",
 *                             maxLength=255,
 *                             example="EARLY20",
 *                             description="Coupon code (globally unique). Required field. Must be a string with maximum 255 characters. Must be globally unique across all events (not just per event). Validation rule: 'required|string|max:255'"
 *                         ),
 *                         @OA\Property(
 *                             property="discount_type",
 *                             type="string",
 *                             enum={"percentage", "flat"},
 *                             example="percentage",
 *                             description="Type of discount. Required field. Must be either 'percentage' or 'flat'. Determines which fields are required/optional. Validation rule: 'required|in:percentage,flat'"
 *                         ),
 *                         @OA\Property(
 *                             property="discount_percent",
 *                             type="number",
 *                             format="float",
 *                             nullable=true,
 *                             example=20.00,
 *                             description="Discount percentage (0-100). Required when discount_type is 'percentage', must be null when discount_type is 'flat'. Must be numeric between 0 and 100. Stored as DECIMAL(5,2). Response format: string. Validation rule: 'required_if:discount_type,percentage|nullable|numeric|min:0|max:100'"
 *                         ),
 *                         @OA\Property(
 *                             property="max_cap_discount",
 *                             type="number",
 *                             format="float",
 *                             nullable=true,
 *                             example=100.00,
 *                             description="Maximum discount amount cap (for percentage discounts). Optional when discount_type is 'percentage', must be null when discount_type is 'flat'. Must be numeric and non-negative. Stored as DECIMAL(10,2). Response format: string or null. Validation rule: 'nullable|numeric|min:0' (only for percentage type)"
 *                         ),
 *                         @OA\Property(
 *                             property="flat_discount_amount",
 *                             type="number",
 *                             format="float",
 *                             nullable=true,
 *                             example=50.00,
 *                             description="Fixed discount amount. Required when discount_type is 'flat', must be null when discount_type is 'percentage'. Must be numeric and non-negative. Stored as DECIMAL(10,2). Response format: string. Validation rule: 'required_if:discount_type,flat|nullable|numeric|min:0'"
 *                         ),
 *                         @OA\Property(
 *                             property="max_times_applicable",
 *                             type="integer",
 *                             example=100,
 *                             description="Maximum number of times coupon can be used. Required field. Must be an integer and at least 1. Initialized to 0 for new coupons (times_used = 0). Validation rule: 'required|integer|min:1'"
 *                         ),
 *                         @OA\Property(
 *                             property="start_date",
 *                             type="string",
 *                             format="date",
 *                             example="15-12-2025",
 *                             description="Coupon validity start date. Required field. Must be in d-m-Y format (e.g., '15-12-2025'). Converted to Y-m-d format for database storage. Response format: d-m-Y. Validation rule: 'required|date_format:d-m-Y'"
 *                         ),
 *                         @OA\Property(
 *                             property="end_date",
 *                             type="string",
 *                             format="date",
 *                             nullable=true,
 *                             example="31-12-2025",
 *                             description="Coupon validity end date. Optional field. Must be in d-m-Y format (e.g., '31-12-2025') if provided. Must be after start_date. Converted to Y-m-d format for database storage. Response format: d-m-Y or null. Validation rule: 'nullable|date_format:d-m-Y|after:start_date'"
 *                         )
 *                     ),
 *                     example={
 *                         {
 *                             "coupon_code": "EARLY20",
 *                             "discount_type": "percentage",
 *                             "discount_percent": 20.00,
 *                             "max_cap_discount": 100.00,
 *                             "max_times_applicable": 100,
 *                             "start_date": "15-12-2025",
 *                             "end_date": "31-12-2025"
 *                         },
 *                         {
 *                             "coupon_code": "FLAT50",
 *                             "discount_type": "flat",
 *                             "flat_discount_amount": 50.00,
 *                             "max_times_applicable": 50,
 *                             "start_date": "01-01-2026"
 *                         }
 *                     }
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Event Step 6 saved successfully. Returns all created coupons with dates formatted as d-m-Y and discount-specific fields.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event Step 6 saved successfully"),
 *                 @OA\Property(
 *                     property="coupons",
 *                     type="array",
 *                     description="Array of all created coupons with discount-specific fields",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="coupon_id", type="integer", example=1),
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="coupon_code", type="string", example="EARLY20"),
 *                         @OA\Property(property="discount_type", type="string", enum={"percentage", "flat"}, example="percentage"),
 *                         @OA\Property(property="discount_percent", type="string", nullable=true, example="20.00", description="String format, null for flat type"),
 *                         @OA\Property(property="flat_discount_amount", type="string", nullable=true, example=null, description="String format, null for percentage type"),
 *                         @OA\Property(property="max_cap_discount", type="string", nullable=true, example="100.00", description="String format or null, only for percentage type"),
 *                         @OA\Property(property="max_times_applicable", type="integer", example=100),
 *                         @OA\Property(property="start_date", type="string", example="15-12-2025", description="Formatted as d-m-Y"),
 *                         @OA\Property(property="end_date", type="string", nullable=true, example="31-12-2025", description="Formatted as d-m-Y or null"),
 *                         @OA\Property(property="times_used", type="integer", example=0, description="Always 0 for newly created coupons")
 *                     ),
 *                     example={{"coupon_id": 1, "event_id": 1, "coupon_code": "EARLY20", "discount_type": "percentage", "discount_percent": "20.00", "flat_discount_amount": null, "max_cap_discount": "100.00", "max_times_applicable": 100, "start_date": "15-12-2025", "end_date": "31-12-2025", "times_used": 0}}
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001) or Business logic error (E004). Request validation failed, event is published, coupons have been used, or global uniqueness violation.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed. E004: Business logic errors - indicates event is published, coupons have been used, or global uniqueness violation"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     oneOf={
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *                             @OA\Property(
 *                                 property="coupons.0.discount_percent",
 *                                 type="array",
 *                                 @OA\Items(type="string"),
 *                                 example={"The coupons.0.discount percent field is required when coupons.0.discount type is percentage."}
 *                             ),
 *                             @OA\Property(
 *                                 property="coupons.0.start_date",
 *                                 type="array",
 *                                 @OA\Items(type="string"),
 *                                 example={"The coupons.0.start date does not match the format d-m-Y."}
 *                             )
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message - coupons used",
 *                             example="Cannot modify coupons once they have been used. Please contact support if you need to make changes."
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message - global uniqueness",
 *                             example="Coupon code EARLY20 already exists. Coupon codes must be globally unique."
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message - duplicate codes",
 *                             example="Duplicate coupon codes found in the request. Each coupon code must be unique."
 *                         ),
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Business logic error message - event published",
 *                             example="Coupons can only be managed for draft events"
 *                         )
 *                     }
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003). User authentication failed. Token is missing, invalid, or expired.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that authentication failed"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Not found error (E404). Event not found or doesn't belong to authenticated user.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested event does not exist or doesn't belong to the authenticated user"),
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to update it")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred while saving event Step 6. This could be due to database connection issues, transaction failures, or other server-side exceptions.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while saving event Step 6")
 *             )
 *         )
 *     )
 * )
 */
class SaveEventStep6
{
    // Save Event Step 6 API documentation
}

