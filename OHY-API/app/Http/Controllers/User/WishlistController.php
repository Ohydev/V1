<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\WishlistModel;
use App\Models\EventModel;

class WishlistController extends Controller
{
    /**
     * Add to wishlist - allows End Users to add events to their wishlist
     * 
     * This method handles adding events to wishlist with validation for event existence,
     * published status, and preventing duplicate entries.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function addToWishlist(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'event_id' => 'required|integer|min:1', // Event ID is required, must be integer, minimum 1
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize models to perform database operations
                $eventModel = new EventModel();
                $wishlistModel = new WishlistModel();
                
                // Prepare query condition to find event by event_id
                $eventQueryCondition = array('event_id' => $data['event_id']);
                
                // Get event record from database
                $event = $eventModel->get_event($eventQueryCondition);
                
                // Check if event exists
                if (!$event) {
                    // Event not found, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Event not found'
                        )
                    ], 404);
                }
                
                // Check if event is published (is_published = true, is_draft = false)
                if (!$event->is_published || $event->is_draft) {
                    // Event is not published, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Event is not published'
                        )
                    );
                    
                    // Return JSON encoded error response
                    return json_encode($result);
                }
                
                // Prepare query condition to check if wishlist item already exists for this user and event
                $wishlistQueryCondition = array(
                    'user_id' => $user->user_id, // Current authenticated user's ID
                    'event_id' => $data['event_id'], // Event ID being added
                );
                
                // Check if wishlist item already exists
                $existingWishlistItem = $wishlistModel->get_wishlist($wishlistQueryCondition);
                
                // Check if wishlist item already exists
                if ($existingWishlistItem) {
                    // Event already in wishlist, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Event is already in your wishlist'
                        )
                    );
                    
                    // Return JSON encoded error response
                    return json_encode($result);
                }
                
                // Begin database transaction to ensure data consistency
                DB::beginTransaction();
                
                try {
                    // Create new wishlist item
                    $wishlistData = array(
                        'user_id' => $user->user_id, // Current authenticated user's ID
                        'event_id' => $data['event_id'], // Event ID being added
                    );
                    
                    // Create new wishlist item
                    $wishlistItem = $wishlistModel->create_wishlist($wishlistData);
                    
                    // Load event relationship for response
                    $wishlistItem->load('event');
                    
                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }
                
                // Prepare event details for response
                $eventDetails = array(
                    'event_id' => $event->event_id, // Event ID
                    'event_title' => $event->event_title, // Event title
                );
                
                // Prepare wishlist item data for response
                $wishlistItemData = array(
                    'wishlist_id' => $wishlistItem->wishlist_id, // Wishlist item ID
                    'event_id' => $wishlistItem->event_id, // Event ID
                    'event_details' => $eventDetails, // Event details
                );
                
                // Return success response with wishlist item data
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Event added to wishlist successfully',
                        'wishlist_item' => $wishlistItemData, // Wishlist item information
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in WishlistController::addToWishlist');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request'
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
     * Get wishlist items - retrieves all events in End User's wishlist
     * 
     * This method retrieves all wishlist items for the authenticated user with complete
     * event details, including event thumbnail, venue information, category, and price range.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getWishlistItems(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        try {
            // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
            $user = $request->user();
            
            // Prepare query condition to get all wishlist items for authenticated user
            $wishlistQueryCondition = array('user_id' => $user->user_id);
            
            // Get all wishlist items for user with eager loading of relationships
            // Eager load: event, event.eventCategory, event.venue, event.media, event.tickets
            $wishlistItems = WishlistModel::with([
                'event.eventCategory', // Load event with its category
                'event.venue', // Load event's venue
                'event.media' => function($query) {
                    // Filter media to get only thumbnail (first one found)
                    $query->where('media_type', 'thumbnail')->limit(1);
                },
                'event.tickets.ticketCategory', // Load event's tickets with their categories
            ])->where($wishlistQueryCondition)->get();
            
            // Initialize array to store formatted wishlist items
            $formattedWishlistItems = array();
            
            // Loop through each wishlist item to format data
            foreach ($wishlistItems as $wishlistItem) {
                // Get event from wishlist item
                $event = $wishlistItem->event;
                
                // Skip if event is missing (data integrity issue)
                if (!$event) {
                    continue; // Skip this wishlist item
                }
                
                // Get thumbnail from event media (first thumbnail found)
                $thumbnail = null;
                if ($event->media && $event->media->count() > 0) {
                    // Get first thumbnail media file path
                    $thumbnailMedia = $event->media->first();
                    $thumbnail = $thumbnailMedia->file_path ?? null;
                }
                
                // Get venue from event
                $venue = $event->venue;
                
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
                
                // Prepare venue data for response
                $venueData = null;
                if ($venue) {
                    // Format venue information
                    $venueData = array(
                        'venue_name' => $venue->venue_name, // Venue name
                        'city' => $venue->city, // City name
                        'state_province' => $venue->state_province, // State or Province
                    );
                }
                
                // Prepare category data for response
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
                
                // Prepare event data for response
                $eventData = array(
                    'event_id' => $event->event_id, // Event ID
                    'event_title' => $event->event_title, // Event name/title
                    'start_date' => $startDateFormatted, // Event start date formatted as d-m-Y
                    'end_date' => $endDateFormatted, // Event end date formatted as d-m-Y
                    'start_time' => $startTimeFormatted, // Event start time formatted as H:i
                    'end_time' => $endTimeFormatted, // Event end time formatted as H:i
                    'thumbnail' => $thumbnail, // Event thumbnail image path (if available)
                    'venue' => $venueData, // Venue information
                    'category' => $categoryData, // Category information
                    'price_range' => $priceRange, // Price range information
                );
                
                // Prepare wishlist item data for response
                $wishlistItemData = array(
                    'wishlist_id' => $wishlistItem->wishlist_id, // Wishlist item ID
                    'event_id' => $wishlistItem->event_id, // Event ID
                    'event' => $eventData, // Event details
                );
                
                // Add formatted wishlist item to array
                $formattedWishlistItems[] = $wishlistItemData;
            }
            
            // Return success response with wishlist items
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Wishlist items retrieved successfully',
                    'wishlist_items' => $formattedWishlistItems, // Array of formatted wishlist items
                )
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in WishlistController::getWishlistItems');
            Log::info($e->getMessage());
            Log::info($e);
            
            // Return error response to the client
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while processing your request'
                )
            );
        }
        
        // Return JSON encoded response to the client
        return response()->json($result);
    }
    
    /**
     * Remove from wishlist - allows End Users to remove events from their wishlist
     * 
     * This method handles removing events from wishlist by event_id.
     * Validates that the wishlist item exists and belongs to the authenticated user.
     * Protected route - requires authentication.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function removeFromWishlist(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'event_id' => 'required|integer|min:1', // Event ID is required, must be integer, minimum 1
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();
                
                // Initialize WishlistModel to perform database operations
                $wishlistModel = new WishlistModel();
                
                // Prepare query condition to find wishlist item by event_id and user_id
                $wishlistQueryCondition = array(
                    'event_id' => $data['event_id'], // Event ID to remove
                    'user_id' => $user->user_id, // Current authenticated user's ID (security: ensure wishlist item belongs to user)
                );
                
                // Get wishlist item from database
                $wishlistItem = $wishlistModel->get_wishlist($wishlistQueryCondition);
                
                // Check if wishlist item exists and belongs to authenticated user
                if (!$wishlistItem) {
                    // Wishlist item not found or doesn't belong to user, return 404 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E404',
                            'error_message' => 'Event not found in your wishlist'
                        )
                    ], 404);
                }
                
                // Begin database transaction to ensure data consistency
                DB::beginTransaction();
                
                try {
                    // Delete wishlist item using delete_wishlist method
                    $wishlistModel->delete_wishlist($wishlistQueryCondition);
                    
                    // Commit transaction if operation succeeds
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }
                
                // Return success response indicating item removed
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Event removed from wishlist successfully'
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in WishlistController::removeFromWishlist');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request'
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

