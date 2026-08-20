<?php

namespace App\Documentation\Swagger\EventCreation;

/**
 * @OA\Get(
 *     path="/v1/get_event_data_for_editing",
 *     summary="Get Event Data For Editing",
 *     description="Retrieves all event data from all 7 steps for a draft event in a format optimized for form preloading when editing. The data is organized by steps (step_1 through step_6) to make it easy for the frontend to populate each step's form fields. This API is called when an Event Host clicks on a draft event to continue editing it. The data structure matches exactly what each step expects, allowing seamless form preloading.
 *
 * **Complete Flow:**
 * 1. Authentication check: Verifies user is authenticated via Laravel Sanctum token (middleware ensures this)
 * 2. Request validation: Validates event_id parameter (required, must exist in events table)
 * 3. Event ownership verification: Verifies event exists and belongs to authenticated host user
 * 4. Step 1 data retrieval: Retrieves event basic info, media (grouped by type), and social media links
 * 5. Step 2 data retrieval: Retrieves tickets with category info and all ticket categories for dropdown
 * 6. Step 3 data retrieval: Retrieves venue details with country information
 * 7. Step 4 data retrieval: Retrieves artists with nested social media links
 * 8. Step 5 data retrieval: Retrieves terms & conditions (null if not set)
 * 9. Step 6 data retrieval: Retrieves all coupons (not filtered by validity, for editing purposes)
 * 10. Data formatting: Formats all data with proper date/time formatting (d-m-Y, H:i)
 * 11. Response: Returns complete event data organized by steps
 *
 * **Event Ownership:**
 * - Event must belong to authenticated host user (host_user_id match)
 * - If event doesn't exist or doesn't belong to user, returns E404 error
 * - Ownership verification ensures users can only edit their own events
 *
 * **Data Organization by Steps:**
 * - **Step 1**: Event basic info (title, description, category, dates, times, key highlights), media grouped by type (thumbnail, banner, flyer, video), social media links
 * - **Step 2**: Tickets array with category info, ticket categories array for dropdown
 * - **Step 3**: Venue details (name, address, coordinates, country, etc.) or null if not set
 * - **Step 4**: Artists array with nested social media links for each artist
 * - **Step 5**: Terms & conditions content or null if not set
 * - **Step 6**: All coupons array (not filtered by validity, includes expired/used coupons for editing)
 *
 * **Date/Time Formatting:**
 * - Dates are formatted as d-m-Y (e.g., '15-12-2025')
 * - Times are formatted as H:i (e.g., '09:00')
 * - Coupon dates are formatted as d-m-Y
 * - This format matches frontend expectations for date/time inputs
 *
 * **Media Grouping:**
 * - Media is grouped by type: thumbnail, banner, flyer, video
 * - Each type can have multiple files (except thumbnail and banner which are single)
 * - Video duration is included for video media types
 * - File paths are included for all media files
 *
 * **Coupon Data:**
 * - All coupons are returned (not filtered by validity)
 * - Includes expired coupons and fully used coupons
 * - This allows Event Host to see and edit all coupons, not just active ones
 * - Date formatting: start_date and end_date as d-m-Y
 *
 * **Null Values:**
 * - Venue (step_3) can be null if not set
 * - Terms & conditions (step_5) can be null if not set
 * - Artist images can be null if not uploaded
 * - Coupon end_date can be null if not set
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for invalid event_id or missing parameter
 * - Authentication errors (401): E003 error code if user not authenticated
 * - Not found errors (404): E404 error code if event not found or doesn't belong to user
 * - Server errors (500): E002 error code for unexpected server-side exceptions",
 *     tags={"Event Creation Management API - Get Event Data For Editing API"},
 *     security={{"sanctum": {}}},
 *     @OA\Parameter(
 *         name="event_id",
 *         in="query",
 *         required=true,
 *         description="Event ID to retrieve data for editing. Must exist in events table and belong to authenticated host user.",
 *         @OA\Schema(type="integer", example=1),
 *         example=1
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Event data retrieved successfully. Returns complete event data organized by steps (step_1 through step_6) for form preloading.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event data retrieved successfully"),
 *                 @OA\Property(property="event_id", type="integer", example=1),
 *                 @OA\Property(
 *                     property="step_1",
 *                     type="object",
 *                     description="Step 1: Event Details (Event Info, Media, Social Media)",
 *                     @OA\Property(
 *                         property="event",
 *                         type="object",
 *                         @OA\Property(property="event_id", type="integer", example=1),
 *                         @OA\Property(property="event_title", type="string", example="Tech Conference 2025"),
 *                         @OA\Property(property="description", type="string", description="Rich text description with formatting preserved", example="<p>Join us for an exciting tech conference...</p>"),
 *                         @OA\Property(property="event_category_id", type="integer", example=1),
 *                         @OA\Property(property="start_date", type="string", format="date", description="Formatted as d-m-Y", example="15-12-2025"),
 *                         @OA\Property(property="end_date", type="string", format="date", description="Formatted as d-m-Y", example="16-12-2025"),
 *                         @OA\Property(property="start_time", type="string", format="time", description="Formatted as H:i", example="09:00"),
 *                         @OA\Property(property="end_time", type="string", format="time", description="Formatted as H:i", example="18:00"),
 *                         @OA\Property(property="key_highlights", type="string", nullable=true, description="Rich text key highlights", example="<ul><li>Keynote speakers</li></ul>")
 *                     ),
 *                     @OA\Property(
 *                         property="media",
 *                         type="object",
 *                         description="Media grouped by type",
 *                         @OA\Property(
 *                             property="thumbnail",
 *                             type="array",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_media_id", type="integer", example=1),
 *                                 @OA\Property(property="media_type", type="string", example="thumbnail"),
 *                                 @OA\Property(property="file_path", type="string", example="events/1/thumbnail/image.jpg"),
 *                                 @OA\Property(property="file_name", type="string", example="image.jpg"),
 *                                 @OA\Property(property="file_size", type="integer", example=1024000)
 *                             )
 *                         ),
 *                         @OA\Property(
 *                             property="banner",
 *                             type="array",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_media_id", type="integer", example=2),
 *                                 @OA\Property(property="media_type", type="string", example="banner"),
 *                                 @OA\Property(property="file_path", type="string", example="events/1/banner/banner.jpg"),
 *                                 @OA\Property(property="file_name", type="string", example="banner.jpg"),
 *                                 @OA\Property(property="file_size", type="integer", example=2048000)
 *                             )
 *                         ),
 *                         @OA\Property(
 *                             property="flyer",
 *                             type="array",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_media_id", type="integer", example=3),
 *                                 @OA\Property(property="media_type", type="string", example="flyer"),
 *                                 @OA\Property(property="file_path", type="string", example="events/1/flyer/flyer1.jpg"),
 *                                 @OA\Property(property="file_name", type="string", example="flyer1.jpg"),
 *                                 @OA\Property(property="file_size", type="integer", example=1536000)
 *                             )
 *                         ),
 *                         @OA\Property(
 *                             property="video",
 *                             type="array",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_media_id", type="integer", example=4),
 *                                 @OA\Property(property="media_type", type="string", example="video"),
 *                                 @OA\Property(property="file_path", type="string", example="events/1/video/video.mp4"),
 *                                 @OA\Property(property="file_name", type="string", example="video.mp4"),
 *                                 @OA\Property(property="file_size", type="integer", example=52428800),
 *                                 @OA\Property(property="video_duration", type="string", example="2:30")
 *                             )
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="social_media",
 *                         type="array",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="event_social_media_id", type="integer", example=1),
 *                             @OA\Property(property="platform", type="string", example="facebook"),
 *                             @OA\Property(property="url", type="string", example="https://facebook.com/eventpage")
 *                         )
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="step_2",
 *                     type="object",
 *                     description="Step 2: Ticketing (Tickets and Ticket Categories)",
 *                     @OA\Property(
 *                         property="tickets",
 *                         type="array",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="ticket_id", type="integer", example=1),
 *                             @OA\Property(property="ticket_category_id", type="integer", example=1),
 *                             @OA\Property(property="category_name", type="string", example="Early Bird"),
 *                             @OA\Property(property="ticket_type", type="string", example="single_entry"),
 *                             @OA\Property(property="description", type="string", nullable=true, example="Limited time offer"),
 *                             @OA\Property(property="price", type="string", example="199.00"),
 *                             @OA\Property(property="total_available", type="integer", example=100),
 *                             @OA\Property(property="sold_quantity", type="integer", example=25),
 *                             @OA\Property(property="ticket_info", type="string", nullable=true, description="Rich text description", example="<p>Includes access to all sessions</p>"),
 *                             @OA\Property(property="max_per_user", type="integer", example=5)
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="ticket_categories",
 *                         type="array",
 *                         description="All ticket categories for this event (for dropdown)",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="ticket_category_id", type="integer", example=1),
 *                             @OA\Property(property="category_name", type="string", example="Early Bird")
 *                         )
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="step_3",
 *                     type="object",
 *                     description="Step 3: Venue Details",
 *                     @OA\Property(
 *                         property="venue",
 *                         type="object",
 *                         nullable=true,
 *                         @OA\Property(property="venue_id", type="integer", example=1),
 *                         @OA\Property(property="venue_name", type="string", example="Madison Square Garden"),
 *                         @OA\Property(property="venue_address", type="string", example="4 Pennsylvania Plaza"),
 *                         @OA\Property(property="city", type="string", example="New York"),
 *                         @OA\Property(property="state_province", type="string", example="NY"),
 *                         @OA\Property(property="postal_code", type="string", example="10001"),
 *                         @OA\Property(property="country_id", type="integer", example=1),
 *                         @OA\Property(property="latitude", type="string", example="40.7505"),
 *                         @OA\Property(property="longitude", type="string", example="-73.9934"),
 *                         @OA\Property(property="maximum_attendees", type="integer", example=20000),
 *                         @OA\Property(property="additional_details", type="string", nullable=true, example="Main entrance, Floor 1"),
 *                         @OA\Property(property="venue_image", type="string", nullable=true, example="venues/1/venue_image.jpg")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="step_4",
 *                     type="object",
 *                     description="Step 4: Event Members (Artists)",
 *                     @OA\Property(
 *                         property="artists",
 *                         type="array",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="event_artist_id", type="integer", example=1),
 *                             @OA\Property(property="artist_name", type="string", example="John Doe"),
 *                             @OA\Property(property="artist_image", type="string", nullable=true, example="artists/1/john_doe.jpg"),
 *                             @OA\Property(
 *                                 property="social_media",
 *                                 type="array",
 *                                 @OA\Items(
 *                                     type="object",
 *                                     @OA\Property(property="artist_social_media_id", type="integer", example=1),
 *                                     @OA\Property(property="platform", type="string", example="instagram"),
 *                                     @OA\Property(property="url", type="string", example="https://instagram.com/@johndoe")
 *                                 )
 *                             )
 *                         )
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="step_5",
 *                     type="object",
 *                     description="Step 5: Terms & Conditions",
 *                     @OA\Property(
 *                         property="terms",
 *                         type="object",
 *                         nullable=true,
 *                         @OA\Property(property="event_terms_id", type="integer", example=1),
 *                         @OA\Property(property="terms_content", type="string", description="Rich text content with formatting preserved", example="<p>Terms and conditions content...</p>")
 *                     )
 *                 ),
 *                 @OA\Property(
 *                     property="step_6",
 *                     type="object",
 *                     description="Step 6: Coupons (All coupons, not filtered by validity)",
 *                     @OA\Property(
 *                         property="coupons",
 *                         type="array",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="coupon_id", type="integer", example=1),
 *                             @OA\Property(property="coupon_code", type="string", example="EARLY20"),
 *                             @OA\Property(property="discount_type", type="string", example="percentage"),
 *                             @OA\Property(property="discount_percent", type="string", nullable=true, example="20.00"),
 *                             @OA\Property(property="flat_discount_amount", type="string", nullable=true, example=null),
 *                             @OA\Property(property="max_cap_discount", type="string", nullable=true, example="100.00"),
 *                             @OA\Property(property="max_times_applicable", type="integer", example=100),
 *                             @OA\Property(property="start_date", type="string", format="date", description="Formatted as d-m-Y", example="01-12-2025"),
 *                             @OA\Property(property="end_date", type="string", format="date", nullable=true, description="Formatted as d-m-Y", example="31-12-2025"),
 *                             @OA\Property(property="times_used", type="integer", example=45)
 *                         )
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. event_id is missing or invalid.",
 *         @OA\JsonContent(
 *             type="object",
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
 *                         property="event_id",
 *                         type="array",
 *                         @OA\Items(type="string"),
 *                         example={"The event id field is required.", "The selected event id is invalid."}
 *                     )
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
 *         response=404,
 *         description="Not found error (E404). Event not found or user does not have permission to view it.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested resource (event) was not found or user doesn't have permission to access it"),
 *                 @OA\Property(property="error_message", type="string", example="Event not found or you do not have permission to view it")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Server error (E002). An unexpected error occurred while retrieving event data for editing.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving event data for editing")
 *             )
 *         )
 *     )
 * )
 */
class GetEventDataForEditing
{
    // Empty class for swagger-php to parse annotations
}

