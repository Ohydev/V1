<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\EventModel;

class UserEventController extends Controller
{
    /**
     * Get public events list - allows public users to browse published events
     * 
     * This method retrieves published events with optional search, filtering, and pagination.
     * No authentication required - this is a public endpoint.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getPublicEventsList(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request (query parameters)
        $data = $request->all();
        
        // Define validation rules for optional query parameters
        $rules = array(
            'search' => 'nullable|string|max:255', // Search term for title/description (optional)
            'category_id' => 'nullable|integer|exists:event_categories,event_category_id', // Category filter (optional)
            'location' => 'nullable|string|max:255', // Location filter (optional)
            'start_date' => 'nullable|date', // Start date filter (optional)
            'end_date' => 'nullable|date', // End date filter (optional)
            'is_featured' => 'nullable|boolean', // Featured filter (optional)
            'page' => 'nullable|integer|min:1', // Page number for pagination (optional, minimum 1)
        );
        
        // Add conditional validation for end_date if start_date is provided
        if (!empty($data['start_date']) && !empty($data['end_date'])) {
            // If both dates are provided, end_date must be after or equal to start_date
            $rules['end_date'] = 'nullable|date|after_or_equal:start_date';
        }
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize EventModel to perform database operations
                $eventModel = new EventModel();
                
                // Prepare query parameters array for model method
                $queryParams = array(
                    'search' => isset($data['search']) ? $data['search'] : null, // Search term (optional)
                    'category_id' => isset($data['category_id']) ? $data['category_id'] : null, // Category filter (optional)
                    'location' => isset($data['location']) ? $data['location'] : null, // Location filter (optional)
                    'start_date' => isset($data['start_date']) ? $data['start_date'] : null, // Start date filter (optional)
                    'end_date' => isset($data['end_date']) ? $data['end_date'] : null, // End date filter (optional)
                    'is_featured' => isset($data['is_featured']) ? (bool)$data['is_featured'] : null, // Featured filter (optional)
                    'page' => isset($data['page']) ? (int)$data['page'] : 1, // Page number (default: 1)
                );
                
                // Get paginated events list from model
                $eventsData = $eventModel->get_public_events_list($queryParams);
                
                // Format events data for response
                $formattedEvents = array();
                
                // Loop through each event to format the response
                foreach ($eventsData['events'] as $event) {
                    // Get thumbnail media (first thumbnail for this event)
                    $thumbnail = null;
                    // Find thumbnail from media collection
                    if ($event->media && $event->media->count() > 0) {
                        // Get first media item with type 'thumbnail'
                        $thumbnailMedia = $event->media->where('media_type', 'thumbnail')->first();
                        if ($thumbnailMedia) {
                            // Format thumbnail data
                            $thumbnail = array(
                                'file_path' => $thumbnailMedia->file_path, // Thumbnail file path
                            );
                        }
                    }
                    
                    // Get price range from tickets
                    $priceRange = array(
                        'min' => null, // Minimum price
                        'max' => null, // Maximum price
                        'display' => null, // Formatted price display string
                    );
                    
                    // Check if event has tickets
                    if ($event->tickets && $event->tickets->count() > 0) {
                        // Get all ticket prices
                        $prices = $event->tickets->pluck('price')->toArray();
                        
                        // Filter out null values and ensure we have valid prices
                        $validPrices = array_filter($prices, function($price) {
                            return $price !== null && is_numeric($price);
                        });
                        
                        // Check if we have valid prices
                        if (count($validPrices) > 0) {
                            // Calculate min and max prices
                            $priceRange['min'] = min($validPrices);
                            $priceRange['max'] = max($validPrices);
                            
                            // Format price display string
                            if ($priceRange['min'] == $priceRange['max']) {
                                // Single price format: "$X.00"
                                $priceRange['display'] = '$' . number_format((float)$priceRange['min'], 2, '.', '');
                            } else {
                                // Price range format: "$X - $Y"
                                $priceRange['display'] = '$' . number_format((float)$priceRange['min'], 2, '.', '') . ' - $' . number_format((float)$priceRange['max'], 2, '.', '');
                            }
                        }
                    }
                    
                    // Format venue data (if exists)
                    $venueData = null;
                    if ($event->venue) {
                        // Format venue information
                        $venueData = array(
                            'venue_name' => $event->venue->venue_name, // Venue name
                            'city' => $event->venue->city, // City name
                            'state_province' => $event->venue->state_province, // State or province
                        );
                    }
                    
                    // Format category data (if exists)
                    $categoryData = null;
                    if ($event->eventCategory) {
                        // Format category information
                        $categoryData = array(
                            'event_category_id' => $event->eventCategory->event_category_id, // Category ID
                            'category_name' => $event->eventCategory->category_name, // Category name
                        );
                    }
                    
                    // Format dates as d-m-Y (e.g., "15-12-2025") - day-month-year format
                    // Handle both Carbon instances and string dates
                    $startDateFormatted = !empty($event->start_date) ? 
                        (is_object($event->start_date) ? $event->start_date->format('d-m-Y') : date('d-m-Y', strtotime($event->start_date))) : null;
                    $endDateFormatted = !empty($event->end_date) ? 
                        (is_object($event->end_date) ? $event->end_date->format('d-m-Y') : date('d-m-Y', strtotime($event->end_date))) : null;
                    
                    // Format times as H:i (e.g., "09:00") - hours and minutes only
                    // Handle both Carbon instances and string times
                    $startTimeFormatted = !empty($event->start_time) ? 
                        (is_object($event->start_time) ? $event->start_time->format('H:i') : date('H:i', strtotime($event->start_time))) : null;
                    $endTimeFormatted = !empty($event->end_time) ? 
                        (is_object($event->end_time) ? $event->end_time->format('H:i') : date('H:i', strtotime($event->end_time))) : null;
                    
                    // Build formatted event array
                    $formattedEvent = array(
                        'event_id' => $event->event_id, // Event ID
                        'event_title' => $event->event_title, // Event title
                        'description' => $event->description, // Event description
                        'start_date' => $startDateFormatted, // Event start date formatted as d-m-Y
                        'end_date' => $endDateFormatted, // Event end date formatted as d-m-Y
                        'start_time' => $startTimeFormatted, // Event start time formatted as H:i
                        'end_time' => $endTimeFormatted, // Event end time formatted as H:i
                        'category' => $categoryData, // Category information
                        'venue' => $venueData, // Venue information
                        'thumbnail' => $thumbnail, // Thumbnail image
                        'price_range' => $priceRange, // Price range information
                    );
                    
                    // Add formatted event to array
                    $formattedEvents[] = $formattedEvent;
                }
                
                // Prepare pagination data
                $pagination = array(
                    'total_records' => $eventsData['total_records'], // Total number of records
                    'current_page' => $eventsData['current_page'], // Current page number
                    'total_pages' => $eventsData['total_pages'], // Total number of pages
                    'next_page' => $eventsData['current_page'] < $eventsData['total_pages'] ? $eventsData['current_page'] + 1 : null, // Next page number (null if last page)
                    'prev_page' => $eventsData['current_page'] > 1 ? $eventsData['current_page'] - 1 : null, // Previous page number (null if first page)
                );
                
                // Return success response with events list and pagination
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Events retrieved successfully',
                        'events' => $formattedEvents, // Formatted events array
                        'pagination' => $pagination, // Pagination information
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserEventController::getPublicEventsList');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving events'
                    )
                );
            }
        } else {
            // Validation failed, return validation errors
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );
        }
        
        // Return JSON encoded response to the client
        return response()->json($result);
    }
    
    /**
     * Get public event details - allows public users to view complete event information
     * 
     * This method retrieves complete detailed information about a specific published event.
     * No authentication required - this is a public endpoint.
     * Returns 404 error if event not found or not published.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getPublicEventDetails(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request (query parameters)
        $data = $request->all();
        
        // Define validation rules for required query parameter
        $rules = array(
            'event_id' => 'required|integer|min:1', // Event ID is required, must be integer, minimum 1
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize EventModel to perform database operations
                $eventModel = new EventModel();
                
                // Get event ID from request data
                $eventId = (int)$data['event_id'];
                
                // Get event details with all relationships from model
                $event = $eventModel->get_public_event_details($eventId);
                
                // Check if event exists and is published
                if (!$event) {
                    // Event not found or not published, return 404 error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Event not found'
                        )
                    );
                    
                    // Return JSON encoded error response with 404 status code
                    return response()->json($result, 404);
                }
                
                // Format category data (if exists)
                $categoryData = null;
                if ($event->eventCategory) {
                    // Format category information
                    $categoryData = array(
                        'event_category_id' => $event->eventCategory->event_category_id, // Category ID
                        'category_name' => $event->eventCategory->category_name, // Category name
                    );
                }
                
                // Format media data grouped by type
                $mediaData = array(
                    'thumbnail' => null, // Thumbnail media (single)
                    'banner' => null, // Banner media (single)
                    'flyers' => array(), // Flyer media (multiple)
                    'videos' => array(), // Video media (multiple)
                );
                
                // Loop through all media files and group by type
                if ($event->media && $event->media->count() > 0) {
                    foreach ($event->media as $media) {
                        // Format media item
                        $mediaItem = array(
                            'event_media_id' => $media->event_media_id, // Media ID
                            'file_path' => $media->file_path, // File path
                            'file_name' => $media->file_name, // Original filename
                            'file_size' => $media->file_size, // File size in bytes
                        );
                        
                        // Group media by type
                        if ($media->media_type == 'thumbnail') {
                            // Single thumbnail
                            $mediaData['thumbnail'] = $mediaItem;
                        } elseif ($media->media_type == 'banner') {
                            // Single banner
                            $mediaData['banner'] = $mediaItem;
                        } elseif ($media->media_type == 'flyer') {
                            // Multiple flyers (add to array)
                            $mediaData['flyers'][] = $mediaItem;
                        } elseif ($media->media_type == 'video') {
                            // Multiple videos (add to array with duration)
                            $mediaItem['video_duration'] = $media->video_duration; // Video duration
                            $mediaData['videos'][] = $mediaItem;
                        }
                    }
                }
                
                // Format artists data with social media links
                $artistsData = array();
                if ($event->artists && $event->artists->count() > 0) {
                    // Loop through each artist
                    foreach ($event->artists as $artist) {
                        // Format artist social media links
                        $socialMediaLinks = array();
                        if ($artist->socialMedia && $artist->socialMedia->count() > 0) {
                            // Loop through artist's social media links
                            foreach ($artist->socialMedia as $socialMedia) {
                                // Format social media link
                                $socialMediaLinks[] = array(
                                    'platform' => $socialMedia->platform, // Platform name
                                    'url' => $socialMedia->url, // Full URL
                                );
                            }
                        }
                        
                        // Format artist data
                        $artistsData[] = array(
                            'event_artist_id' => $artist->event_artist_id, // Artist ID
                            'artist_name' => $artist->artist_name, // Artist name
                            'artist_image' => $artist->artist_image, // Artist image path
                            'social_media' => $socialMediaLinks, // Social media links array
                        );
                    }
                }
                
                // Format terms and conditions data (if exists)
                $termsData = null;
                if ($event->termsConditions) {
                    // Format terms and conditions
                    $termsData = array(
                        'terms_content' => $event->termsConditions->terms_content, // Terms content (rich text)
                    );
                }
                
                // Format venue data with country information
                $venueData = null;
                if ($event->venue) {
                    // Format country data (if exists)
                    $countryData = null;
                    if ($event->venue->country) {
                        // Format country information
                        $countryData = array(
                            'country_id' => $event->venue->country->country_id, // Country ID
                            'name' => $event->venue->country->name, // Country name
                        );
                    }
                    
                    // Format venue information
                    $venueData = array(
                        'venue_name' => $event->venue->venue_name, // Venue name
                        'venue_address' => $event->venue->venue_address, // Full street address
                        'city' => $event->venue->city, // City name
                        'state_province' => $event->venue->state_province, // State or province
                        'postal_code' => $event->venue->postal_code, // ZIP/Postal code
                        'country' => $countryData, // Country information
                        'latitude' => (float)$event->venue->latitude, // Latitude coordinate
                        'longitude' => (float)$event->venue->longitude, // Longitude coordinate
                        'additional_details' => $event->venue->additional_details, // Additional venue details
                        'venue_image' => $event->venue->venue_image, // Venue image path
                    );
                }
                
                // Format event social media links
                $socialMediaData = array();
                if ($event->socialMedia && $event->socialMedia->count() > 0) {
                    // Loop through event's social media links
                    foreach ($event->socialMedia as $socialMedia) {
                        // Format social media link
                        $socialMediaData[] = array(
                            'platform' => $socialMedia->platform, // Platform name
                            'url' => $socialMedia->url, // Full URL
                        );
                    }
                }
                
                // Format tickets data with categories and availability
                $ticketsData = array();
                if ($event->tickets && $event->tickets->count() > 0) {
                    // Loop through each ticket
                    foreach ($event->tickets as $ticket) {
                        // Format ticket category data (if exists)
                        $ticketCategoryData = null;
                        if ($ticket->ticketCategory) {
                            // Format ticket category information
                            $ticketCategoryData = array(
                                'ticket_category_id' => $ticket->ticketCategory->ticket_category_id, // Category ID
                                'category_name' => $ticket->ticketCategory->category_name, // Category name
                            );
                        }
                        
                        // Calculate available quantity
                        $availableQuantity = $ticket->total_available - $ticket->sold_quantity;
                        
                        // Format ticket data
                        $ticketsData[] = array(
                            'ticket_id' => $ticket->ticket_id, // Ticket ID
                            'ticket_category' => $ticketCategoryData, // Ticket category information
                            'ticket_type' => $ticket->ticket_type, // Ticket type (single_entry, table_ticket, etc.)
                            'description' => $ticket->description, // Description/tag
                            'price' => (float)$ticket->price, // Ticket price
                            'total_available' => $ticket->total_available, // Total inventory
                            'sold_quantity' => $ticket->sold_quantity, // Number of tickets sold
                            'available_quantity' => $availableQuantity, // Available quantity (calculated)
                            'ticket_info' => $ticket->ticket_info, // Rich text description of what's included
                            'max_per_user' => $ticket->max_per_user, // Maximum tickets per user
                        );
                    }
                }
                
                // Format dates as d-m-Y (e.g., "15-12-2025") - day-month-year format
                // Handle both Carbon instances and string dates
                $startDateFormatted = !empty($event->start_date) ? 
                    (is_object($event->start_date) ? $event->start_date->format('d-m-Y') : date('d-m-Y', strtotime($event->start_date))) : null;
                $endDateFormatted = !empty($event->end_date) ? 
                    (is_object($event->end_date) ? $event->end_date->format('d-m-Y') : date('d-m-Y', strtotime($event->end_date))) : null;
                
                // Format times as H:i (e.g., "09:00") - hours and minutes only
                // Handle both Carbon instances and string times
                $startTimeFormatted = !empty($event->start_time) ? 
                    (is_object($event->start_time) ? $event->start_time->format('H:i') : date('H:i', strtotime($event->start_time))) : null;
                $endTimeFormatted = !empty($event->end_time) ? 
                    (is_object($event->end_time) ? $event->end_time->format('H:i') : date('H:i', strtotime($event->end_time))) : null;
                
                // Build complete formatted event array
                $formattedEvent = array(
                    'event_id' => $event->event_id, // Event ID
                    'host_user_id' => $event->host_user_id, // Host user ID (event creator/owner)
                    'event_title' => $event->event_title, // Event title
                    'description' => $event->description, // Event description (rich text)
                    'key_highlights' => $event->key_highlights, // Key highlights (rich text)
                    'start_date' => $startDateFormatted, // Event start date formatted as d-m-Y
                    'end_date' => $endDateFormatted, // Event end date formatted as d-m-Y
                    'start_time' => $startTimeFormatted, // Event start time formatted as H:i
                    'end_time' => $endTimeFormatted, // Event end time formatted as H:i
                    'category' => $categoryData, // Category information
                    'media' => $mediaData, // Media files grouped by type
                    'artists' => $artistsData, // Artists with social media links
                    'terms_conditions' => $termsData, // Terms and conditions
                    'venue' => $venueData, // Venue information with country
                    'social_media' => $socialMediaData, // Event social media links
                    'tickets' => $ticketsData, // Tickets with categories and availability
                );
                
                // Return success response with complete event details
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Event details retrieved successfully',
                        'event' => $formattedEvent, // Complete formatted event data
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserEventController::getPublicEventDetails');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving event details'
                    )
                );
            }
        } else {
            // Validation failed, return validation errors
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );
        }
        
        // Return JSON encoded response to the client
        return response()->json($result);
    }
}

