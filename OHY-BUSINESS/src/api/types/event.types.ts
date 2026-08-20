/**
 * Event API Type Definitions
 * TypeScript interfaces for event creation and management APIs
 */

/**
 * Event category from master data
 */
export interface EventCategory {
  // Unique identifier for the event category
  event_category_id: number;
  // Category name (e.g., 'Technology', 'Music', 'Sports')
  category_name: string;
}

/**
 * Country from master data
 */
export interface Country {
  // Unique identifier for the country
  country_id: number;
  // Common country name (e.g., 'United States')
  name: string;
  // User-friendly country name (e.g., 'United States of America')
  nicename: string;
  // Two-letter ISO country code (e.g., 'US', 'GB', 'IN')
  iso: string;
  // Path/URL to country flag icon (if exists)
  flag_icon: string | null;
}

/**
 * Ticket type from master data
 */
export interface TicketType {
  // ENUM value from database (snake_case)
  value: string;
  // Human-readable label (Title Case)
  label: string;
}

/**
 * Social media platform from master data
 */
export interface SocialMediaPlatform {
  // ENUM value from database (snake_case)
  value: string;
  // Human-readable label (Title Case)
  label: string;
}

/**
 * Discount type from master data
 */
export interface DiscountType {
  // ENUM value from database (snake_case)
  value: string;
  // Human-readable label (Title Case)
  label: string;
}

/**
 * Event creation master data response
 */
export interface EventCreationMasterDataResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Array of event categories sorted alphabetically
    event_categories: EventCategory[];
    // Array of active countries sorted alphabetically
    countries: Country[];
    // Array of ticket type ENUM values with labels
    ticket_types: TicketType[];
    // Array of all social media platforms including Spotify
    social_media_platforms: SocialMediaPlatform[];
    // Array of social media platforms without Spotify (for events)
    event_social_media_platforms: SocialMediaPlatform[];
    // Array of discount type ENUM values with labels
    discount_types: DiscountType[];
  };
}

/**
 * Event status filter values supported by get_events_list API
 */
export type EventStatusFilter = "live" | "upcoming" | "completed" | "drafts";

/**
 * Request parameters for get_events_list API
 */
export interface GetEventsListRequest {
  // Optional status filter to narrow events by lifecycle (live, upcoming, completed, drafts)
  status?: EventStatusFilter;
  // Optional search keyword applied on event_title and description (max 255 chars)
  search?: string;
  // Optional page number for pagination (defaults to 1 on backend)
  page?: number;
  // Optional records per page (defaults to 30, minimum 1, maximum 100)
  per_page?: number;
}

/**
 * Save event step 1 request data
 * Note: This is used for type reference only
 * Actual API call uses FormData for multipart/form-data
 */
export interface SaveEventStep1Request {
  // Event ID for update operation (optional)
  event_id?: number;
  // Event title/name
  event_title: string;
  // Event description in rich text format
  description: string;
  // Event category ID
  event_category_id: number;
  // Event start date (d-m-Y format)
  start_date: string;
  // Event end date (d-m-Y format)
  end_date: string;
  // Event start time (H:i:s format)
  start_time: string;
  // Event end time (H:i:s format)
  end_time: string;
  // Key highlights in rich text format (optional)
  key_highlights?: string | null;
  // Event thumbnail image file (optional)
  event_thumbnail?: File;
  // Event banner image file (optional)
  event_banner?: File;
  // Event flyer image files (optional, multiple)
  event_flyer?: File[];
  // Event video files (optional, multiple)
  event_video?: File[];
  // Facebook URL (optional)
  facebook_url?: string | null;
  // Instagram URL (optional)
  instagram_url?: string | null;
  // TikTok URL (optional)
  tiktok_url?: string | null;
  // LinkedIn URL (optional)
  linkedin_url?: string | null;
  // Snapchat URL (optional)
  snapchat_url?: string | null;
  // Twitter/X URL (optional)
  twitter_url?: string | null;
  // YouTube URL (optional)
  youtube_url?: string | null;
}

/**
 * Event data from save step 1 response
 */
export interface EventData {
  // Event ID
  event_id: number;
  // Event title
  event_title: string;
  // Event description
  description: string;
  // Event category ID
  event_category_id: number;
  // Start date (d-m-Y format)
  start_date: string;
  // End date (d-m-Y format)
  end_date: string;
  // Start time (H:i format)
  start_time: string;
  // End time (H:i format)
  end_time: string;
  // Key highlights (optional)
  key_highlights?: string | null;
  // Draft status
  is_draft: boolean;
  // Published status
  is_published: boolean;
  // New event flag (true if created, false if updated)
  is_new_event: boolean;
}

/**
 * Event attendees info block returned by get_events_list
 */
export interface EventAttendeesInfo {
  // Number of tickets sold for the event
  sold: number;
  // Maximum attendees allowed by the venue (null if not configured)
  maximum: number | null;
  // Pre-formatted display string (e.g., "95/120 attendees" or "95 attendees")
  display: string;
}

/**
 * Ticket price info block returned by get_events_list
 */
export interface EventTicketPriceInfo {
  // Minimum ticket price across all ticket types (null if no tickets)
  min: number | null;
  // Maximum ticket price across all ticket types (null if no tickets)
  max: number | null;
  // Pre-formatted display string (e.g., "$25 per ticket" or "$25 - $100")
  display: string;
}

/**
 * Revenue info block returned by get_events_list
 */
export interface EventRevenueInfo {
  // Total revenue amount computed from sold tickets (0 if nothing sold)
  amount: number;
  // Pre-formatted display string with currency suffix (e.g., "$4,800 Revenue")
  display: string;
}

/**
 * Single event item returned by get_events_list API
 */
export interface EventsListItem {
  // Unique identifier for the event
  event_id: number;
  // Human-readable event title
  event_title: string;
  // Event description (may include HTML)
  description: string;
  // Calculated status string (live, upcoming, completed, draft)
  status: string;
  // Optional category name associated with the event
  category_name: string | null;
  // Start date formatted as d-m-Y
  start_date: string;
  // Start time formatted as H:i
  start_time: string;
  // End date formatted as d-m-Y
  end_date: string;
  // End time formatted as H:i
  end_time: string;
  // Optional venue name when available
  venue_name: string | null;
  // Aggregated attendees information
  attendees: EventAttendeesInfo;
  // Ticket price range object
  ticket_price: EventTicketPriceInfo;
  // Revenue information object
  revenue: EventRevenueInfo;
  // Thumbnail relative file path (null if absent)
  thumbnail: string | null;
}

/**
 * Pagination metadata returned by get_events_list
 */
export interface EventsPagination {
  // Total number of records matching current filters
  total_records: number;
  // Current page number
  current_page: number;
  // Total number of pages for the current page size
  total_pages: number;
  // Next page number or null if already on last page
  next_page: number | null;
  // Previous page number or null if already on first page
  prev_page: number | null;
}

/**
 * Get events list API response structure
 */
export interface GetEventsListResponse {
  // Success flag indicating request success
  success: boolean;
  // Response payload block
  data: {
    // Success message from API (e.g., "Events retrieved successfully")
    message: string;
    // Array of event list items sorted newest first
    events: EventsListItem[];
    // Pagination metadata block
    pagination: EventsPagination;
  };
}

/**
 * Save event step 1 response
 */
export interface SaveEventStep1Response {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Event data
    event: EventData;
  };
}

/**
 * API error response
 */
export interface ApiErrorResponse {
  // Success flag (always false for errors)
  success: false;
  // Error details
  error: {
    // Error code (e.g., "E001", "E003")
    error_code: string;
    // Error message (string or validation errors object)
    error_message: string | Record<string, string[]>;
  };
}

/**
 * Event media item from get_event_data_for_editing API
 */
export interface EventMediaItem {
  // Unique identifier for the event media
  event_media_id: number;
  // Media type (thumbnail, banner, flyer, video)
  media_type: string;
  // Relative file path (e.g., "events/1/thumbnail/image.jpg")
  file_path: string;
  // Original file name
  file_name: string;
  // File size in bytes
  file_size: number;
  // Video duration in format "M:SS" (only for video type)
  video_duration?: string | null;
}

/**
 * Event media grouped by type
 */
export interface EventMediaGroup {
  // Thumbnail media (single item array)
  thumbnail: EventMediaItem[];
  // Banner media (single item array)
  banner: EventMediaItem[];
  // Flyer media (multiple items array)
  flyer: EventMediaItem[];
  // Video media (multiple items array)
  video: EventMediaItem[];
}

/**
 * Event social media link
 */
export interface EventSocialMedia {
  // Unique identifier for the social media link
  event_social_media_id: number;
  // Platform name (facebook, instagram, tiktok, etc.)
  platform: string;
  // Social media URL
  url: string;
}

/**
 * Step 1 data from get_event_data_for_editing API
 */
export interface EventStep1Data {
  // Event basic information
  event: {
    // Event ID
    event_id: number;
    // Event title
    event_title: string;
    // Event description (rich text)
    description: string;
    // Event category ID
    event_category_id: number;
    // Start date (d-m-Y format)
    start_date: string;
    // End date (d-m-Y format)
    end_date: string;
    // Start time (H:i format)
    start_time: string;
    // End time (H:i format)
    end_time: string;
    // Key highlights (rich text, optional)
    key_highlights?: string | null;
  };
  // Media files grouped by type
  media: EventMediaGroup;
  // Social media links
  social_media: EventSocialMedia[];
}

/**
 * Ticket category for an event
 */
export interface TicketCategory {
  // Unique identifier for the ticket category
  ticket_category_id: number;
  // Category name (e.g., 'Early Bird', 'VIP', 'Regular')
  category_name: string;
}

/**
 * Create ticket category request
 */
export interface CreateTicketCategoryRequest {
  // Event ID to create category for
  event_id: number;
  // Category name
  category_name: string;
}

/**
 * Create ticket category response
 */
export interface CreateTicketCategoryResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Created ticket category
    ticket_category: TicketCategory;
  };
}

/**
 * Get ticket categories response
 */
export interface GetTicketCategoriesResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Array of ticket categories sorted alphabetically
    ticket_categories: TicketCategory[];
  };
}

/**
 * Ticket request for save_event_step_2 API
 */
export interface TicketRequest {
  // Ticket category ID (required)
  ticket_category_id: number;
  // Ticket type (always "single_entry" for normal tickets)
  ticket_type: "single_entry" | "multiple_entry";
  // Ticket price (required, numeric, >= 0)
  price: number;
  // Total tickets available (required, integer, >= 1)
  total_available: number;
  // Maximum tickets per user (required, integer, >= 1)
  max_per_user: number;
  // Description/tag (optional, max 255 chars)
  description?: string | null;
  // Rich text ticket info (optional)
  ticket_info?: string | null;
}

/**
 * Ticket response from save_event_step_2 API
 */
export interface TicketResponse {
  // Unique identifier for the ticket
  ticket_id: number;
  // Event ID
  event_id: number;
  // Ticket category ID
  ticket_category_id: number;
  // Category name (from ticket_categories table)
  category_name: string;
  // Ticket type
  ticket_type: "single_entry" | "multiple_entry";
  // Description/tag
  description?: string | null;
  // Price as string
  price: string;
  // Total tickets available
  total_available: number;
  // Quantity sold (always 0 for newly created tickets)
  sold_quantity: number;
  // Available quantity (calculated: total_available - sold_quantity)
  available_quantity: number;
  // Rich text ticket info
  ticket_info?: string | null;
  // Maximum tickets per user
  max_per_user: number;
}

/**
 * Save event step 2 request
 */
export interface SaveEventStep2Request {
  // Event ID to save tickets for
  event_id: number;
  // Array of ticket objects (can be empty to delete all tickets)
  tickets: TicketRequest[];
}

/**
 * Save event step 2 response
 */
export interface SaveEventStep2Response {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Array of all created tickets with complete details
    tickets: TicketResponse[];
  };
}

/**
 * Step 2 data from get_event_data_for_editing API
 */
export interface EventStep2Data {
  // Array of tickets for this event
  tickets: TicketResponse[];
  // Array of ticket categories for this event (for dropdown)
  ticket_categories: TicketCategory[];
}

/**
 * Venue data from API
 */
export interface VenueData {
  // Unique identifier for the venue
  venue_id: number;
  // Event ID this venue belongs to
  event_id: number;
  // Venue name
  venue_name: string;
  // Full street address
  venue_address: string;
  // City name
  city: string;
  // State or province
  state_province: string;
  // Postal/ZIP code
  postal_code: string;
  // Country ID (foreign key to countries table)
  country_id: number;
  // Latitude coordinate (formatted as string to preserve decimal precision)
  latitude: string;
  // Longitude coordinate (formatted as string to preserve decimal precision)
  longitude: string;
  // Maximum number of attendees
  maximum_attendees: number;
  // Additional venue details (optional)
  additional_details?: string | null;
  // Venue image file path (optional)
  venue_image?: string | null;
}

/**
 * Save event step 3 request data
 * Note: This is used for type reference only
 * Actual API call uses FormData for multipart/form-data
 */
export interface SaveEventStep3Request {
  // Event ID for update operation (required)
  event_id: number;
  // Venue name (required)
  venue_name: string;
  // Full street address (required)
  venue_address: string;
  // City name (required)
  city: string;
  // State or province (required)
  state_province: string;
  // Postal/ZIP code (required)
  postal_code: string;
  // Country ID (required, integer)
  country_id: number;
  // Latitude coordinate (required, -90 to 90)
  latitude: number;
  // Longitude coordinate (required, -180 to 180)
  longitude: number;
  // Maximum attendees (required, integer, min 1)
  maximum_attendees: number;
  // Additional details (optional)
  additional_details?: string | null;
  // Venue image file (optional)
  venue_image?: File;
}

/**
 * Save event step 3 response
 */
export interface SaveEventStep3Response {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Venue data with coordinates formatted as strings
    venue: VenueData;
  };
}

/**
 * Step 3 data from get_event_data_for_editing API
 */
export interface EventStep3Data {
  // Venue data (null if no venue exists)
  venue: VenueData | null;
}

/**
 * Artist social media link
 */
export interface ArtistSocialMedia {
  // Unique identifier for the artist social media link
  artist_social_media_id: number;
  // Artist ID this social media link belongs to
  event_artist_id: number;
  // Social media platform (facebook, instagram, tiktok, linkedin, snapchat, twitter, youtube, spotify)
  platform: string;
  // Full URL to social media profile/page
  url: string;
}

/**
 * Artist data from API
 */
export interface ArtistData {
  // Unique identifier for the artist
  event_artist_id: number;
  // Event ID this artist belongs to
  event_id: number;
  // Artist name
  artist_name: string;
  // Artist image file path (optional)
  artist_image?: string | null;
  // Array of social media links for this artist
  social_media: ArtistSocialMedia[];
}

/**
 * Save event step 4 request data
 * Note: This is used for type reference only
 * Actual API call uses FormData for multipart/form-data
 */
export interface SaveEventStep4Request {
  // Event ID to save artists for
  event_id: number;
  // Array of artist objects (can be empty to delete all artists)
  artists: Array<{
    // Artist name (required)
    artist_name: string;
    // Artist image file (optional)
    artist_image?: File;
    // Array of social media links (optional)
    social_media?: Array<{
      // Platform name (required)
      platform: string;
      // Full URL (required)
      url: string;
    }>;
  }>;
}

/**
 * Save event step 4 response
 */
export interface SaveEventStep4Response {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Array of all created artists with their social media links
    artists: ArtistData[];
  };
}

/**
 * Step 4 data from get_event_data_for_editing API
 */
export interface EventStep4Data {
  // Array of artists for this event
  artists: ArtistData[];
}

/**
 * Coupon data from API
 */
export interface CouponData {
  // Unique identifier for the coupon
  coupon_id: number;
  // Event ID this coupon belongs to
  event_id: number;
  // Coupon code (globally unique)
  coupon_code: string;
  // Discount type (percentage or flat)
  discount_type: 'percentage' | 'flat';
  // Discount percent as string (null for flat discount type)
  discount_percent: string | null;
  // Flat discount amount as string (null for percentage discount type)
  flat_discount_amount: string | null;
  // Maximum cap discount as string (only for percentage discount type)
  max_cap_discount: string | null;
  // Maximum number of times coupon can be used
  max_times_applicable: number;
  // Coupon start date (d-m-Y format)
  start_date: string;
  // Coupon end date (d-m-Y format or null)
  end_date: string | null;
  // Times coupon has been used (always 0 for newly created coupons)
  times_used: number;
}

/**
 * Save event step 6 request data
 */
export interface SaveEventStep6Request {
  // Event ID to save coupons for
  event_id: number;
  // Array of coupons to save (replace all pattern)
  coupons: Array<{
    // Coupon code (required, globally unique)
    coupon_code: string;
    // Discount type (percentage or flat)
    discount_type: 'percentage' | 'flat';
    // Discount percentage (required for percentage type)
    discount_percent?: number | null;
    // Maximum cap discount (optional for percentage type)
    max_cap_discount?: number | null;
    // Flat discount amount (required for flat type)
    flat_discount_amount?: number | null;
    // Maximum times coupon can be used (required)
    max_times_applicable: number;
    // Start date in d-m-Y format (required)
    start_date: string;
    // End date in d-m-Y format (optional)
    end_date?: string | null;
  }>;
}

/**
 * Save event step 6 response
 */
export interface SaveEventStep6Response {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Array of saved coupons with formatted dates
    coupons: CouponData[];
  };
}

/**
 * Step 6 data from get_event_data_for_editing API
 */
export interface EventStep6Data {
  // Array of coupons for this event
  coupons: CouponData[];
}

/**
 * Event information block returned in summary API
 */
export interface EventSummaryInformation {
  event_id: number;
  event_title: string;
  description: string;
  category_name: string | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  key_highlights?: string | null;
}

/**
 * Event media item in summary response
 */
export interface EventSummaryMediaItem {
  event_media_id: number;
  media_type: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  video_duration?: string | null;
}

/**
 * Grouped event media object
 */
export interface EventSummaryMediaGroup {
  thumbnail: EventSummaryMediaItem[];
  banner: EventSummaryMediaItem[];
  flyer: EventSummaryMediaItem[];
  video: EventSummaryMediaItem[];
}

/**
 * Event social media link in summary response
 */
export interface EventSummarySocialLink {
  event_social_media_id: number;
  platform: string;
  url: string;
}

/**
 * Ticket summary item
 */
export interface EventSummaryTicket {
  ticket_id: number;
  category_name: string | null;
  ticket_type: string;
  price: string;
  total_available: number;
  sold_quantity: number;
  available_quantity: number;
  revenue: string;
}

/**
 * Venue summary block
 */
export interface EventSummaryVenue {
  venue_id: number;
  venue_name: string;
  venue_address?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  country_name?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  maximum_attendees?: number | null;
}

/**
 * Artist summary item
 */
export interface EventSummaryArtist {
  event_artist_id: number;
  artist_name: string;
  artist_image?: string | null;
  social_media: Array<{
    platform: string;
    url: string;
  }>;
}

/**
 * Terms & conditions summary block
 */
export interface EventSummaryTerms {
  event_terms_id: number;
  terms_content: string;
}

/**
 * Coupon summary item (active coupons only)
 */
export interface EventSummaryCoupon {
  coupon_id: number;
  coupon_code: string;
  discount_type: 'percentage' | 'flat';
  discount_percent: string | null;
  flat_discount_amount: string | null;
  max_cap_discount: string | null;
  max_times_applicable: number;
  start_date: string;
  end_date: string | null;
  times_used: number;
}

/**
 * Event data score block
 */
export interface EventSummaryScore {
  percentage: number;
  label: string;
  completed_sections: number;
  total_sections: number;
}

/**
 * Complete event summary data
 */
export interface EventSummaryData {
  event_information: EventSummaryInformation;
  event_media: EventSummaryMediaGroup;
  social_media: EventSummarySocialLink[];
  tickets: EventSummaryTicket[];
  total_revenue: string;
  venue: EventSummaryVenue | null;
  artists: EventSummaryArtist[];
  terms_conditions: EventSummaryTerms | null;
  coupons: EventSummaryCoupon[];
  event_data_score: EventSummaryScore;
}

/**
 * Request payload to publish event
 */
export interface PublishEventRequest {
  event_id: number;
  // Return URL for redirect after Stripe onboarding (optional)
  return_url?: string;
}

/**
 * Publish event API response
 */
export interface PublishEventResponse {
  success: boolean;
  data: {
    message: string;
    event: {
      event_id: number;
      event_title: string;
      is_draft: boolean;
      is_published: boolean;
    };
  };
}

/**
 * Get event summary API response
 */
export interface GetEventSummaryResponse {
  success: boolean;
  data: {
    message: string;
    event_summary: EventSummaryData;
  };
}

/**
 * Terms & Conditions data from API
 */
export interface EventTermsData {
  // Unique identifier for the terms record
  event_terms_id: number;
  // Event ID these terms belong to
  event_id: number;
  // Terms & conditions content (rich text)
  terms_content: string;
}

/**
 * Save event step 5 request data
 */
export interface SaveEventStep5Request {
  // Event ID to save terms for
  event_id: number;
  // Terms & conditions content (rich text/plain text)
  terms_content: string;
}

/**
 * Save event step 5 response
 */
export interface SaveEventStep5Response {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Terms data returned from API
    terms: EventTermsData;
  };
}

/**
 * Step 5 data from get_event_data_for_editing API
 */
export interface EventStep5Data {
  // Terms data or null if not set
  terms: EventTermsData | null;
}

/**
 * Event details header information
 * Contains basic event identification and status information
 */
export interface EventDetailsHeader {
  // Unique identifier for the event
  event_id: number;
  // Event title/name
  event_title: string;
  // Calculated event status: 'live', 'upcoming', 'completed', or 'draft'
  status: "live" | "upcoming" | "completed" | "draft";
  // Category name (null if not assigned)
  category_name: string | null;
  // Created date formatted as d-m-Y (e.g., "01-12-2025")
  created_date: string;
}

/**
 * Event details summary cards metrics
 * Contains aggregated statistics for quick overview
 */
export interface EventDetailsSummaryCards {
  // Total number of registered attendees (sum of sold_quantity)
  registered_count: number;
  // Total revenue from ticket sales
  revenue: number;
  // Number of ticket types created
  ticket_types: number;
  // Number of active coupons (valid date range and not fully used)
  active_coupons: number;
}

/**
 * Media file from event details
 * Represents a single media file with metadata
 */
export interface EventDetailsMediaFile {
  // File path relative to storage (e.g., "events/1/thumbnail/image.jpg")
  file_path: string;
  // File name
  file_name?: string;
  // File size in bytes (optional)
  file_size?: number;
  // Video duration in seconds (only for video media type)
  video_duration?: number;
}

/**
 * Event details media grouped by type
 * Media files organized by their type (thumbnail, banner, flyer, video)
 */
export interface EventDetailsMedia {
  // Thumbnail media (single file, array with one item or empty)
  thumbnail: EventDetailsMediaFile[];
  // Banner media (single file, array with one item or empty)
  banner: EventDetailsMediaFile[];
  // Flyer media (array of files, can be multiple)
  flyer: EventDetailsMediaFile[];
  // Video media (array of files with duration, can be multiple)
  video: EventDetailsMediaFile[];
}

/**
 * Event details ticket information
 * Contains ticket pricing, availability, and revenue data
 */
export interface EventDetailsTicket {
  // Unique identifier for the ticket
  ticket_id: number;
  // Ticket category name (null if not assigned to category)
  category_name: string | null;
  // Ticket description (null if not provided)
  description: string | null;
  // Rich text ticket info (fallback when description is null/empty)
  ticket_info: string | null;
  // Number of tickets sold
  sold_quantity: number;
  // Total tickets available
  total_available: number;
  // Ticket price as string (e.g., "199.00")
  price: string;
  // Revenue for this ticket type (sold_quantity * price) as string
  revenue: string;
}

/**
 * Artist social media link
 * Represents a social media link for an artist
 */
export interface EventDetailsArtistSocialMedia {
  // Unique identifier for the artist social media link
  artist_social_media_id: number;
  // Social media platform (e.g., "instagram", "spotify")
  platform: string;
  // Social media URL or handle
  url: string;
}

/**
 * Event details artist information
 * Contains artist details with social media links
 */
export interface EventDetailsArtist {
  // Unique identifier for the event artist
  event_artist_id: number;
  // Artist name
  artist_name: string;
  // Artist image file path (null if not uploaded)
  artist_image: string | null;
  // Array of social media links for this artist
  social_media: EventDetailsArtistSocialMedia[];
}

/**
 * Event details venue information
 * Contains complete venue details including location
 */
export interface EventDetailsVenue {
  // Venue name
  venue_name: string;
  // Venue street address
  venue_address: string;
  // City name
  city: string;
  // State or province
  state_province: string;
  // Postal/ZIP code
  postal_code: string;
  // Country name (null if not set)
  country_name: string | null;
  // Latitude coordinate (null if not set)
  latitude: number | null;
  // Longitude coordinate (null if not set)
  longitude: number | null;
}

/**
 * Event details social media link
 * Represents a social media link for the event
 */
export interface EventDetailsSocialMedia {
  // Unique identifier for the event social media link
  event_social_media_id: number;
  // Social media platform (e.g., "facebook", "instagram")
  platform: string;
  // Social media URL
  url: string;
}

/**
 * Event details active coupon
 * Contains coupon information with usage statistics
 */
export interface EventDetailsActiveCoupon {
  // Unique identifier for the coupon
  coupon_id: number;
  // Coupon code (e.g., "EARLY20")
  coupon_code: string;
  // Discount type (e.g., "percentage", "flat")
  discount_type: string;
  // Formatted discount display (e.g., "20% OFF" or "$50.00 OFF")
  discount_display: string;
  // Number of times coupon has been used
  times_used: number;
  // Maximum times coupon can be applied
  max_times_applicable: number;
  // Valid until date formatted as d-m-Y (null if no expiry)
  valid_until: string | null;
}

/**
 * Event details event overview
 * Contains main event content: description, media, tickets, artists, terms
 */
export interface EventDetailsEventOverview {
  // Full description with rich text formatting
  description: string;
  // What to expect section with bullet points (null if not provided)
  key_highlights: string | null;
  // Media grouped by type (thumbnail, banner, flyer, video)
  media: EventDetailsMedia;
  // Array of tickets with pricing and revenue information
  tickets: EventDetailsTicket[];
  // Total revenue from all ticket types as string
  total_revenue: string;
  // Array of artists with social media links
  artists: EventDetailsArtist[];
  // Terms & conditions content with rich text formatting (null if not provided)
  terms_conditions: string | null;
}

/**
 * Event details sidebar event details
 * Contains date and time information for the event
 */
export interface EventDetailsSidebarEventDetails {
  // Start date formatted as d-m-Y (e.g., "15-12-2025")
  start_date: string;
  // Start time formatted as H:i (e.g., "09:00")
  start_time: string;
  // End date formatted as d-m-Y (e.g., "16-12-2025")
  end_date: string;
  // End time formatted as H:i (e.g., "18:00")
  end_time: string;
}

/**
 * Event details sidebar
 * Contains sidebar content: event details, venue, social media, active coupons
 */
export interface EventDetailsSidebar {
  // Event date and time information
  event_details: EventDetailsSidebarEventDetails;
  // Venue information (null if not set)
  venue: EventDetailsVenue | null;
  // Array of event social media links
  social_media: EventDetailsSocialMedia[];
  // Array of active coupons (filtered by validity and usage)
  active_coupons: EventDetailsActiveCoupon[];
}

/**
 * Event details complete response structure
 * Contains all event information organized into sections
 */
export interface EventDetailsResponse {
  // Header information with event title, status, category, created date
  header: EventDetailsHeader;
  // Summary cards metrics: registered count, revenue, ticket types, active coupons
  summary_cards: EventDetailsSummaryCards;
  // Event overview content: description, media, tickets, artists, terms
  event_overview: EventDetailsEventOverview;
  // Sidebar content: event details, venue, social media, active coupons
  sidebar: EventDetailsSidebar;
}

/**
 * Get event details API response
 * Complete response wrapper with success flag and event details
 */
export interface GetEventDetailsResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Complete event details organized into sections
    event_details: EventDetailsResponse;
  };
}

/**
 * Get event data for editing API response
 * Returns complete event data organized by steps (step_1 through step_6)
 */
export interface GetEventDataForEditingResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Event ID
    event_id: number;
    // Step 1: Event Details (Event Info, Media, Social Media)
    step_1: EventStep1Data;
    // Step 2: Ticketing (Tickets and Ticket Categories)
    step_2?: EventStep2Data;
    // Step 3: Venue Details
    step_3?: EventStep3Data;
    // Step 4: Event Members (Artists)
    step_4?: EventStep4Data;
    // Step 5: Terms & Conditions
    step_5?: EventStep5Data;
    // Step 6: Coupons
    step_6?: EventStep6Data;
  };
}

