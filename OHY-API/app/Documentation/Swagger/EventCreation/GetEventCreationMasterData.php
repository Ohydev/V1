<?php

namespace App\Documentation\Swagger\EventCreation;

/**
 * @OA\Get(
 *     path="/v1/get_event_creation_master_data",
 *     summary="Get Event Creation Master Data",
 *     description="Retrieves all master data required for the 7-step event creation wizard. This API allows the frontend to make one API call to prefill all dropdowns and form fields with master data, eliminating the need for multiple API calls. The master data includes event categories, countries, ticket types, social media platforms, and discount types. All data is sorted alphabetically for better user experience.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Master data retrieval: Queries multiple master data tables in parallel
 * 3. Data formatting: Formats each master data category into structured arrays
 * 4. Sorting: Sorts event categories and countries alphabetically for better UX
 * 5. ENUM value conversion: Converts database ENUM values to human-readable labels
 * 6. Platform filtering: Separates all social media platforms from event-specific platforms (excludes Spotify for events)
 * 7. Response: Returns all master data organized by category
 *
 * **Master Data Categories:**
 * - **Event Categories**: All available event categories from event_categories table (sorted alphabetically)
 * - **Countries**: All active countries from countries table (is_deleted = 0, sorted alphabetically)
 * - **Ticket Types**: Hardcoded ENUM values ('single_entry', 'multiple_entry') with human-readable labels
 * - **Social Media Platforms**: All platforms including Spotify (for artists in Step 4)
 * - **Event Social Media Platforms**: All platforms except Spotify (for events in Step 1)
 * - **Discount Types**: Hardcoded ENUM values ('percentage', 'flat') with human-readable labels
 *
 * **Data Sorting:**
 * - Event categories are sorted alphabetically by category_name
 * - Countries are sorted alphabetically by name
 * - Ensures consistent ordering in dropdown menus across all steps
 *
 * **ENUM Value Conversion:**
 * - Ticket types: 'single_entry' → 'Single Entry', 'multiple_entry' → 'Multiple Entry'
 * - Discount types: 'percentage' → 'Percentage Discount', 'flat' → 'Flat Discount'
 * - Social media platforms: snake_case → Title Case (e.g., 'facebook' → 'Facebook', 'twitter' → 'X (Twitter)')
 *
 * **Platform Separation:**
 * - All social media platforms include Spotify (for artists in Step 4)
 * - Event social media platforms exclude Spotify (events cannot have Spotify links)
 * - This separation allows frontend to use appropriate platform list for each context
 *
 * **Country Filtering:**
 * - Only active countries are returned (is_deleted = 0)
 * - Soft-deleted countries are excluded from the list
 * - Ensures only valid countries appear in dropdowns
 *
 * **Error Handling:**
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API"},
 *     security={{"sanctum": {}}},
 *     @OA\Response(
 *         response=200,
 *         description="Master data retrieved successfully. Returns all master data organized by category for the 7-step event creation wizard.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Master data retrieved successfully"),
 *                 @OA\Property(
 *                     property="event_categories",
 *                     type="array",
 *                     description="Array of event categories sorted alphabetically by category_name. Used in Step 1 for category selection dropdown.",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="event_category_id", type="integer", description="Unique identifier for the event category", example=1),
 *                         @OA\Property(property="category_name", type="string", description="Category name (e.g., 'Technology', 'Music', 'Sports')", example="Technology")
 *                     ),
 *                     example={{"event_category_id": 2, "category_name": "Business"}, {"event_category_id": 1, "category_name": "Music"}, {"event_category_id": 3, "category_name": "Technology"}}
 *                 ),
 *                 @OA\Property(
 *                     property="countries",
 *                     type="array",
 *                     description="Array of active countries sorted alphabetically by name. Used in Step 3 for venue country selection dropdown. Only countries with is_deleted = 0 are included.",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="country_id", type="integer", description="Unique identifier for the country", example=1),
 *                         @OA\Property(property="name", type="string", description="Common country name (e.g., 'United States')", example="United States"),
 *                         @OA\Property(property="nicename", type="string", description="User-friendly country name (e.g., 'United States of America')", example="United States of America"),
 *                         @OA\Property(property="iso", type="string", description="Two-letter ISO country code (e.g., 'US', 'GB', 'IN')", example="US"),
 *                         @OA\Property(property="flag_icon", type="string", nullable=true, description="Path/URL to country flag icon (if exists)", example="https://example.com/flags/us.png")
 *                     ),
 *                     example={{"country_id": 2, "name": "Canada", "nicename": "Canada", "iso": "CA", "flag_icon": null}, {"country_id": 1, "name": "United States", "nicename": "United States of America", "iso": "US", "flag_icon": "https://example.com/flags/us.png"}}
 *                 ),
 *                 @OA\Property(
 *                     property="ticket_types",
 *                     type="array",
 *                     description="Array of ticket type ENUM values with human-readable labels. Used in Step 2 for ticket type selection dropdown. Values are hardcoded from database schema.",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="value", type="string", description="ENUM value from database (snake_case)", example="single_entry"),
 *                         @OA\Property(property="label", type="string", description="Human-readable label (Title Case)", example="Single Entry")
 *                     ),
 *                     example={{"value": "single_entry", "label": "Single Entry"}, {"value": "multiple_entry", "label": "Multiple Entry"}}
 *                 ),
 *                 @OA\Property(
 *                     property="social_media_platforms",
 *                     type="array",
 *                     description="Array of all social media platforms including Spotify. Used in Step 4 for artist social media links. All platforms are included (Facebook, Instagram, TikTok, LinkedIn, Snapchat, X/Twitter, YouTube, Spotify).",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="value", type="string", description="ENUM value from database (snake_case)", example="facebook"),
 *                         @OA\Property(property="label", type="string", description="Human-readable label (Title Case)", example="Facebook")
 *                     ),
 *                     example={{"value": "facebook", "label": "Facebook"}, {"value": "instagram", "label": "Instagram"}, {"value": "spotify", "label": "Spotify"}}
 *                 ),
 *                 @OA\Property(
 *                     property="event_social_media_platforms",
 *                     type="array",
 *                     description="Array of social media platforms without Spotify. Used in Step 1 for event social media links. Spotify is excluded because events cannot have Spotify links (only artists can).",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="value", type="string", description="ENUM value from database (snake_case)", example="facebook"),
 *                         @OA\Property(property="label", type="string", description="Human-readable label (Title Case)", example="Facebook")
 *                     ),
 *                     example={{"value": "facebook", "label": "Facebook"}, {"value": "instagram", "label": "Instagram"}, {"value": "youtube", "label": "YouTube"}}
 *                 ),
 *                 @OA\Property(
 *                     property="discount_types",
 *                     type="array",
 *                     description="Array of discount type ENUM values with human-readable labels. Used in Step 6 for coupon creation. Values are hardcoded from database schema.",
 *                     @OA\Items(
 *                         type="object",
 *                         @OA\Property(property="value", type="string", description="ENUM value from database (snake_case)", example="percentage"),
 *                         @OA\Property(property="label", type="string", description="Human-readable label (Title Case)", example="Percentage Discount")
 *                     ),
 *                     example={{"value": "percentage", "label": "Percentage Discount"}, {"value": "flat", "label": "Flat Discount"}}
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
 *                 @OA\Property(property="error_code", type="string", example="E003", description="E003: Authentication/Authorization errors - indicates that user authentication failed or token is invalid/expired"),
 *                 @OA\Property(property="error_message", type="string", example="Authentication required")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Server error (E002). An unexpected error occurred while retrieving master data.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving master data")
 *             )
 *         )
 *     )
 * )
 */
class GetEventCreationMasterData
{
    // Empty class for swagger-php to parse annotations
}

