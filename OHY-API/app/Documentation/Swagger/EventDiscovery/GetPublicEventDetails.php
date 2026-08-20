<?php

namespace App\Documentation\Swagger\EventDiscovery;

/**
 * @OA\Get(
 *     path="/v1/get_public_event_details",
 *     summary="Get Public Event Details",
 *     description="Retrieves complete detailed information for a single published event including all relationships (category, venue, media, artists, tickets, terms, social media). This is a public endpoint that does not require authentication. Only published events (is_published = true, is_draft = false) AND not hidden by admin (is_hidden_by_admin = false) are returned. Hidden events are excluded from public access but remain visible to event hosts. Returns 404 error if event not found, not published, or hidden by admin.
 *
 * **Complete Flow:**
 * 1. Request validation: Validates required query parameter event_id (must be integer, minimum 1)
 * 2. Event retrieval: Calls EventModel::get_public_event_details() which:
 *    - Queries events table by event_id
 *    - Filters where is_published = true AND is_draft = false AND is_hidden_by_admin = false (only published, non-hidden events)
 *    - Eager loads all relationships to prevent N+1 queries:
 *      - eventCategory: Event category relationship
 *      - venue.country: Venue with country relationship
 *      - media: All media files (thumbnail, banner, flyer, video)
 *      - artists.socialMedia: Artists with their social media links
 *      - termsConditions: Terms and conditions document
 *      - socialMedia: Event social media links
 *      - tickets.ticketCategory: Tickets with their categories
 *    - Returns single event record or null if not found/not published
 * 3. Event existence check: If event is null, returns 404 error (E404)
 * 4. Data formatting: Formats complete event data with all relationships:
 *    - Formats category data (event_category_id, category_name) or null
 *    - Groups media by type: thumbnail (single), banner (single), flyers (array), videos (array with video_duration)
 *    - Formats artists data with social media links (array of objects)
 *    - Formats terms and conditions (terms_content rich text) or null
 *    - Formats venue data with complete details including country, latitude, longitude
 *    - Formats event social media links (array of objects with platform, url)
 *    - Formats tickets data with categories, availability calculation (total_available - sold_quantity)
 *    - Formats dates as d-m-Y (e.g., '15-12-2025') - day-month-year format
 *    - Formats times as H:i (e.g., '09:00') - hours and minutes only
 * 5. Response: Returns complete formatted event object with all relationships
 *
 * **Event Status Check:**
 * - Only published, non-hidden events are returned (is_published = true, is_draft = false, is_hidden_by_admin = false)
 * - Draft events are not accessible through this endpoint
 * - Hidden events are not accessible through this endpoint (excluded from public listings)
 * - If event exists but is not published or is hidden, returns 404 error (E404)
 * - If event does not exist, returns 404 error (E404)
 *
 * **Data Transformations:**
 * - Date formatting: All dates formatted as d-m-Y (e.g., '15-12-2025') - day-month-year format
 * - Time formatting: All times formatted as H:i (e.g., '09:00') - hours and minutes only, no seconds or timezone
 * - Media grouping: Media files grouped by type (thumbnail, banner, flyers, videos)
 * - Availability calculation: For each ticket, available_quantity = total_available - sold_quantity
 * - Rich text fields: description, key_highlights, terms_content preserve formatting (HTML/JSON format)
 *
 * **Relationship Data:**
 * - Event Category: Includes event_category_id and category_name. Null if not assigned.
 * - Media: Grouped by type (thumbnail, banner, flyers, videos). Includes file_path, file_name, file_size, and video_duration for videos.
 * - Artists: Includes event_artist_id, artist_name, artist_image, and an array of social_media links (platform, url).
 * - Terms & Conditions: Includes terms_content (rich text). Null if not available.
 * - Venue: Includes venue_name, venue_address, city, state_province, postal_code, country (country_id, name), latitude, longitude, additional_details, venue_image. Null if not assigned.
 * - Social Media: Array of event-specific social media links (platform, url).
 * - Tickets: Includes ticket_id, ticket_category (ticket_category_id, category_name), ticket_type, description, price, total_available, sold_quantity, available_quantity (calculated), ticket_info (rich text), max_per_user.
 *
 * **Error Handling:**
 * - Validation errors (400): E001 error code for invalid query parameters (e.g., missing event_id, invalid format)
 * - Not Found (404): E404 error code if the event_id does not correspond to an existing or published event
 * - Server errors (500): E002 error code for unexpected server-side exceptions (e.g., database issues)",
 *     tags={"End User - Event Discovery API"},
 *     @OA\Parameter(
 *         name="event_id",
 *         in="query",
 *         required=true,
 *         description="Event ID to retrieve. Must be an integer with minimum value of 1. Required field. Validation rule: 'required|integer|min:1'",
 *         @OA\Schema(type="integer", minimum=1, example=1)
 *     ),
 *     @OA\Response(
 *         response=200,
 *         description="Event details retrieved successfully. Returns complete event information with all related data.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=true, description="Indicates successful operation"),
 *             @OA\Property(
 *                 property="data",
 *                 type="object",
 *                 @OA\Property(property="message", type="string", example="Event details retrieved successfully", description="Success message"),
 *                 @OA\Property(
 *                     property="event",
 *                     type="object",
 *                     description="Complete event object with all relationships and formatted data.",
 *                     @OA\Property(property="event_id", type="integer", example=1, description="Unique event identifier"),
 *                     @OA\Property(property="event_title", type="string", example="Music Festival 2025", description="Event title/name"),
 *                     @OA\Property(property="description", type="string", example="A spectacular music festival featuring top artists...", description="Event description (rich text format, formatting preserved)"),
 *                     @OA\Property(property="key_highlights", type="string", nullable=true, example="• Top artists from around the world\n• Multiple stages\n• Food and drinks available", description="Key highlights of the event (rich text format, formatting preserved). Null if not provided."),
 *                     @OA\Property(property="start_date", type="string", example="15-12-2025", description="Event start date formatted as d-m-Y (day-month-year). Format: d-m-Y (e.g., '15-12-2025')"),
 *                     @OA\Property(property="end_date", type="string", example="16-12-2025", description="Event end date formatted as d-m-Y (day-month-year). Format: d-m-Y (e.g., '16-12-2025')"),
 *                     @OA\Property(property="start_time", type="string", example="09:00", description="Event start time formatted as H:i (hours:minutes). Format: H:i (e.g., '09:00'), no seconds or timezone"),
 *                     @OA\Property(property="end_time", type="string", example="18:00", description="Event end time formatted as H:i (hours:minutes). Format: H:i (e.g., '18:00'), no seconds or timezone"),
 *                     @OA\Property(
 *                         property="category",
 *                         type="object",
 *                         nullable=true,
 *                         description="Event category information. Null if event has no category assigned.",
 *                         @OA\Property(property="event_category_id", type="integer", example=1, description="Category ID"),
 *                         @OA\Property(property="category_name", type="string", example="Music", description="Category name")
 *                     ),
 *                     @OA\Property(
 *                         property="media",
 *                         type="object",
 *                         description="Media files associated with the event, grouped by type.",
 *                         @OA\Property(
 *                             property="thumbnail",
 *                             type="object",
 *                             nullable=true,
 *                             description="Thumbnail image information. Null if no thumbnail is available.",
 *                             @OA\Property(property="event_media_id", type="integer", example=1, description="Media ID"),
 *                             @OA\Property(property="file_path", type="string", example="events/1/thumbnail/image.jpg", description="Thumbnail file path"),
 *                             @OA\Property(property="file_name", type="string", example="image.jpg", description="Original filename"),
 *                             @OA\Property(property="file_size", type="integer", nullable=true, example=102400, description="File size in bytes. Null if not available.")
 *                         ),
 *                         @OA\Property(
 *                             property="banner",
 *                             type="object",
 *                             nullable=true,
 *                             description="Banner image information. Null if no banner is available.",
 *                             @OA\Property(property="event_media_id", type="integer", example=2, description="Media ID"),
 *                             @OA\Property(property="file_path", type="string", example="events/1/banner/banner.jpg", description="Banner file path"),
 *                             @OA\Property(property="file_name", type="string", example="banner.jpg", description="Original filename"),
 *                             @OA\Property(property="file_size", type="integer", nullable=true, example=512000, description="File size in bytes. Null if not available.")
 *                         ),
 *                         @OA\Property(
 *                             property="flyers",
 *                             type="array",
 *                             description="Array of flyer images.",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_media_id", type="integer", example=3, description="Media ID"),
 *                                 @OA\Property(property="file_path", type="string", example="events/1/flyer/flyer1.jpg", description="Flyer file path"),
 *                                 @OA\Property(property="file_name", type="string", example="flyer1.jpg", description="Original filename"),
 *                                 @OA\Property(property="file_size", type="integer", nullable=true, example=204800, description="File size in bytes. Null if not available.")
 *                             )
 *                         ),
 *                         @OA\Property(
 *                             property="videos",
 *                             type="array",
 *                             description="Array of video files.",
 *                             @OA\Items(
 *                                 type="object",
 *                                 @OA\Property(property="event_media_id", type="integer", example=4, description="Media ID"),
 *                                 @OA\Property(property="file_path", type="string", example="events/1/video/video1.mp4", description="Video file path"),
 *                                 @OA\Property(property="file_name", type="string", example="video1.mp4", description="Original filename"),
 *                                 @OA\Property(property="file_size", type="integer", nullable=true, example=52428800, description="File size in bytes. Null if not available."),
 *                                 @OA\Property(property="video_duration", type="string", nullable=true, example="2:30", description="Video duration in format MM:SS (e.g., '2:30' for 2 minutes 30 seconds). Null if not available.")
 *                             )
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="artists",
 *                         type="array",
 *                         description="Array of artists performing at the event.",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="event_artist_id", type="integer", example=1, description="Artist ID"),
 *                             @OA\Property(property="artist_name", type="string", example="DJ Coolio", description="Artist's name"),
 *                             @OA\Property(property="artist_image", type="string", nullable=true, example="artists/1/image.jpg", description="Artist's image file path. Null if not available."),
 *                             @OA\Property(
 *                                 property="social_media",
 *                                 type="array",
 *                                 description="Array of social media links for the artist.",
 *                                 @OA\Items(
 *                                     type="object",
 *                                     @OA\Property(property="platform", type="string", example="Instagram", description="Social media platform name"),
 *                                     @OA\Property(property="url", type="string", example="https://instagram.com/djcoolio", description="Full URL to the social media profile")
 *                                 )
 *                             )
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="terms_conditions",
 *                         type="object",
 *                         nullable=true,
 *                         description="Terms and conditions for the event. Null if not available.",
 *                         @OA\Property(property="terms_content", type="string", example="<p>All tickets are non-refundable...</p>", description="Rich text content of the terms and conditions (HTML/JSON format, formatting preserved)")
 *                     ),
 *                     @OA\Property(
 *                         property="venue",
 *                         type="object",
 *                         nullable=true,
 *                         description="Venue information for the event. Null if not available.",
 *                         @OA\Property(property="venue_name", type="string", example="Grand Arena", description="Venue name"),
 *                         @OA\Property(property="venue_address", type="string", example="123 Main St", description="Full street address of the venue"),
 *                         @OA\Property(property="city", type="string", example="New York", description="City of the venue"),
 *                         @OA\Property(property="state_province", type="string", example="NY", description="State or province of the venue"),
 *                         @OA\Property(property="postal_code", type="string", example="10001", description="ZIP or postal code of the venue"),
 *                         @OA\Property(
 *                             property="country",
 *                             type="object",
 *                             nullable=true,
 *                             description="Country information for the venue. Null if not available.",
 *                             @OA\Property(property="country_id", type="integer", example=1, description="Country ID"),
 *                             @OA\Property(property="name", type="string", example="United States", description="Country name")
 *                         ),
 *                         @OA\Property(property="latitude", type="number", format="float", example=40.7128, description="Latitude coordinate of the venue"),
 *                         @OA\Property(property="longitude", type="number", format="float", example=-74.0060, description="Longitude coordinate of the venue"),
 *                         @OA\Property(property="additional_details", type="string", nullable=true, example="Entrance on 5th Avenue", description="Additional details about the venue. Null if not provided."),
 *                         @OA\Property(property="venue_image", type="string", nullable=true, example="venues/1/image.jpg", description="Venue image file path. Null if not available.")
 *                     ),
 *                     @OA\Property(
 *                         property="social_media",
 *                         type="array",
 *                         description="Array of social media links for the event.",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="platform", type="string", example="Facebook", description="Social media platform name"),
 *                             @OA\Property(property="url", type="string", example="https://facebook.com/musicfest", description="Full URL to the event's social media page")
 *                         )
 *                     ),
 *                     @OA\Property(
 *                         property="tickets",
 *                         type="array",
 *                         description="Array of ticket types available for the event.",
 *                         @OA\Items(
 *                             type="object",
 *                             @OA\Property(property="ticket_id", type="integer", example=1, description="Ticket ID"),
 *                             @OA\Property(
 *                                 property="ticket_category",
 *                                 type="object",
 *                                 nullable=true,
 *                                 description="Ticket category information. Null if not assigned.",
 *                                 @OA\Property(property="ticket_category_id", type="integer", example=1, description="Ticket category ID"),
 *                                 @OA\Property(property="category_name", type="string", example="VIP", description="Ticket category name")
 *                             ),
 *                             @OA\Property(property="ticket_type", type="string", example="single_entry", description="Type of ticket (e.g., 'single_entry', 'table_ticket')"),
 *                             @OA\Property(property="description", type="string", example="Early Bird VIP Ticket", description="Short description or tag for the ticket"),
 *                             @OA\Property(property="price", type="number", format="float", example=150.00, description="Price of the ticket"),
 *                             @OA\Property(property="total_available", type="integer", example=100, description="Total number of tickets available in inventory"),
 *                             @OA\Property(property="sold_quantity", type="integer", example=20, description="Number of tickets already sold"),
 *                             @OA\Property(property="available_quantity", type="integer", example=80, description="Calculated available quantity (total_available - sold_quantity)"),
 *                             @OA\Property(property="ticket_info", type="string", nullable=true, example="<p>Includes backstage access and free drinks.</p>", description="Rich text description of what's included with the ticket. Null if not provided."),
 *                             @OA\Property(property="max_per_user", type="integer", nullable=true, example=5, description="Maximum number of this ticket type a single user can purchase. Null if no limit.")
 *                         )
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=400,
 *         description="Validation error (E001). Request validation failed. Returns detailed error messages for each field that failed validation.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed operation"),
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
 *                         example={"The event id field is required.", "The event id must be an integer."}
 *                     )
 *                 )
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=404,
 *         description="Not found error (E404). Event not found or not published. This occurs if the provided event_id does not exist or corresponds to an event that is not publicly available.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed operation"),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E404", description="E404: Resource not found - indicates that the requested event does not exist or is not published"),
 *                 @OA\Property(property="error_message", type="string", example="Event not found")
 *             )
 *         )
 *     ),
 *     @OA\Response(
 *         response=500,
 *         description="Internal server error (E002). An unexpected error occurred during event details retrieval. This could be due to database connection issues or other server-side exceptions.",
 *         @OA\JsonContent(
 *             type="object",
 *             @OA\Property(property="success", type="boolean", example=false, description="Indicates failed operation"),
 *             @OA\Property(
 *                 property="error",
 *                 type="object",
 *                 @OA\Property(property="error_code", type="string", example="E002", description="E002: General server errors / exceptions - indicates an unexpected server-side error occurred"),
 *                 @OA\Property(property="error_message", type="string", example="An error occurred while retrieving event details")
 *             )
 *         )
 *     )
 * )
 */
class GetPublicEventDetails
{
    // Empty class - annotations are in docblock
}

