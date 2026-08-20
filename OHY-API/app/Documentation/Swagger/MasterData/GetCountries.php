<?php

namespace App\Documentation\Swagger\MasterData;

/**
 * @OA\Get(
 *     path="/v1/get_countries",
 *     summary="Get Countries Master Data",
 *     description="Retrieves all active countries from the countries table. This is a public master data API that does not require authentication. Used for dropdowns in forms across the platform (profile, venue, checkout). Countries are filtered to return only active records (is_deleted = 0) and sorted alphabetically by name for better user experience.
 *
 * **Complete Flow:**
 * 1. No authentication check: This is a public route, no authentication required
 * 2. Initialize CountryModel: Creates CountryModel instance to perform database operations
 * 3. Prepare query condition: Sets query condition to filter only active countries (is_deleted = 0)
 * 4. Database query: Queries countries table using get_countries_list() method with query condition
 * 5. Data formatting: Loops through each country and extracts all country fields:
 *    - country_id: Country's unique identifier
 *    - iso: Two-letter ISO country code (e.g., 'US', 'GB', 'IN')
 *    - name: Common country name (e.g., 'United States')
 *    - nicename: User-friendly country name (e.g., 'United States of America')
 *    - flag_icon: Path/URL to country flag icon (nullable, may be null)
 *    - iso3: Three-letter ISO code (e.g., 'USA', 'GBR') (nullable, may be null)
 *    - numcode: Numeric country code (nullable, may be null)
 *    - phonecode: International dialing code (e.g., 1 for USA, 44 for UK)
 * 6. Sorting: Sorts countries array alphabetically by name field using usort() function for better UX
 * 7. Response formatting: Prepares success response with formatted countries array
 * 8. Success response: Returns JSON response with success indicator, message, and countries array
 *
 * **Business Logic:**
 * - Filtering: Only active countries are returned (is_deleted = 0). Soft-deleted countries are excluded from results
 * - Sorting: Countries are sorted alphabetically by name field using strcmp() function for consistent ordering
 * - Data transformation: All country fields are extracted from database records and formatted into response array
 * - No pagination: All active countries are returned in a single response (master data is typically manageable in size)
 *
 * **Database Operations:**
 * - Query: Uses CountryModel::get_countries_list() method to query countries table
 * - Filter: Applies is_deleted = 0 condition to exclude soft-deleted records
 * - No eager loading: Simple query, no relationships to load
 *
 * **Usage Scenarios:**
 * This API is used for country selection dropdowns in various forms across the platform:
 * - Event Host profile: Business address country selection (Business Information tab)
 * - Event venue: Venue country selection (Step 3: Venue Details)
 * - End User checkout: Billing address country selection (Checkout page)
 * - Order processing: Country information stored with orders for billing address
 *
 * **Data Source:**
 * - Master data table: countries
 * - Pre-populated with all world countries
 * - Standard ISO country codes (ISO 3166-1 alpha-2 for iso, alpha-3 for iso3)
 * - Typically static data (can be extended but rarely changes)
 * - Phone codes: International dialing codes for phone number formatting/validation
 *
 * **Error Scenarios:**
 * - Server Error (500): Returns E002 error code if database connection fails, query fails, or any exception occurs during processing",
 *     tags={"Master Data API"},
 *
 *     @OA\Response(
 *         response=200,
 *         description="Countries retrieved successfully",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Countries retrieved successfully"),
 *                 @OA\Property(
 *                     property="countries",
 *                     type="array",
 *                     description="Array of all active countries, sorted alphabetically by name",
 *
 *                     @OA\Items(
 *                         type="object",
 *                         description="Country information object",
 *
 *                         @OA\Property(property="country_id", type="integer", example=1, description="Country's unique identifier"),
 *                         @OA\Property(property="iso", type="string", example="US", description="Two-letter ISO country code (ISO 3166-1 alpha-2). Examples: 'US' for United States, 'GB' for United Kingdom, 'IN' for India"),
 *                         @OA\Property(property="name", type="string", example="United States", description="Common country name. Examples: 'United States', 'United Kingdom', 'India'"),
 *                         @OA\Property(property="nicename", type="string", example="United States of America", description="User-friendly country name. Examples: 'United States of America', 'United Kingdom', 'India'"),
 *                         @OA\Property(property="flag_icon", type="string", nullable=true, example="path/to/flag.png", description="Path or URL to country flag icon. Nullable field, may be null if flag icon is not available"),
 *                         @OA\Property(property="iso3", type="string", nullable=true, example="USA", description="Three-letter ISO country code (ISO 3166-1 alpha-3). Examples: 'USA' for United States, 'GBR' for United Kingdom, 'IND' for India. Nullable field, may be null"),
 *                         @OA\Property(property="numcode", type="integer", nullable=true, example=840, description="Numeric country code (ISO 3166-1 numeric). Examples: 840 for United States, 826 for United Kingdom, 356 for India. Nullable field, may be null"),
 *                         @OA\Property(property="phonecode", type="integer", example=1, description="International dialing code. Examples: 1 for United States, 44 for United Kingdom, 91 for India. Used for phone number formatting and validation")
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *
 *     @OA\Response(
 *         response=500,
 *         description="Server error occurred",
 *
 *         @OA\JsonContent(
 *             type="object",
 *
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="Error code for server errors"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving countries", description="Error message describing what went wrong")
 *             )
 *         )
 *     )
 * )
 */
class GetCountries
{
    // Empty class - annotations are in docblock
}
