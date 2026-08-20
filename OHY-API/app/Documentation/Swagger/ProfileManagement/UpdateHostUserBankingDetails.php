<?php

namespace App\Documentation\Swagger\ProfileManagement;

/**
 * @OA\Post(
 *     path="/v1/update_host_user_banking_details",
 *     summary="Update Host User Banking Details",
 *     description="Updates banking information for authenticated Host User including account holder name, bank name, account number (encrypted), routing number, and PayPal email. All fields are optional, but at least one field must be provided. Account number is encrypted using Laravel's Crypt::encryptString() for secure storage and can be decrypted when needed for payment processing.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. User existence check: Queries host_users table by host_user_id to verify user exists
 * 3. Request validation: Validates all provided fields (all optional, but at least one must be provided)
 * 4. Update data preparation: Prepares update data array with provided fields
 * 5. Account number encryption: If account_number is provided and not empty, encrypts it using Crypt::encryptString()
 *    - Empty account_number string is converted to null to clear the field
 *    - Encryption is reversible (unlike password hashing) - can be decrypted using Crypt::decryptString()
 * 6. Field update check: Verifies at least one field is provided to update
 * 7. Database update: Updates host_users record with provided banking fields
 * 8. Response preparation: Returns banking_info object (account_number is NOT included for security)
 *
 * **Account Number Encryption:**
 * - Account number is encrypted using Laravel's Crypt::encryptString() before storage
 * - This is reversible encryption (unlike password hashing) so it can be decrypted for payment processing
 * - Empty account_number string is converted to null to clear the field
 * - Account number is stored encrypted in database but can be decrypted when needed
 *
 * **Partial Updates:**
 * - All fields are optional, but at least one field must be provided
 * - Only provided fields are updated (partial updates supported)
 * - Fields can be set to null to clear them
 * - If no fields are provided, returns E001 validation error: 'No banking details provided to update'
 *
 * **Security Considerations:**
 * - Account number is NOT included in response (in model's hidden array for security)
 * - Only non-sensitive banking information is returned: account_holder_name, bank_name, routing_number, paypal_email
 * - Account number encryption ensures secure storage while allowing decryption for payment processing
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for validation failures, including 'No banking details provided to update'
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if user not found in database
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
 *
 *                 @OA\Property(
 *                     property="account_holder_name",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="John Doe",
 *                     description="Bank account holder name. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'. At least one field must be provided."
 *                 ),
 *                 @OA\Property(
 *                     property="bank_name",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="Chase Bank",
 *                     description="Bank name. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'. At least one field must be provided."
 *                 ),
 *                 @OA\Property(
 *                     property="account_number",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="1234567890",
 *                     description="Bank account number in plain text. Optional field. Will be encrypted using Crypt::encryptString() before storage (reversible encryption). Empty string is converted to null to clear the field. Maximum 255 characters. Validation rule: 'nullable|string|max:255'. At least one field must be provided. **Note**: Account number is NOT included in response for security reasons (in model's hidden array)."
 *                 ),
 *                 @OA\Property(
 *                     property="routing_number",
 *                     type="string",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="021000021",
 *                     description="Bank routing number. Optional field. Can be set to null to clear the field. Must be a string with maximum 255 characters. Validation rule: 'nullable|string|max:255'. At least one field must be provided."
 *                 ),
 *                 @OA\Property(
 *                     property="paypal_email",
 *                     type="string",
 *                     format="email",
 *                     nullable=true,
 *                     maxLength=255,
 *                     example="payments@example.com",
 *                     description="PayPal email address for alternative payment method. Optional field. Must be valid email format if provided. Can be set to null to clear the field. Maximum 255 characters. Validation rule: 'nullable|email|max:255'. At least one field must be provided."
 *                 )
 *             ),
 *
 *             @OA\Examples(
 *                 example="CompleteBankingInfo",
 *                 summary="Complete Banking Information",
 *                 value={"account_holder_name": "John Doe", "bank_name": "Chase Bank", "account_number": "1234567890", "routing_number": "021000021", "paypal_email": "payments@example.com"}
 *             ),
 *             @OA\Examples(
 *                 example="PartialUpdate",
 *                 summary="Partial Update (Account Number Only)",
 *                 value={"account_number": "1234567890"}
 *             ),
 *             @OA\Examples(
 *                 example="ClearAccountNumber",
 *                 summary="Clear Account Number (Empty String)",
 *                 value={"account_number": ""}
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=200,
 *         description="Banking details updated successfully. Returns banking information (account_number is NOT included for security).",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Banking details updated successfully"),
 *                 @OA\Property(
 *                     property="banking_info",
 *                     type="object",
 *                     @OA\Property(property="account_holder_name", type="string", nullable=true, example="John Doe", description="Account holder name or null"),
 *                     @OA\Property(property="bank_name", type="string", nullable=true, example="Chase Bank", description="Bank name or null"),
 *                     @OA\Property(property="routing_number", type="string", nullable=true, example="021000021", description="Routing number or null"),
 *                     @OA\Property(property="paypal_email", type="string", nullable=true, format="email", example="payments@example.com", description="PayPal email or null"),
 *                     description="Banking information object. **Note**: account_number is intentionally excluded from response for security reasons (in model's hidden array)."
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Returns detailed error messages, including 'No banking details provided to update' if no fields are provided.",
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
 *                     oneOf={
 *
 *                         @OA\Schema(
 *                             type="object",
 *                             description="Validation error messages object when field validation fails",
 *
 *                             @OA\Property(
 *                                 property="paypal_email",
 *                                 type="array",
 *
 *                                 @OA\Items(type="string"),
 *                                 example={"The paypal email must be a valid email address."}
 *                             )
 *                         ),
 *
 *                         @OA\Schema(
 *                             type="string",
 *                             description="Error message when no fields are provided",
 *                             example="No banking details provided to update"
 *                         )
 *                     }
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
 *         description="Not found error (E404). User not found in database.",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested user does not exist"),
 *                 @OA\Property(property="error_message", type="string", example="User not found")
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred during banking details update. This could be due to database connection issues, encryption failures, or other server-side exceptions.",
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
class UpdateHostUserBankingDetails
{
    // Update Host User Banking Details API documentation
}
