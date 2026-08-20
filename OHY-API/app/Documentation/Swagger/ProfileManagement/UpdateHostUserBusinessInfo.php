<?php

namespace App\Documentation\Swagger\ProfileManagement;

/**
 * @OA\Post(
 *     path="/v1/update_host_user_business_info",
 *     summary="Update Host User Business Information",
 *     description="Creates or updates business information for authenticated Host User. Uses database transactions to ensure data consistency. For Personal accounts without business info: Creates new business record with account_type = 'personal'. For accounts with existing business info: Updates existing business record and preserves original account_type (business or personal).
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. User existence check: Queries host_users table by host_user_id to verify user exists
 * 3. Request validation: Validates all provided fields (business_name required; others optional)
 * 4. Business data preparation: Prepares business data array with provided fields
 * 5. Database transaction begins: All database operations are wrapped in a transaction
 * 6. Business existence check: Checks if user has business_id (business exists)
 * 7. **Update Mode** (if business_id exists):
 *    - Queries existing business record to preserve account_type
 *    - Updates business record with new data (account_type is preserved, not updated)
 *    - Loads country relationship if business_country_id exists
 *    - Commits transaction if successful
 * 8. **Create Mode** (if business_id is null):
 *    - Creates new business record with account_type = 'personal' (Personal account adding business info)
 *    - Links user to business by updating host_users.business_id
 *    - Sets host_users.is_primary = true (user is business owner)
 *    - Loads country relationship if business_country_id exists
 *    - Commits transaction if successful
 * 9. Response preparation: Returns business_info object with all business fields and optional country object
 * 10. Transaction rollback: If any error occurs, all changes are rolled back
 *
 * **Account Type Handling:**
 * - **Business Accounts**: Business record created during signup with account_type = 'business'. When updating, account_type is preserved.
 * - **Personal Accounts**: Business record created when user first adds business info with account_type = 'personal'. When updating, account_type is preserved.
 * - account_type is never changed after initial creation - it preserves the original signup type
 *
 * **Country Relationship:**
 * - If business_country_id is provided and exists, country relationship is loaded using Eloquent
 * - Country information (country_id, name) is included in response if relationship is loaded
 * - Country validation: business_country_id must exist in countries table
 *
 * **Database Transaction:**
 * - All database operations (business create/update, host_user update) are wrapped in a transaction
 * - Ensures data consistency - either all operations succeed or all are rolled back
 * - Prevents partial updates that could leave data in inconsistent state
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if user or business not found
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Host Profile Management API"},
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
 *                 required={"business_name"},
 *
 *                 @OA\Property(
 *                     property="business_name",
 *                     type="string",
 *                     maxLength=255,
 *                     example="ABC Events Company",
 *                     description="Business/company name. Required field. Must be a string with maximum 255 characters. Validation rule: 'required|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="business_type",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="LLC",
 *                     description="Business type (e.g., LLC, Corporation, Sole Proprietorship). Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="industry",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="Events & Entertainment",
 *                     description="Industry category. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="company_size",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="1-10 employees",
 *                     description="Company size (e.g., '1-10 employees', '11-50 employees'). Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="tax_id",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="12-3456789",
 *                     description="Tax ID/EIN number. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="business_street_address",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="123 Main Street",
 *                     description="Business street address. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="business_city",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="New York",
 *                     description="Business city. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="business_state",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="NY",
 *                     description="Business state/province. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="business_zip_code",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="10001",
 *                     description="Business ZIP/postal code. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'"
 *                 ),
 *                 @OA\Property(
 *                     property="business_country_id",
 *                     type="integer",
 *                     nullable=true,
 *                     example=1,
 *                     description="Country ID reference. Optional field. Must exist in countries table if provided. Can be set to null to clear the field. Validation rule: 'nullable|integer|exists:countries,country_id'. If provided, country relationship is loaded and country information (country_id, name) is included in response."
 *                 )
 *             ),
 *
 *             @OA\Examples(
 *                 example="CompleteBusinessInfo",
 *                 summary="Complete Business Information",
 *                 value={"business_name": "ABC Events Company", "business_type": "LLC", "industry": "Events & Entertainment", "company_size": "1-10 employees", "tax_id": "12-3456789", "business_street_address": "123 Main Street", "business_city": "New York", "business_state": "NY", "business_zip_code": "10001", "business_country_id": 1}
 *             ),
 *             @OA\Examples(
 *                 example="MinimalBusinessInfo",
 *                 summary="Minimal Business Information (Name Only)",
 *                 value={"business_name": "ABC Events Company"}
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Business information updated successfully. Returns business information with all fields and optional country object.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Business information updated successfully"),
 *                 @OA\Property(
 *                     property="business_info",
 *                     type="object",
 *                     @OA\Property(property="business_id", type="integer", example=1),
 *                     @OA\Property(property="business_name", type="string", example="ABC Events Company"),
 *                     @OA\Property(property="account_type", type="string", enum={"business", "personal"}, example="personal", description="Account type (preserved from original creation - 'business' for business accounts, 'personal' for personal accounts)"),
 *                     @OA\Property(property="business_type", type="string", nullable=true, example="LLC", description="Business type or null"),
 *                     @OA\Property(property="industry", type="string", nullable=true, example="Events & Entertainment", description="Industry or null"),
 *                     @OA\Property(property="company_size", type="string", nullable=true, example="1-10 employees", description="Company size or null"),
 *                     @OA\Property(property="tax_id", type="string", nullable=true, example="12-3456789", description="Tax ID or null"),
 *                     @OA\Property(property="business_street_address", type="string", nullable=true, example="123 Main Street", description="Street address or null"),
 *                     @OA\Property(property="business_city", type="string", nullable=true, example="New York", description="City or null"),
 *                     @OA\Property(property="business_state", type="string", nullable=true, example="NY", description="State or null"),
 *                     @OA\Property(property="business_zip_code", type="string", nullable=true, example="10001", description="ZIP code or null"),
 *                     @OA\Property(property="business_country_id", type="integer", nullable=true, example=1, description="Country ID or null"),
 *                     @OA\Property(
 *                         property="country",
 *                         type="object",
 *                         nullable=true,
 *                         description="Country information (only present if business_country_id exists and relationship is loaded)",
 *                         @OA\Property(property="country_id", type="integer", example=1),
 *                         @OA\Property(property="name", type="string", example="United States")
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Returns detailed error messages for each field that failed validation.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E001", description="E001: Validation errors - indicates that one or more validation rules failed"),
 *                 @OA\Property(
 *                     property="error_message",
 *                     type="object",
 *                     description="Validation error messages object. Keys are field names, values are arrays of error messages for that field.",
 *                     @OA\Property(
 *                         property="business_name",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The business name field is required.", "The business name must not be greater than 255 characters."}
 *                     ),
 *
 *                     @OA\Property(
 *                         property="business_country_id",
 *                         type="array",
 *
 *                         @OA\Items(type="string"),
 *                         example={"The selected business country id is invalid."}
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=401,
 *         description="Authentication error (E003). User authentication failed. Token is missing, invalid, or expired.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that authentication failed"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=404,
 *         description="Not found error (E404). User or business not found in database.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested user or business does not exist"),
 *                 @OA\Property(property="error_message", type="string", example="User not found")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred during business information update. This could be due to database connection issues, transaction failures, or other server-side exceptions.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while processing your request")
 *             )
 *         )
 *     )
 * )
 */
class UpdateHostUserBusinessInfo
{
    // Update Host User Business Information API documentation
}
