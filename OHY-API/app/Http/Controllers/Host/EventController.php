<?php

namespace App\Http\Controllers\Host;

use App\Http\Controllers\Controller;
use App\Models\ArtistSocialMediaModel;
use App\Models\CountryModel;
use App\Models\CouponModel;
use App\Models\EventArtistModel;
use App\Models\EventCategoryModel;
use App\Models\EventMediaModel;
use App\Models\EventModel;
use App\Models\EventSocialMediaModel;
use App\Models\EventTermsConditionModel;
use App\Models\OrderModel;
use App\Models\TicketCategoryModel;
use App\Models\TicketModel;
use App\Models\UserModel;
use App\Models\VenueModel;
use App\Services\StripeService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    /**
     * Get Event Creation Master Data
     *
     * Retrieves all master data required for the 7-step event creation wizard including
     * event categories, countries, ticket types, social media platforms, and discount types.
     * This allows the frontend to make one API call to prefill all dropdowns and form fields.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getEventCreationMasterData(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        try {
            // Initialize models to perform database operations
            $eventCategoryModel = new EventCategoryModel;
            $countryModel = new CountryModel;

            // Get Event Categories (Step 1)
            // Query event_categories table to get all available categories
            $eventCategoriesQueryCondition = []; // Empty array to get all categories
            $eventCategories = $eventCategoryModel->get_event_categories_list($eventCategoriesQueryCondition);

            // Format event categories array for response
            // Extract event_category_id and category_name for each category
            $eventCategoriesArray = [];
            foreach ($eventCategories as $category) {
                $eventCategoriesArray[] = [
                    'event_category_id' => $category->event_category_id, // Category ID
                    'category_name' => $category->category_name, // Category name
                ];
            }

            // Sort event categories alphabetically by category_name for better UX
            usort($eventCategoriesArray, function ($a, $b) {
                return strcmp($a['category_name'], $b['category_name']);
            });

            // Get Countries (Step 3)
            // Query countries table to get all active countries (is_deleted = 0)
            $countriesQueryCondition = [
                'is_deleted' => 0, // Only get active countries (not soft deleted)
            ];
            $countries = $countryModel->get_countries_list($countriesQueryCondition);

            // Format countries array for response
            // Extract country_id, name, nicename, iso, and flag_icon for each country
            $countriesArray = [];
            foreach ($countries as $country) {
                $countriesArray[] = [
                    'country_id' => $country->country_id, // Country ID
                    'name' => $country->name, // Common country name
                    'nicename' => $country->nicename, // User-friendly country name
                    'iso' => $country->iso, // Two-letter ISO code
                    'flag_icon' => $country->flag_icon, // Flag icon path/URL (if exists)
                ];
            }

            // Sort countries alphabetically by name for better UX
            usort($countriesArray, function ($a, $b) {
                return strcmp($a['name'], $b['name']);
            });

            // Get Ticket Types (Step 2) - ENUM values
            // These are hardcoded ENUM values from database schema
            // Values: 'single_entry', 'multiple_entry'
            // Convert snake_case to Title Case for labels
            $ticketTypesArray = [
                [
                    'value' => 'single_entry', // ENUM value
                    'label' => 'Single Entry', // Human-readable label
                ],
                [
                    'value' => 'multiple_entry', // ENUM value (updated from 'table_ticket')
                    'label' => 'Multiple Entry', // Human-readable label
                ],
            ];

            // Get Social Media Platforms (Step 1 - Event, Step 4 - Artists) - ENUM values
            // These are hardcoded ENUM values from database schema
            // All platforms: facebook, instagram, tiktok, linkedin, snapchat, twitter, youtube, spotify
            // Spotify is only for artists, not events
            $socialMediaPlatformsArray = [
                [
                    'value' => 'facebook', // ENUM value
                    'label' => 'Facebook', // Human-readable label
                ],
                [
                    'value' => 'instagram', // ENUM value
                    'label' => 'Instagram', // Human-readable label
                ],
                [
                    'value' => 'tiktok', // ENUM value
                    'label' => 'TikTok', // Human-readable label
                ],
                [
                    'value' => 'linkedin', // ENUM value
                    'label' => 'LinkedIn', // Human-readable label
                ],
                [
                    'value' => 'snapchat', // ENUM value
                    'label' => 'Snapchat', // Human-readable label
                ],
                [
                    'value' => 'twitter', // ENUM value
                    'label' => 'X (Twitter)', // Human-readable label (X is the new name)
                ],
                [
                    'value' => 'youtube', // ENUM value
                    'label' => 'YouTube', // Human-readable label
                ],
                [
                    'value' => 'spotify', // ENUM value (only for artists, not events)
                    'label' => 'Spotify', // Human-readable label
                ],
            ];

            // Get Event Social Media Platforms (Step 1) - All except Spotify
            // Events cannot have Spotify links, only artists can
            $eventSocialMediaPlatformsArray = array_filter($socialMediaPlatformsArray, function ($platform) {
                return $platform['value'] !== 'spotify'; // Exclude Spotify from event platforms
            });
            // Re-index array after filtering
            $eventSocialMediaPlatformsArray = array_values($eventSocialMediaPlatformsArray);

            // Get Discount Types (Step 6) - ENUM values
            // These are hardcoded ENUM values from database schema
            // Values: 'percentage', 'flat'
            // Convert snake_case to Title Case for labels
            $discountTypesArray = [
                [
                    'value' => 'percentage', // ENUM value
                    'label' => 'Percentage Discount', // Human-readable label
                ],
                [
                    'value' => 'flat', // ENUM value
                    'label' => 'Flat Discount', // Human-readable label
                ],
            ];

            // Combine all master data into structured response
            // Return success response with all master data organized by category
            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Master data retrieved successfully',
                    'event_categories' => $eventCategoriesArray, // Event categories for Step 1
                    'countries' => $countriesArray, // Countries for Step 3
                    'ticket_types' => $ticketTypesArray, // Ticket types for Step 2
                    'social_media_platforms' => $socialMediaPlatformsArray, // All platforms including Spotify (for artists in Step 4)
                    'event_social_media_platforms' => $eventSocialMediaPlatformsArray, // Platforms without Spotify (for events in Step 1)
                    'discount_types' => $discountTypesArray, // Discount types for Step 6
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in EventController::getEventCreationMasterData');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response to the client with 500 Internal Server Error status code
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving master data',
                ],
            ];

            // Return JSON response with 500 Internal Server Error status code
            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Save Event Step 1 (Event Details)
     *
     * Handles saving event basic information, media files (thumbnail, banner, flyer, video),
     * and social media links for Step 1 of the event creation wizard. Supports both creating
     * new events and updating existing draft events.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function saveEventStep1(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership
        $hostUserId = $authenticatedUser->host_user_id;

        // Check if event_id is provided to determine if this is an update or create operation
        $eventId = isset($data['event_id']) && ! empty($data['event_id']) ? (int) $data['event_id'] : null;
        $isUpdate = ! empty($eventId);

        // Define validation rules for the request fields
        // Base validation rules for event fields
        $rules = [
            'event_id' => 'nullable|integer|exists:events,event_id', // Optional, must exist if provided
            'event_title' => 'required|string|max:255', // Event title is required, max 255 characters
            'description' => 'required|string', // Description is required
            'event_category_id' => 'required|integer|exists:event_categories,event_category_id', // Category must exist
            'start_date' => 'required|date|after_or_equal:today', // Start date must be today or future
            'end_date' => 'required|date|after_or_equal:start_date', // End date must be after or equal to start date
            'start_time' => 'required|date_format:H:i:s', // Start time in HH:MM:SS format
            'end_time' => 'required|date_format:H:i:s', // End time in HH:MM:SS format
            'key_highlights' => 'nullable|string', // Key highlights is optional
        ];

        // Add file upload validation rules
        // Thumbnail: optional single image file
        $rules['event_thumbnail'] = 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120'; // Max 5MB

        // Banner: optional single image file
        $rules['event_banner'] = 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120'; // Max 5MB

        // Flyer: optional array of image files (multiple files allowed)
        $rules['event_flyer'] = 'nullable|array'; // Array of files
        $rules['event_flyer.*'] = 'image|mimes:jpeg,png,jpg,gif|max:5120'; // Each file max 5MB

        // Video: optional array of video files (multiple files allowed, max 50MB each)
        $rules['event_video'] = 'nullable|array'; // Array of files
        $rules['event_video.*'] = 'mimes:mp4,avi,mov,wmv,flv|max:51200'; // Each file max 50MB

        // Custom error messages for video validation to provide detailed error information
        $customMessages = [
            'event_video.*.mimes' => 'The video file must be one of the following types: mp4, avi, mov, wmv, or flv.',
            'event_video.*.max' => 'The video file size must not exceed 50MB (51200 KB).',
            'event_video.*.uploaded' => 'The video file failed to upload. This usually means the file is too large or the total request size exceeds PHP limits. Check PHP upload_max_filesize ('.ini_get('upload_max_filesize').') and post_max_size ('.ini_get('post_max_size').') limits.',
        ];

        // Add social media URL validation rules (all optional)
        $rules['facebook_url'] = 'nullable|url|max:500'; // Facebook URL optional, must be valid URL
        $rules['instagram_url'] = 'nullable|url|max:500'; // Instagram URL optional, must be valid URL
        $rules['tiktok_url'] = 'nullable|url|max:500'; // TikTok URL optional, must be valid URL
        $rules['linkedin_url'] = 'nullable|url|max:500'; // LinkedIn URL optional, must be valid URL
        $rules['snapchat_url'] = 'nullable|url|max:500'; // Snapchat URL optional, must be valid URL
        $rules['twitter_url'] = 'nullable|url|max:500'; // Twitter URL optional, must be valid URL
        $rules['youtube_url'] = 'nullable|url|max:500'; // YouTube URL optional, must be valid URL

        // Check for file upload errors before validation (for better error reporting)
        // This helps identify PHP upload limit issues and other upload errors
        if ($request->hasFile('event_video')) {
            $videoFiles = $request->file('event_video');
            foreach ($videoFiles as $index => $videoFile) {
                // Check if file upload was successful
                if (! $videoFile->isValid()) {
                    // File upload failed, get specific error code
                    $uploadError = $videoFile->getError();
                    $uploadErrorMessage = $this->getUploadErrorMessage($uploadError);

                    // Return detailed error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E001',
                            'error_message' => [
                                'event_video.'.$index => [$uploadErrorMessage],
                            ],
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Additional diagnostics: Check file size and PHP limits
                // Get file size in bytes and convert to MB for comparison
                $fileSizeBytes = $videoFile->getSize(); // File size in bytes
                $fileSizeMB = round($fileSizeBytes / (1024 * 1024), 2); // Convert to MB

                // Get PHP configuration limits for comparison
                $uploadMaxFilesize = ini_get('upload_max_filesize'); // PHP upload_max_filesize
                $postMaxSize = ini_get('post_max_size'); // PHP post_max_size
                $maxFileSizeKB = 51200; // Our validation limit (50MB in KB)
                $maxFileSizeMB = 50; // Our validation limit in MB

                // Log diagnostic information for debugging upload issues
                Log::info('Video Upload Diagnostics - File '.$index, [
                    'file_name' => $videoFile->getClientOriginalName(),
                    'file_size_bytes' => $fileSizeBytes,
                    'file_size_mb' => $fileSizeMB,
                    'upload_max_filesize' => $uploadMaxFilesize,
                    'post_max_size' => $postMaxSize,
                    'content_length' => $request->header('Content-Length'),
                    'is_valid' => $videoFile->isValid(),
                    'error_code' => $videoFile->getError(),
                ]);

                // Convert PHP ini values to bytes for comparison
                $uploadMaxBytes = $this->convertToBytes($uploadMaxFilesize);
                $postMaxBytes = $this->convertToBytes($postMaxSize);

                // Check if file exceeds PHP upload_max_filesize
                if ($fileSizeBytes > $uploadMaxBytes) {
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E001',
                            'error_message' => [
                                'event_video.'.$index => [
                                    'The video file ('.$fileSizeMB.'MB) exceeds PHP upload_max_filesize limit ('.$uploadMaxFilesize.'). Please reduce file size or contact administrator to increase PHP limits.',
                                ],
                            ],
                        ],
                    ];

                    return response()->json($result, 400);
                }

                // Check if file exceeds our validation limit (50MB)
                if ($fileSizeBytes > ($maxFileSizeKB * 1024)) {
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E001',
                            'error_message' => [
                                'event_video.'.$index => [
                                    'The video file ('.$fileSizeMB.'MB) exceeds the maximum allowed size of '.$maxFileSizeMB.'MB. Please reduce file size.',
                                ],
                            ],
                        ],
                    ];

                    return response()->json($result, 400);
                }

                // Check total request size (all files combined) against post_max_size
                // This is important when uploading multiple files
                $totalRequestSize = $request->header('Content-Length') ? (int) $request->header('Content-Length') : 0;
                if ($totalRequestSize > $postMaxBytes) {
                    $totalRequestSizeMB = round($totalRequestSize / (1024 * 1024), 2);
                    $postMaxSizeMB = round($postMaxBytes / (1024 * 1024), 2);
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E001',
                            'error_message' => [
                                'event_video.'.$index => [
                                    'The total request size ('.$totalRequestSizeMB.'MB) exceeds PHP post_max_size limit ('.$postMaxSize.' / '.$postMaxSizeMB.'MB). This happens when uploading multiple files. Please upload files one at a time or contact administrator to increase PHP limits.',
                                ],
                            ],
                        ],
                    ];

                    return response()->json($result, 400);
                }
            }
        }

        // Perform validation using Laravel Validator with custom error messages
        $validation = Validator::make($data, $rules, $customMessages);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $eventMediaModel = new EventMediaModel;
                $eventSocialMediaModel = new EventSocialMediaModel;

                // Begin database transaction to ensure data consistency
                // All operations must succeed together or all will be rolled back
                DB::beginTransaction();

                try {
                    // Check if this is an update operation (event_id provided)
                    if ($isUpdate) {
                        // Verify event exists and belongs to authenticated host user
                        $queryCondition = [
                            'event_id' => $eventId, // Event ID to find
                            'host_user_id' => $hostUserId, // Must belong to authenticated user
                        ];
                        $existingEvent = $eventModel->get_event($queryCondition);

                        // Check if event exists and belongs to user
                        if (empty($existingEvent) || $existingEvent == null) {
                            // Event not found or doesn't belong to user, return error
                            DB::rollBack(); // Rollback transaction

                            $result = [
                                'success' => false,
                                'error' => [
                                    'error_code' => 'E404',
                                    'error_message' => 'Event not found or you do not have permission to update it',
                                ],
                            ];

                            // Return JSON response with 404 Not Found status code
                            return response()->json($result, 404);
                        }

                        // Verify event is draft (not published)
                        // Only draft events can be updated through this API
                        if ($existingEvent->is_published == true || $existingEvent->is_draft == false) {
                            // Event is published or not a draft, cannot update through this API
                            DB::rollBack(); // Rollback transaction

                            $result = [
                                'success' => false,
                                'error' => [
                                    'error_code' => 'E004',
                                    'error_message' => 'Only draft events can be updated through this API',
                                ],
                            ];

                            // Return JSON response with 400 Bad Request status code
                            return response()->json($result, 400);
                        }
                    }

                    // Prepare event data array with required fields
                    $eventData = [
                        'host_user_id' => $hostUserId, // Set host user ID from authenticated user
                        'event_title' => $data['event_title'], // Event title
                        'description' => $data['description'], // Rich text description
                        'event_category_id' => $data['event_category_id'], // Event category ID
                        'start_date' => $data['start_date'], // Start date
                        'end_date' => $data['end_date'], // End date
                        'start_time' => $data['start_time'], // Start time
                        'end_time' => $data['end_time'], // End time
                        'is_draft' => true, // Always set as draft in Step 1
                        'is_published' => false, // Not published yet
                    ];

                    // Add key_highlights if provided (optional field)
                    if (isset($data['key_highlights']) && ! empty($data['key_highlights'])) {
                        $eventData['key_highlights'] = $data['key_highlights']; // Rich text highlights
                    } else {
                        $eventData['key_highlights'] = null; // Set to null if not provided
                    }

                    // Create or update event record
                    if ($isUpdate) {
                        // Update existing event record
                        $queryCondition = ['event_id' => $eventId]; // Find by event ID
                        $updateResult = $eventModel->update_event_data($queryCondition, $eventData);

                        // Get updated event record for response
                        $event = $eventModel->get_event(['event_id' => $eventId]);
                    } else {
                        // Create new event record
                        $event = $eventModel->create_event($eventData);
                        $eventId = $event->event_id; // Get created event ID for media processing
                    }

                    // Process media files if provided
                    // Thumbnail: single file, replace if exists
                    if ($request->hasFile('event_thumbnail')) {
                        // Get uploaded thumbnail file
                        $thumbnailFile = $request->file('event_thumbnail');

                        // Delete old thumbnail if updating existing event
                        if ($isUpdate) {
                            // Find existing thumbnail record
                            $oldThumbnailQuery = [
                                'event_id' => $eventId,
                                'media_type' => 'thumbnail', // Thumbnail type
                            ];
                            $oldThumbnail = $eventMediaModel->get_event_media_list($oldThumbnailQuery);

                            // Delete old thumbnail files from storage
                            foreach ($oldThumbnail as $oldFile) {
                                // Delete file from storage if exists
                                if (! empty($oldFile->file_path) && Storage::disk('public')->exists($oldFile->file_path)) {
                                    Storage::disk('public')->delete($oldFile->file_path); // Delete old file
                                }
                            }

                            // Delete old thumbnail records from database
                            $eventMediaModel->delete_event_media($oldThumbnailQuery);
                        }

                        // Generate unique filename with timestamp
                        $thumbnailExtension = $thumbnailFile->getClientOriginalExtension(); // Get file extension
                        $thumbnailFileName = 'thumbnail_'.time().'_'.uniqid().'.'.$thumbnailExtension; // Unique filename
                        $thumbnailPath = 'events/'.$eventId.'/thumbnail/'.$thumbnailFileName; // Storage path

                        // Store thumbnail file in storage/public directory
                        $thumbnailStoredPath = $thumbnailFile->storeAs('events/'.$eventId.'/thumbnail', $thumbnailFileName, 'public');

                        // Create thumbnail record in database
                        $thumbnailData = [
                            'event_id' => $eventId, // Link to event
                            'media_type' => 'thumbnail', // Media type
                            'file_path' => $thumbnailStoredPath, // Storage path
                            'file_name' => $thumbnailFile->getClientOriginalName(), // Original filename
                            'file_size' => $thumbnailFile->getSize(), // File size in bytes
                        ];
                        $eventMediaModel->create_event_media($thumbnailData);
                    }

                    // Banner: single file, replace if exists
                    if ($request->hasFile('event_banner')) {
                        // Get uploaded banner file
                        $bannerFile = $request->file('event_banner');

                        // Delete old banner if updating existing event
                        if ($isUpdate) {
                            // Find existing banner record
                            $oldBannerQuery = [
                                'event_id' => $eventId,
                                'media_type' => 'banner', // Banner type
                            ];
                            $oldBanner = $eventMediaModel->get_event_media_list($oldBannerQuery);

                            // Delete old banner files from storage
                            foreach ($oldBanner as $oldFile) {
                                // Delete file from storage if exists
                                if (! empty($oldFile->file_path) && Storage::disk('public')->exists($oldFile->file_path)) {
                                    Storage::disk('public')->delete($oldFile->file_path); // Delete old file
                                }
                            }

                            // Delete old banner records from database
                            $eventMediaModel->delete_event_media($oldBannerQuery);
                        }

                        // Generate unique filename with timestamp
                        $bannerExtension = $bannerFile->getClientOriginalExtension(); // Get file extension
                        $bannerFileName = 'banner_'.time().'_'.uniqid().'.'.$bannerExtension; // Unique filename
                        $bannerPath = 'events/'.$eventId.'/banner/'.$bannerFileName; // Storage path

                        // Store banner file in storage/public directory
                        $bannerStoredPath = $bannerFile->storeAs('events/'.$eventId.'/banner', $bannerFileName, 'public');

                        // Create banner record in database
                        $bannerData = [
                            'event_id' => $eventId, // Link to event
                            'media_type' => 'banner', // Media type
                            'file_path' => $bannerStoredPath, // Storage path
                            'file_name' => $bannerFile->getClientOriginalName(), // Original filename
                            'file_size' => $bannerFile->getSize(), // File size in bytes
                        ];
                        $eventMediaModel->create_event_media($bannerData);
                    }

                    // Flyer: multiple files allowed, replace all if new files uploaded
                    if ($request->hasFile('event_flyer')) {
                        // Get uploaded flyer files (array)
                        $flyerFiles = $request->file('event_flyer');

                        // Delete old flyers if updating existing event
                        if ($isUpdate) {
                            // Find existing flyer records
                            $oldFlyerQuery = [
                                'event_id' => $eventId,
                                'media_type' => 'flyer', // Flyer type
                            ];
                            $oldFlyers = $eventMediaModel->get_event_media_list($oldFlyerQuery);

                            // Delete old flyer files from storage
                            foreach ($oldFlyers as $oldFile) {
                                // Delete file from storage if exists
                                if (! empty($oldFile->file_path) && Storage::disk('public')->exists($oldFile->file_path)) {
                                    Storage::disk('public')->delete($oldFile->file_path); // Delete old file
                                }
                            }

                            // Delete old flyer records from database
                            $eventMediaModel->delete_event_media($oldFlyerQuery);
                        }

                        // Process each flyer file
                        foreach ($flyerFiles as $index => $flyerFile) {
                            // Generate unique filename with timestamp and index
                            $flyerExtension = $flyerFile->getClientOriginalExtension(); // Get file extension
                            $flyerFileName = 'flyer_'.time().'_'.$index.'_'.uniqid().'.'.$flyerExtension; // Unique filename

                            // Store flyer file in storage/public directory
                            $flyerStoredPath = $flyerFile->storeAs('events/'.$eventId.'/flyer', $flyerFileName, 'public');

                            // Create flyer record in database
                            $flyerData = [
                                'event_id' => $eventId, // Link to event
                                'media_type' => 'flyer', // Media type
                                'file_path' => $flyerStoredPath, // Storage path
                                'file_name' => $flyerFile->getClientOriginalName(), // Original filename
                                'file_size' => $flyerFile->getSize(), // File size in bytes
                            ];
                            $eventMediaModel->create_event_media($flyerData);
                        }
                    }

                    // Video: multiple files allowed, replace all if new files uploaded
                    if ($request->hasFile('event_video')) {
                        // Get uploaded video files (array)
                        $videoFiles = $request->file('event_video');

                        // Delete old videos if updating existing event
                        if ($isUpdate) {
                            // Find existing video records
                            $oldVideoQuery = [
                                'event_id' => $eventId,
                                'media_type' => 'video', // Video type
                            ];
                            $oldVideos = $eventMediaModel->get_event_media_list($oldVideoQuery);

                            // Delete old video files from storage
                            foreach ($oldVideos as $oldFile) {
                                // Delete file from storage if exists
                                if (! empty($oldFile->file_path) && Storage::disk('public')->exists($oldFile->file_path)) {
                                    Storage::disk('public')->delete($oldFile->file_path); // Delete old file
                                }
                            }

                            // Delete old video records from database
                            $eventMediaModel->delete_event_media($oldVideoQuery);
                        }

                        // Process each video file
                        foreach ($videoFiles as $index => $videoFile) {
                            // Generate unique filename with timestamp and index
                            $videoExtension = $videoFile->getClientOriginalExtension(); // Get file extension
                            $videoFileName = 'video_'.time().'_'.$index.'_'.uniqid().'.'.$videoExtension; // Unique filename

                            // Store video file in storage/public directory
                            $videoStoredPath = $videoFile->storeAs('events/'.$eventId.'/video', $videoFileName, 'public');

                            // Create video record in database
                            // Note: video_duration extraction skipped for now (future enhancement)
                            $videoData = [
                                'event_id' => $eventId, // Link to event
                                'media_type' => 'video', // Media type
                                'file_path' => $videoStoredPath, // Storage path
                                'file_name' => $videoFile->getClientOriginalName(), // Original filename
                                'file_size' => $videoFile->getSize(), // File size in bytes
                                'video_duration' => null, // Duration extraction skipped for now
                            ];
                            $eventMediaModel->create_event_media($videoData);
                        }
                    }

                    // Process social media links
                    // Map request fields to platform ENUM values
                    $socialMediaPlatforms = [
                        'facebook_url' => 'facebook', // Facebook platform
                        'instagram_url' => 'instagram', // Instagram platform
                        'tiktok_url' => 'tiktok', // TikTok platform
                        'linkedin_url' => 'linkedin', // LinkedIn platform
                        'snapchat_url' => 'snapchat', // Snapchat platform
                        'twitter_url' => 'twitter', // Twitter platform
                        'youtube_url' => 'youtube', // YouTube platform
                    ];

                    // Process each social media platform
                    foreach ($socialMediaPlatforms as $requestField => $platformValue) {
                        // Check if URL is provided for this platform
                        $url = isset($data[$requestField]) && ! empty(trim($data[$requestField])) ? trim($data[$requestField]) : null;

                        // Find existing social media record for this platform
                        $socialMediaQuery = [
                            'event_id' => $eventId, // Event ID
                            'platform' => $platformValue, // Platform type
                        ];
                        $existingSocialMedia = $eventSocialMediaModel->get_event_social_media($socialMediaQuery);

                        if (! empty($url)) {
                            // URL provided: create or update record
                            $socialMediaData = [
                                'event_id' => $eventId, // Link to event
                                'platform' => $platformValue, // Platform type
                                'url' => $url, // Full URL
                            ];

                            if (! empty($existingSocialMedia)) {
                                // Update existing record
                                $eventSocialMediaModel->update_event_social_media_data($socialMediaQuery, ['url' => $url]);
                            } else {
                                // Create new record
                                $eventSocialMediaModel->create_event_social_media($socialMediaData);
                            }
                        } else {
                            // URL empty or not provided: delete record if exists
                            if (! empty($existingSocialMedia)) {
                                $eventSocialMediaModel->delete_event_social_media($socialMediaQuery);
                            }
                        }
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Format event data for response
                // Format dates as d-m-Y (e.g., "15-12-2025") instead of ISO format
                // Handle both Carbon instances and string dates
                $startDateFormatted = ! empty($event->start_date) ?
                    (is_object($event->start_date) ? $event->start_date->format('d-m-Y') : date('d-m-Y', strtotime($event->start_date))) : null;
                $endDateFormatted = ! empty($event->end_date) ?
                    (is_object($event->end_date) ? $event->end_date->format('d-m-Y') : date('d-m-Y', strtotime($event->end_date))) : null;

                // Format times as H:i (e.g., "09:00") - hours and minutes only
                // Handle both Carbon instances and string times
                $startTimeFormatted = ! empty($event->start_time) ?
                    (is_object($event->start_time) ? $event->start_time->format('H:i') : date('H:i', strtotime($event->start_time))) : null;
                $endTimeFormatted = ! empty($event->end_time) ?
                    (is_object($event->end_time) ? $event->end_time->format('H:i') : date('H:i', strtotime($event->end_time))) : null;

                $eventResponse = [
                    'event_id' => $event->event_id, // Event ID
                    'event_title' => $event->event_title, // Event title
                    'description' => $event->description, // Description
                    'event_category_id' => $event->event_category_id, // Category ID
                    'start_date' => $startDateFormatted, // Start date formatted as d-m-Y
                    'end_date' => $endDateFormatted, // End date formatted as d-m-Y
                    'start_time' => $startTimeFormatted, // Start time formatted as H:i (hours:minutes)
                    'end_time' => $endTimeFormatted, // End time formatted as H:i (hours:minutes)
                    'key_highlights' => $event->key_highlights, // Key highlights
                    'is_draft' => $event->is_draft, // Draft status
                    'is_published' => $event->is_published, // Published status
                    'is_new_event' => ! $isUpdate, // Flag indicating if this is a new event
                ];

                // Return success response with created/updated event data
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => $isUpdate ? 'Event Step 1 updated successfully' : 'Event Step 1 saved successfully',
                        'event' => $eventResponse, // Event data with is_new_event flag
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::saveEventStep1');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while saving event Step 1',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Create Ticket Category
     *
     * Creates a new ticket category for an event. Called when user clicks "+" icon
     * beside the Ticket Category dropdown in Step 2 of event creation wizard.
     * Categories are event-specific and not reusable across events.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function createTicketCategory(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
            'category_name' => 'required|string|max:255', // Category name is required, max 255 characters
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $ticketCategoryModel = new TicketCategoryModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to create categories for it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Verify event is draft (not published)
                // Only draft events can have ticket categories created
                if ($event->is_published == true || $event->is_draft == false) {
                    // Event is published or not a draft, cannot create categories
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Ticket categories can only be created for draft events',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Prepare ticket category data array
                $categoryData = [
                    'event_id' => $data['event_id'], // Link to event
                    'category_name' => $data['category_name'], // Category name
                ];

                // Create ticket category record in the database
                $ticketCategory = $ticketCategoryModel->create_ticket_category($categoryData);

                // Format ticket category data for response
                $categoryResponse = [
                    'ticket_category_id' => $ticketCategory->ticket_category_id, // Category ID
                    'event_id' => $ticketCategory->event_id, // Event ID
                    'category_name' => $ticketCategory->category_name, // Category name
                ];

                // Return success response with created category data
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Ticket category created successfully',
                        'ticket_category' => $categoryResponse, // Category data
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::createTicketCategory');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while creating ticket category',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Ticket Categories
     *
     * Retrieves all ticket categories for an event. Used to populate the dropdown
     * when creating tickets in Step 2 of event creation wizard.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getTicketCategories(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $ticketCategoryModel = new TicketCategoryModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to view its categories',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Retrieve all ticket categories for the event
                $categoriesQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $ticketCategories = $ticketCategoryModel->get_ticket_categories_list($categoriesQueryCondition);

                // Format ticket categories array for response
                $categoriesArray = [];
                foreach ($ticketCategories as $category) {
                    $categoriesArray[] = [
                        'ticket_category_id' => $category->ticket_category_id, // Category ID
                        'category_name' => $category->category_name, // Category name
                    ];
                }

                // Sort categories alphabetically by category_name for better UX
                usort($categoriesArray, function ($a, $b) {
                    return strcmp($a['category_name'], $b['category_name']);
                });

                // Return success response with ticket categories list
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Ticket categories retrieved successfully',
                        'ticket_categories' => $categoriesArray, // Sorted categories list
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::getTicketCategories');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving ticket categories',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Save Event Step 2 (Ticketing)
     *
     * Saves all tickets for Step 2 of event creation wizard. This API uses a "replace all"
     * approach: it deletes all existing tickets for the event and creates new ones from
     * the provided tickets array. This simplifies frontend logic by sending the final
     * desired state of all tickets.
     *
     * If any tickets have been sold (sold_quantity > 0), the API will return an error
     * preventing replacement to maintain data integrity.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function saveEventStep2(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
            'tickets' => 'required|array|min:0', // Tickets array is required, can be empty
        ];

        // Add validation rules for each ticket in the array
        if (isset($data['tickets']) && is_array($data['tickets'])) {
            // Validate each ticket object in the tickets array
            foreach ($data['tickets'] as $index => $ticket) {
                $rules['tickets.'.$index.'.ticket_category_id'] = 'required|integer|exists:ticket_categories,ticket_category_id'; // Category must exist
                $rules['tickets.'.$index.'.ticket_type'] = 'required|in:single_entry,multiple_entry'; // Ticket type must be valid ENUM
                $rules['tickets.'.$index.'.price'] = 'required|numeric|min:0'; // Price must be numeric and non-negative
                $rules['tickets.'.$index.'.total_available'] = 'required|integer|min:1'; // Total available must be at least 1
                $rules['tickets.'.$index.'.max_per_user'] = 'required|integer|min:1'; // Max per user must be at least 1
                $rules['tickets.'.$index.'.description'] = 'nullable|string|max:255'; // Description is optional
                $rules['tickets.'.$index.'.ticket_info'] = 'nullable|string'; // Ticket info is optional
            }
        }

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $ticketModel = new TicketModel;
                $ticketCategoryModel = new TicketCategoryModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to update it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Verify event is draft (not published)
                // Only draft events can have tickets updated
                if ($event->is_published == true || $event->is_draft == false) {
                    // Event is published or not a draft, cannot update tickets
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Tickets can only be managed for draft events',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Verify all ticket_category_id values belong to the event
                if (isset($data['tickets']) && is_array($data['tickets']) && count($data['tickets']) > 0) {
                    // Get all unique category IDs from the tickets array
                    $categoryIds = array_unique(array_column($data['tickets'], 'ticket_category_id'));

                    // Verify each category belongs to the event
                    foreach ($categoryIds as $categoryId) {
                        $categoryQueryCondition = [
                            'ticket_category_id' => $categoryId, // Category ID to find
                            'event_id' => $data['event_id'], // Must belong to the event
                        ];
                        $category = $ticketCategoryModel->get_ticket_category($categoryQueryCondition);

                        // Check if category exists and belongs to event
                        if (empty($category) || $category == null) {
                            // Category not found or doesn't belong to event, return error
                            $result = [
                                'success' => false,
                                'error' => [
                                    'error_code' => 'E004',
                                    'error_message' => 'One or more ticket categories do not belong to this event',
                                ],
                            ];

                            // Return JSON response with 400 Bad Request status code
                            return response()->json($result, 400);
                        }
                    }
                }

                // Begin database transaction to ensure data consistency
                // All operations must succeed together or all will be rolled back
                DB::beginTransaction();

                try {
                    // Get all existing tickets for the event
                    $existingTicketsQueryCondition = [
                        'event_id' => $data['event_id'], // Filter by event ID
                    ];
                    $existingTickets = $ticketModel->get_tickets_list($existingTicketsQueryCondition);

                    // Check if any existing tickets have been sold (sold_quantity > 0)
                    $hasSoldTickets = false;
                    foreach ($existingTickets as $existingTicket) {
                        if ($existingTicket->sold_quantity > 0) {
                            $hasSoldTickets = true; // Found at least one ticket with sales
                            break; // Exit loop early
                        }
                    }

                    // If tickets have been sold, prevent replacement to maintain data integrity
                    if ($hasSoldTickets) {
                        // Tickets have been sold, cannot replace all tickets
                        DB::rollBack(); // Rollback transaction

                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E004',
                                'error_message' => 'Cannot modify tickets once they have been sold. Please contact support if you need to make changes.',
                            ],
                        ];

                        // Return JSON response with 400 Bad Request status code
                        return response()->json($result, 400);
                    }

                    // Delete all existing tickets for the event
                    // This is safe because we've verified no tickets have been sold
                    $deleteQueryCondition = [
                        'event_id' => $data['event_id'], // Delete all tickets for this event
                    ];
                    $ticketModel->delete_ticket($deleteQueryCondition);

                    // Create all new tickets from the tickets array
                    $createdTickets = [];
                    if (isset($data['tickets']) && is_array($data['tickets']) && count($data['tickets']) > 0) {
                        // Process each ticket in the array
                        foreach ($data['tickets'] as $ticketData) {
                            // Prepare ticket data array
                            $ticketRecordData = [
                                'event_id' => $data['event_id'], // Link to event
                                'ticket_category_id' => $ticketData['ticket_category_id'], // Link to category
                                'ticket_type' => $ticketData['ticket_type'], // Ticket type
                                'price' => $ticketData['price'], // Ticket price
                                'total_available' => $ticketData['total_available'], // Total inventory
                                'sold_quantity' => 0, // Initialize sold quantity to 0
                                'max_per_user' => $ticketData['max_per_user'], // Maximum per user
                            ];

                            // Add optional fields if provided
                            if (isset($ticketData['description']) && ! empty($ticketData['description'])) {
                                $ticketRecordData['description'] = $ticketData['description']; // Description/tag
                            } else {
                                $ticketRecordData['description'] = null; // Set to null if not provided
                            }

                            if (isset($ticketData['ticket_info']) && ! empty($ticketData['ticket_info'])) {
                                $ticketRecordData['ticket_info'] = $ticketData['ticket_info']; // Rich text info
                            } else {
                                $ticketRecordData['ticket_info'] = null; // Set to null if not provided
                            }

                            // Create ticket record in the database
                            $ticket = $ticketModel->create_ticket($ticketRecordData);

                            // Get category name for response
                            $categoryQueryCondition = [
                                'ticket_category_id' => $ticket->ticket_category_id, // Find category
                            ];
                            $category = $ticketCategoryModel->get_ticket_category($categoryQueryCondition);
                            $categoryName = ! empty($category) ? $category->category_name : null;

                            // Format ticket data for response
                            $ticketResponse = [
                                'ticket_id' => $ticket->ticket_id, // Ticket ID
                                'event_id' => $ticket->event_id, // Event ID
                                'ticket_category_id' => $ticket->ticket_category_id, // Category ID
                                'category_name' => $categoryName, // Category name
                                'ticket_type' => $ticket->ticket_type, // Ticket type
                                'description' => $ticket->description, // Description
                                'price' => (string) $ticket->price, // Price as string
                                'total_available' => $ticket->total_available, // Total available
                                'sold_quantity' => $ticket->sold_quantity, // Sold quantity
                                'available_quantity' => $ticket->total_available - $ticket->sold_quantity, // Calculated available
                                'ticket_info' => $ticket->ticket_info, // Ticket info
                                'max_per_user' => $ticket->max_per_user, // Max per user
                            ];

                            // Add ticket to created tickets array
                            $createdTickets[] = $ticketResponse;
                        }
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Return success response with all created tickets
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event Step 2 saved successfully',
                        'tickets' => $createdTickets, // All created tickets
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::saveEventStep2');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while saving event Step 2',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Tickets List
     *
     * Retrieves all tickets for an event with category information. Used to display
     * the list of created tickets in Step 2 of event creation wizard.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getTicketsList(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $ticketModel = new TicketModel;
                $ticketCategoryModel = new TicketCategoryModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to view its tickets',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Retrieve all tickets for the event
                $ticketsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $tickets = $ticketModel->get_tickets_list($ticketsQueryCondition);

                // Format tickets array for response with category information
                $ticketsArray = [];
                foreach ($tickets as $ticket) {
                    // Get category name for this ticket
                    $categoryQueryCondition = [
                        'ticket_category_id' => $ticket->ticket_category_id, // Find category
                    ];
                    $category = $ticketCategoryModel->get_ticket_category($categoryQueryCondition);
                    $categoryName = ! empty($category) ? $category->category_name : null;

                    // Calculate available quantity
                    $availableQuantity = $ticket->total_available - $ticket->sold_quantity;

                    // Format ticket data for response
                    $ticketsArray[] = [
                        'ticket_id' => $ticket->ticket_id, // Ticket ID
                        'event_id' => $ticket->event_id, // Event ID
                        'ticket_category_id' => $ticket->ticket_category_id, // Category ID
                        'category_name' => $categoryName, // Category name
                        'ticket_type' => $ticket->ticket_type, // Ticket type
                        'description' => $ticket->description, // Description
                        'price' => (string) $ticket->price, // Price as string
                        'total_available' => $ticket->total_available, // Total available
                        'sold_quantity' => $ticket->sold_quantity, // Sold quantity
                        'available_quantity' => $availableQuantity, // Calculated available quantity
                        'ticket_info' => $ticket->ticket_info, // Ticket info
                        'max_per_user' => $ticket->max_per_user, // Max per user
                    ];
                }

                // Sort tickets by ticket_id (creation order)
                usort($ticketsArray, function ($a, $b) {
                    return $a['ticket_id'] - $b['ticket_id'];
                });

                // Return success response with tickets list
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Tickets retrieved successfully',
                        'tickets' => $ticketsArray, // Sorted tickets list
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::getTicketsList');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving tickets',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Save Event Step 3 (Venue Details)
     *
     * Handles saving or updating venue details for an event. Creates venue record
     * if it doesn't exist, updates if it exists. Handles optional venue image upload
     * with file replacement logic. Only draft events can have venue updated.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function saveEventStep3(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
            'venue_name' => 'required|string|max:255', // Venue name is required, max 255 characters
            'venue_address' => 'required|string|max:255', // Venue address is required, max 255 characters
            'city' => 'required|string|max:255', // City is required, max 255 characters
            'state_province' => 'required|string|max:255', // State/Province is required, max 255 characters
            'postal_code' => 'required|string|max:20', // Postal code is required, max 20 characters
            'country_id' => 'required|integer|exists:countries,country_id', // Country ID must exist in countries table
            'latitude' => 'required|numeric|between:-90,90', // Latitude is required, must be between -90 and 90
            'longitude' => 'required|numeric|between:-180,180', // Longitude is required, must be between -180 and 180
            'maximum_attendees' => 'required|integer|min:1', // Maximum attendees is required, must be at least 1
            'additional_details' => 'nullable|string', // Additional details is optional
            'venue_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // Venue image is optional, max 5MB
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $venueModel = new VenueModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to update it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Verify event is draft (not published)
                // Only draft events can have venue updated
                if ($event->is_published == true || $event->is_draft == false) {
                    // Event is published or not a draft, cannot update venue
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Venue can only be managed for draft events',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Begin database transaction to ensure data consistency
                // All operations must succeed together or all will be rolled back
                DB::beginTransaction();

                try {
                    // Check if venue already exists for this event
                    $venueQueryCondition = [
                        'event_id' => $data['event_id'], // Find venue by event ID
                    ];
                    $existingVenue = $venueModel->get_venue($venueQueryCondition);
                    $isVenueUpdate = ! empty($existingVenue);

                    // Prepare venue data array with required fields
                    $venueData = [
                        'event_id' => $data['event_id'], // Link to event
                        'venue_name' => $data['venue_name'], // Venue name
                        'venue_address' => $data['venue_address'], // Full street address
                        'city' => $data['city'], // City name
                        'state_province' => $data['state_province'], // State or Province
                        'postal_code' => $data['postal_code'], // ZIP/Postal code
                        'country_id' => $data['country_id'], // Country ID
                        'latitude' => $data['latitude'], // Latitude coordinate
                        'longitude' => $data['longitude'], // Longitude coordinate
                        'maximum_attendees' => $data['maximum_attendees'], // Maximum attendees
                    ];

                    // Add additional_details if provided (optional field)
                    if (isset($data['additional_details']) && ! empty($data['additional_details'])) {
                        $venueData['additional_details'] = $data['additional_details']; // Additional details
                    } else {
                        $venueData['additional_details'] = null; // Set to null if not provided
                    }

                    // Handle venue image upload (optional)
                    if ($request->hasFile('venue_image')) {
                        // Get uploaded venue image file
                        $venueImageFile = $request->file('venue_image');

                        // Delete old venue image if updating existing venue
                        if ($isVenueUpdate && ! empty($existingVenue->venue_image)) {
                            // Delete old image file from storage if exists
                            if (Storage::disk('public')->exists($existingVenue->venue_image)) {
                                Storage::disk('public')->delete($existingVenue->venue_image); // Delete old file
                            }
                        }

                        // Generate unique filename with timestamp and uniqid
                        $venueImageExtension = $venueImageFile->getClientOriginalExtension(); // Get file extension
                        $venueImageFileName = 'venue_image_'.time().'_'.uniqid().'.'.$venueImageExtension; // Unique filename

                        // Store venue image file in storage/public directory
                        $venueImageStoredPath = $venueImageFile->storeAs('venues/'.$data['event_id'], $venueImageFileName, 'public');

                        // Add venue image path to venue data
                        $venueData['venue_image'] = $venueImageStoredPath; // Store file path
                    } else {
                        // No new image uploaded
                        if ($isVenueUpdate) {
                            // Keep existing venue image if updating
                            $venueData['venue_image'] = $existingVenue->venue_image; // Preserve existing image
                        } else {
                            // Set to null if creating new venue without image
                            $venueData['venue_image'] = null; // No image provided
                        }
                    }

                    // Create or update venue record
                    if ($isVenueUpdate) {
                        // Update existing venue record
                        $venueModel->update_venue_data($venueQueryCondition, $venueData);

                        // Get updated venue record for response
                        $venue = $venueModel->get_venue($venueQueryCondition);
                    } else {
                        // Create new venue record
                        $venue = $venueModel->create_venue($venueData);
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Format venue data for response
                // Format coordinates as strings to preserve decimal precision
                $venueResponse = [
                    'venue_id' => $venue->venue_id, // Venue ID
                    'event_id' => $venue->event_id, // Event ID
                    'venue_name' => $venue->venue_name, // Venue name
                    'venue_address' => $venue->venue_address, // Full street address
                    'city' => $venue->city, // City name
                    'state_province' => $venue->state_province, // State or Province
                    'postal_code' => $venue->postal_code, // ZIP/Postal code
                    'country_id' => $venue->country_id, // Country ID
                    'latitude' => (string) $venue->latitude, // Latitude as string (preserves decimal precision)
                    'longitude' => (string) $venue->longitude, // Longitude as string (preserves decimal precision)
                    'maximum_attendees' => $venue->maximum_attendees, // Maximum attendees
                    'additional_details' => $venue->additional_details, // Additional details
                    'venue_image' => $venue->venue_image, // Venue image path
                ];

                // Return success response with created/updated venue data
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event Step 3 saved successfully',
                        'venue' => $venueResponse, // Venue data
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::saveEventStep3');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while saving event Step 3',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Save Event Step 4 (Event Members/Artists)
     *
     * Saves all artists for Step 4 of event creation wizard. This API uses a "replace all"
     * approach: it deletes all existing artists (and their social media links) for the event
     * and creates new ones from the provided artists array. This simplifies frontend logic
     * by sending the final desired state of all artists.
     *
     * Handles optional artist image uploads and social media links. Only draft events
     * can have artists updated.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function saveEventStep4(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
            'artists' => 'required|array|min:0', // Artists array is required, can be empty
        ];

        // Add validation rules for each artist in the array
        if (isset($data['artists']) && is_array($data['artists'])) {
            // Validate each artist object in the artists array
            foreach ($data['artists'] as $index => $artist) {
                $rules['artists.'.$index.'.artist_name'] = 'required|string|max:255'; // Artist name is required, max 255 characters
                $rules['artists.'.$index.'.artist_image'] = 'nullable|image|mimes:jpeg,png,jpg,gif|max:3072'; // Artist image is optional, max 3MB
                $rules['artists.'.$index.'.social_media'] = 'nullable|array'; // Social media array is optional

                // Validate each social media link in the social_media array
                if (isset($artist['social_media']) && is_array($artist['social_media'])) {
                    foreach ($artist['social_media'] as $socialIndex => $socialMedia) {
                        $rules['artists.'.$index.'.social_media.'.$socialIndex.'.platform'] = 'required|in:facebook,instagram,tiktok,linkedin,snapchat,twitter,youtube,spotify'; // Platform must be valid ENUM
                        $rules['artists.'.$index.'.social_media.'.$socialIndex.'.url'] = 'required|url|max:500'; // URL must be valid URL format, max 500 characters
                    }
                }
            }
        }

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $eventArtistModel = new EventArtistModel;
                $artistSocialMediaModel = new ArtistSocialMediaModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to update it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Verify event is draft (not published)
                // Only draft events can have artists updated
                if ($event->is_published == true || $event->is_draft == false) {
                    // Event is published or not a draft, cannot update artists
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Artists can only be managed for draft events',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Begin database transaction to ensure data consistency
                // All operations must succeed together or all will be rolled back
                DB::beginTransaction();

                try {
                    // Get all existing artists for the event
                    $existingArtistsQueryCondition = [
                        'event_id' => $data['event_id'], // Filter by event ID
                    ];
                    $existingArtists = $eventArtistModel->get_event_artists_list($existingArtistsQueryCondition);

                    // Delete old artist images from storage before deleting records
                    foreach ($existingArtists as $existingArtist) {
                        // Check if artist has an image
                        if (! empty($existingArtist->artist_image)) {
                            // Delete old image file from storage if exists
                            if (Storage::disk('public')->exists($existingArtist->artist_image)) {
                                Storage::disk('public')->delete($existingArtist->artist_image); // Delete old file
                            }
                        }
                    }

                    // Delete all existing artists for the event
                    // Cascade delete will automatically delete social media links
                    $deleteQueryCondition = [
                        'event_id' => $data['event_id'], // Delete all artists for this event
                    ];
                    $eventArtistModel->delete_event_artist($deleteQueryCondition);

                    // Create all new artists from the artists array
                    $createdArtists = [];
                    if (isset($data['artists']) && is_array($data['artists']) && count($data['artists']) > 0) {
                        // Process each artist in the array
                        foreach ($data['artists'] as $index => $artistData) {
                            // Prepare artist data array
                            $artistRecordData = [
                                'event_id' => $data['event_id'], // Link to event
                                'artist_name' => $artistData['artist_name'], // Artist name
                            ];

                            // Handle artist image upload (optional)
                            if ($request->hasFile("artists.{$index}.artist_image")) {
                                // Get uploaded artist image file
                                $artistImageFile = $request->file("artists.{$index}.artist_image");

                                // Generate unique filename with timestamp and uniqid
                                $artistImageExtension = $artistImageFile->getClientOriginalExtension(); // Get file extension
                                $artistImageFileName = 'artist_image_'.time().'_'.uniqid().'.'.$artistImageExtension; // Unique filename

                                // Store artist image file in storage/public directory
                                $artistImageStoredPath = $artistImageFile->storeAs('artists/'.$data['event_id'], $artistImageFileName, 'public');

                                // Add artist image path to artist data
                                $artistRecordData['artist_image'] = $artistImageStoredPath; // Store file path
                            } else {
                                // No image provided, set to null
                                $artistRecordData['artist_image'] = null; // No image
                            }

                            // Create artist record in the database
                            $artist = $eventArtistModel->create_event_artist($artistRecordData);

                            // Create social media links for this artist (if provided)
                            $socialMediaArray = [];
                            if (isset($artistData['social_media']) && is_array($artistData['social_media']) && count($artistData['social_media']) > 0) {
                                // Process each social media link
                                foreach ($artistData['social_media'] as $socialMediaData) {
                                    // Prepare social media data array
                                    $socialMediaRecordData = [
                                        'event_artist_id' => $artist->event_artist_id, // Link to artist
                                        'platform' => $socialMediaData['platform'], // Platform name
                                        'url' => $socialMediaData['url'], // Full URL
                                    ];

                                    // Create social media link record in the database
                                    $socialMedia = $artistSocialMediaModel->create_artist_social_media($socialMediaRecordData);

                                    // Format social media data for response
                                    $socialMediaResponse = [
                                        'artist_social_media_id' => $socialMedia->artist_social_media_id, // Social media ID
                                        'event_artist_id' => $socialMedia->event_artist_id, // Artist ID
                                        'platform' => $socialMedia->platform, // Platform name
                                        'url' => $socialMedia->url, // Full URL
                                    ];

                                    // Add social media to array
                                    $socialMediaArray[] = $socialMediaResponse;
                                }
                            }

                            // Format artist data for response
                            $artistResponse = [
                                'event_artist_id' => $artist->event_artist_id, // Artist ID
                                'event_id' => $artist->event_id, // Event ID
                                'artist_name' => $artist->artist_name, // Artist name
                                'artist_image' => $artist->artist_image, // Artist image path
                                'social_media' => $socialMediaArray, // Social media links array
                            ];

                            // Add artist to created artists array
                            $createdArtists[] = $artistResponse;
                        }
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Return success response with all created artists
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event Step 4 saved successfully',
                        'artists' => $createdArtists, // All created artists with social media links
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::saveEventStep4');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while saving event Step 4',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Save Event Step 5 (Terms & Conditions)
     *
     * Handles saving or updating terms and conditions for an event. Creates terms record
     * if it doesn't exist, updates if it exists. Only draft events can have terms updated.
     * Rich text formatting is preserved exactly as entered.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function saveEventStep5(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
            'terms_content' => 'required|string', // Terms content is required, string type (TEXT field can handle large content)
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $eventTermsConditionModel = new EventTermsConditionModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to update it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Verify event is draft (not published)
                // Only draft events can have terms updated
                if ($event->is_published == true || $event->is_draft == false) {
                    // Event is published or not a draft, cannot update terms
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Terms can only be managed for draft events',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Begin database transaction to ensure data consistency
                // All operations must succeed together or all will be rolled back
                DB::beginTransaction();

                try {
                    // Check if terms already exist for this event
                    $termsQueryCondition = [
                        'event_id' => $data['event_id'], // Find terms by event ID
                    ];
                    $existingTerms = $eventTermsConditionModel->get_event_terms_condition($termsQueryCondition);
                    $isTermsUpdate = ! empty($existingTerms);

                    // Prepare terms data array with required fields
                    $termsData = [
                        'event_id' => $data['event_id'], // Link to event
                        'terms_content' => $data['terms_content'], // Rich text content (HTML/JSON format to preserve formatting)
                    ];

                    // Create or update terms record
                    if ($isTermsUpdate) {
                        // Update existing terms record
                        $eventTermsConditionModel->update_event_terms_condition_data($termsQueryCondition, $termsData);

                        // Get updated terms record for response
                        $terms = $eventTermsConditionModel->get_event_terms_condition($termsQueryCondition);
                    } else {
                        // Create new terms record
                        $terms = $eventTermsConditionModel->create_event_terms_condition($termsData);
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Format terms data for response
                // Exclude created_at and updated_at timestamps as per user requirement
                $termsResponse = [
                    'event_terms_id' => $terms->event_terms_id, // Terms ID
                    'event_id' => $terms->event_id, // Event ID
                    'terms_content' => $terms->terms_content, // Rich text content with preserved formatting
                ];

                // Return success response with created/updated terms data
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event Step 5 saved successfully',
                        'terms' => $termsResponse, // Terms data
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::saveEventStep5');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while saving event Step 5',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Save Event Step 6 (Coupons)
     *
     * Saves all coupons for Step 6 of event creation wizard. This API uses a "replace all"
     * approach: it deletes all existing coupons for the event and creates new ones from
     * the provided coupons array. This simplifies frontend logic by sending the final
     * desired state of all coupons.
     *
     * If any coupons have been used (times_used > 0), the API will return an error
     * preventing replacement to maintain data integrity. Coupon codes must be globally
     * unique across all events.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function saveEventStep6(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
            'coupons' => 'required|array|min:0', // Coupons array is required, can be empty
        ];

        // Add validation rules for each coupon in the array
        if (isset($data['coupons']) && is_array($data['coupons'])) {
            // Validate each coupon object in the coupons array
            foreach ($data['coupons'] as $index => $coupon) {
                $rules['coupons.'.$index.'.coupon_code'] = 'required|string|max:255'; // Coupon code is required, max 255 characters
                $rules['coupons.'.$index.'.discount_type'] = 'required|in:percentage,flat'; // Discount type must be valid ENUM
                $rules['coupons.'.$index.'.max_times_applicable'] = 'required|integer|min:1'; // Max times applicable must be at least 1
                $rules['coupons.'.$index.'.start_date'] = 'required|date_format:d-m-Y'; // Start date is required, format: d-m-Y
                $rules['coupons.'.$index.'.end_date'] = 'nullable|date_format:d-m-Y|after:coupons.'.$index.'.start_date'; // End date is optional, must be after start date if provided

                // Conditional validation based on discount_type
                if (isset($coupon['discount_type']) && $coupon['discount_type'] == 'percentage') {
                    // Percentage discount validation
                    $rules['coupons.'.$index.'.discount_percent'] = 'required|numeric|min:0|max:100'; // Discount percent is required, between 0 and 100
                    $rules['coupons.'.$index.'.max_cap_discount'] = 'nullable|numeric|min:0'; // Max cap discount is optional, must be non-negative
                    $rules['coupons.'.$index.'.flat_discount_amount'] = 'nullable'; // Flat discount amount must be null for percentage type
                } elseif (isset($coupon['discount_type']) && $coupon['discount_type'] == 'flat') {
                    // Flat discount validation
                    $rules['coupons.'.$index.'.flat_discount_amount'] = 'required|numeric|min:0'; // Flat discount amount is required, must be non-negative
                    $rules['coupons.'.$index.'.discount_percent'] = 'nullable'; // Discount percent must be null for flat type
                    $rules['coupons.'.$index.'.max_cap_discount'] = 'nullable'; // Max cap discount must be null for flat type
                }
            }
        }

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $couponModel = new CouponModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to update it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Verify event is draft (not published)
                // Only draft events can have coupons updated
                if ($event->is_published == true || $event->is_draft == false) {
                    // Event is published or not a draft, cannot update coupons
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Coupons can only be managed for draft events',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Begin database transaction to ensure data consistency
                // All operations must succeed together or all will be rolled back
                DB::beginTransaction();

                try {
                    // Get all existing coupons for the event
                    $existingCouponsQueryCondition = [
                        'event_id' => $data['event_id'], // Filter by event ID
                    ];
                    $existingCoupons = $couponModel->get_coupons_list($existingCouponsQueryCondition);

                    // Check if any existing coupons have been used (times_used > 0)
                    $hasUsedCoupons = false;
                    foreach ($existingCoupons as $existingCoupon) {
                        if ($existingCoupon->times_used > 0) {
                            $hasUsedCoupons = true; // Found at least one coupon with usage
                            break; // Exit loop early
                        }
                    }

                    // If coupons have been used, prevent replacement to maintain data integrity
                    if ($hasUsedCoupons) {
                        // Coupons have been used, cannot replace all coupons
                        DB::rollBack(); // Rollback transaction

                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E004',
                                'error_message' => 'Cannot modify coupons once they have been used. Please contact support if you need to make changes.',
                            ],
                        ];

                        // Return JSON response with 400 Bad Request status code
                        return response()->json($result, 400);
                    }

                    // Check for duplicate coupon codes in the request array
                    if (isset($data['coupons']) && is_array($data['coupons']) && count($data['coupons']) > 0) {
                        // Get all coupon codes from the request
                        $couponCodes = array_column($data['coupons'], 'coupon_code');

                        // Check for duplicates within the request
                        $duplicateCodes = array_diff_assoc($couponCodes, array_unique($couponCodes));
                        if (! empty($duplicateCodes)) {
                            // Duplicate coupon codes found in request
                            DB::rollBack(); // Rollback transaction

                            $result = [
                                'success' => false,
                                'error' => [
                                    'error_code' => 'E001',
                                    'error_message' => 'Duplicate coupon codes found in the request. Each coupon code must be unique.',
                                ],
                            ];

                            // Return JSON response with 400 Bad Request status code
                            return response()->json($result, 400);
                        }

                        // Check global uniqueness of coupon codes (across all events)
                        foreach ($data['coupons'] as $couponData) {
                            // Check if coupon code already exists globally (excluding current event's coupons)
                            $couponCodeQueryCondition = [
                                'coupon_code' => $couponData['coupon_code'], // Find by coupon code
                            ];
                            $existingCouponWithCode = $couponModel->get_coupon($couponCodeQueryCondition);

                            // Check if coupon code exists and doesn't belong to current event
                            if (! empty($existingCouponWithCode) && $existingCouponWithCode->event_id != $data['event_id']) {
                                // Coupon code already exists globally in a different event
                                DB::rollBack(); // Rollback transaction

                                $result = [
                                    'success' => false,
                                    'error' => [
                                        'error_code' => 'E004',
                                        'error_message' => 'Coupon code "'.$couponData['coupon_code'].'" already exists. Coupon codes must be globally unique.',
                                    ],
                                ];

                                // Return JSON response with 400 Bad Request status code
                                return response()->json($result, 400);
                            }
                        }
                    }

                    // Delete all existing coupons for the event
                    // This is safe because we've verified no coupons have been used
                    $deleteQueryCondition = [
                        'event_id' => $data['event_id'], // Delete all coupons for this event
                    ];
                    $couponModel->delete_coupon($deleteQueryCondition);

                    // Create all new coupons from the coupons array
                    $createdCoupons = [];
                    if (isset($data['coupons']) && is_array($data['coupons']) && count($data['coupons']) > 0) {
                        // Process each coupon in the array
                        foreach ($data['coupons'] as $couponData) {
                            // Prepare coupon data array
                            $couponRecordData = [
                                'event_id' => $data['event_id'], // Link to event
                                'coupon_code' => $couponData['coupon_code'], // Coupon code
                                'discount_type' => $couponData['discount_type'], // Discount type
                                'max_times_applicable' => $couponData['max_times_applicable'], // Max times applicable
                                'times_used' => 0, // Initialize times used to 0
                            ];

                            // Convert start_date from d-m-Y to Y-m-d format for database storage
                            // Use Carbon to properly parse d-m-Y format (e.g., "18-11-2025")
                            $startDateFormatted = Carbon::createFromFormat('d-m-Y', $couponData['start_date'])->format('Y-m-d');
                            $couponRecordData['start_date'] = $startDateFormatted; // Start date in Y-m-d format

                            // Handle end_date (optional field)
                            if (isset($couponData['end_date']) && ! empty($couponData['end_date'])) {
                                // Convert end_date from d-m-Y to Y-m-d format for database storage
                                // Use Carbon to properly parse d-m-Y format (e.g., "30-11-2025")
                                $endDateFormatted = Carbon::createFromFormat('d-m-Y', $couponData['end_date'])->format('Y-m-d');
                                $couponRecordData['end_date'] = $endDateFormatted; // End date in Y-m-d format
                            } else {
                                $couponRecordData['end_date'] = null; // Set to null if not provided
                            }

                            // Handle fields based on discount_type
                            if ($couponData['discount_type'] == 'percentage') {
                                // Percentage discount type
                                $couponRecordData['discount_percent'] = $couponData['discount_percent']; // Discount percent

                                // Handle max_cap_discount (optional for percentage type)
                                if (isset($couponData['max_cap_discount']) && ! empty($couponData['max_cap_discount'])) {
                                    $couponRecordData['max_cap_discount'] = $couponData['max_cap_discount']; // Max cap discount
                                } else {
                                    $couponRecordData['max_cap_discount'] = null; // Set to null if not provided
                                }

                                // Flat discount amount must be null for percentage type
                                $couponRecordData['flat_discount_amount'] = null;
                            } else {
                                // Flat discount type
                                $couponRecordData['flat_discount_amount'] = $couponData['flat_discount_amount']; // Flat discount amount

                                // Discount percent and max cap discount must be null for flat type
                                $couponRecordData['discount_percent'] = null;
                                $couponRecordData['max_cap_discount'] = null;
                            }

                            // Create coupon record in the database
                            $coupon = $couponModel->create_coupon($couponRecordData);

                            // Format coupon data for response
                            // Convert dates back to d-m-Y format for response
                            // Use Carbon to properly format dates from Y-m-d (database) to d-m-Y (response)
                            $startDateResponse = Carbon::parse($coupon->start_date)->format('d-m-Y');
                            $endDateResponse = ! empty($coupon->end_date) ? Carbon::parse($coupon->end_date)->format('d-m-Y') : null;

                            $couponResponse = [
                                'coupon_id' => $coupon->coupon_id, // Coupon ID
                                'event_id' => $coupon->event_id, // Event ID
                                'coupon_code' => $coupon->coupon_code, // Coupon code
                                'discount_type' => $coupon->discount_type, // Discount type
                                'max_times_applicable' => $coupon->max_times_applicable, // Max times applicable
                                'start_date' => $startDateResponse, // Start date in d-m-Y format
                                'end_date' => $endDateResponse, // End date in d-m-Y format (or null)
                                'times_used' => $coupon->times_used, // Times used
                            ];

                            // Add discount-specific fields based on discount_type
                            if ($coupon->discount_type == 'percentage') {
                                // Percentage discount fields
                                $couponResponse['discount_percent'] = (string) $coupon->discount_percent; // Discount percent as string
                                $couponResponse['max_cap_discount'] = ! empty($coupon->max_cap_discount) ? (string) $coupon->max_cap_discount : null; // Max cap discount as string (or null)
                                $couponResponse['flat_discount_amount'] = null; // Flat discount amount is null for percentage type
                            } else {
                                // Flat discount fields
                                $couponResponse['flat_discount_amount'] = (string) $coupon->flat_discount_amount; // Flat discount amount as string
                                $couponResponse['discount_percent'] = null; // Discount percent is null for flat type
                                $couponResponse['max_cap_discount'] = null; // Max cap discount is null for flat type
                            }

                            // Add coupon to created coupons array
                            $createdCoupons[] = $couponResponse;
                        }
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Return success response with all created coupons
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event Step 6 saved successfully',
                        'coupons' => $createdCoupons, // All created coupons
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::saveEventStep6');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while saving event Step 6',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Event Summary
     *
     * Retrieves all event data from all 7 steps for display in the summary page.
     * This includes event information, media, social links, tickets, venue, artists,
     * terms & conditions, coupons, and event data score calculation.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getEventSummary(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $eventCategoryModel = new EventCategoryModel;
                $eventMediaModel = new EventMediaModel;
                $eventSocialMediaModel = new EventSocialMediaModel;
                $ticketModel = new TicketModel;
                $ticketCategoryModel = new TicketCategoryModel;
                $venueModel = new VenueModel;
                $countryModel = new CountryModel;
                $eventArtistModel = new EventArtistModel;
                $artistSocialMediaModel = new ArtistSocialMediaModel;
                $eventTermsConditionModel = new EventTermsConditionModel;
                $couponModel = new CouponModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to view it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Get event category name
                $categoryQueryCondition = [
                    'event_category_id' => $event->event_category_id, // Find category
                ];
                $category = $eventCategoryModel->get_event_category($categoryQueryCondition);
                $categoryName = ! empty($category) ? $category->category_name : null;

                // Format event information for response
                $eventInformation = [
                    'event_id' => $event->event_id, // Event ID
                    'event_title' => $event->event_title, // Event title
                    'description' => $event->description, // Rich text description
                    'category_name' => $categoryName, // Category name
                    'start_date' => date('d-m-Y', strtotime($event->start_date)), // Start date formatted as d-m-Y
                    'end_date' => date('d-m-Y', strtotime($event->end_date)), // End date formatted as d-m-Y
                    'start_time' => date('H:i', strtotime($event->start_time)), // Start time formatted as H:i
                    'end_time' => date('H:i', strtotime($event->end_time)), // End time formatted as H:i
                    'key_highlights' => $event->key_highlights, // Key highlights (rich text)
                ];

                // Retrieve event media grouped by media type
                $mediaQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $allMedia = $eventMediaModel->get_event_media_list($mediaQueryCondition);

                // Group media by type
                $eventMedia = [
                    'thumbnail' => [], // Thumbnail media array
                    'banner' => [], // Banner media array
                    'flyer' => [], // Flyer media array
                    'video' => [], // Video media array
                ];

                // Loop through all media and group by type
                foreach ($allMedia as $media) {
                    // Format media data excluding timestamps
                    $mediaData = [
                        'event_media_id' => $media->event_media_id, // Media ID
                        'media_type' => $media->media_type, // Media type
                        'file_path' => $media->file_path, // File path
                        'file_name' => $media->file_name, // File name
                        'file_size' => $media->file_size, // File size
                    ];

                    // Add video_duration if media type is video
                    if ($media->media_type == 'video' && ! empty($media->video_duration)) {
                        $mediaData['video_duration'] = $media->video_duration; // Video duration
                    }

                    // Add to appropriate media type array
                    if ($media->media_type == 'thumbnail') {
                        $eventMedia['thumbnail'][] = $mediaData;
                    } elseif ($media->media_type == 'banner') {
                        $eventMedia['banner'][] = $mediaData;
                    } elseif ($media->media_type == 'flyer') {
                        $eventMedia['flyer'][] = $mediaData;
                    } elseif ($media->media_type == 'video') {
                        $eventMedia['video'][] = $mediaData;
                    }
                }

                // Retrieve social media links
                $socialMediaQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $allSocialMedia = $eventSocialMediaModel->get_event_social_media_list($socialMediaQueryCondition);

                // Format social media links array for response
                $socialMediaArray = [];
                foreach ($allSocialMedia as $socialMedia) {
                    // Format social media data excluding timestamps
                    $socialMediaArray[] = [
                        'event_social_media_id' => $socialMedia->event_social_media_id, // Social media ID
                        'platform' => $socialMedia->platform, // Platform name
                        'url' => $socialMedia->url, // Social media URL
                    ];
                }

                // Retrieve tickets with category information
                $ticketsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $tickets = $ticketModel->get_tickets_list($ticketsQueryCondition);

                // Format tickets array for response with category information and revenue
                $ticketsArray = [];
                $totalRevenue = 0; // Initialize total revenue counter

                foreach ($tickets as $ticket) {
                    // Get category name for this ticket
                    $categoryQueryCondition = [
                        'ticket_category_id' => $ticket->ticket_category_id, // Find category
                    ];
                    $category = $ticketCategoryModel->get_ticket_category($categoryQueryCondition);
                    $categoryName = ! empty($category) ? $category->category_name : null;

                    // Calculate available quantity
                    $availableQuantity = $ticket->total_available - $ticket->sold_quantity;

                    // Calculate revenue for this ticket type
                    $ticketRevenue = $ticket->sold_quantity * $ticket->price;
                    $totalRevenue += $ticketRevenue; // Add to total revenue

                    // Format ticket data for response excluding timestamps
                    $ticketsArray[] = [
                        'ticket_id' => $ticket->ticket_id, // Ticket ID
                        'ticket_category_id' => $ticket->ticket_category_id, // Category ID
                        'category_name' => $categoryName, // Category name
                        'ticket_type' => $ticket->ticket_type, // Ticket type
                        'description' => $ticket->description, // Description
                        'price' => (string) $ticket->price, // Price as string
                        'total_available' => $ticket->total_available, // Total available
                        'sold_quantity' => $ticket->sold_quantity, // Sold quantity
                        'available_quantity' => $availableQuantity, // Calculated available quantity
                        'ticket_info' => $ticket->ticket_info, // Ticket info (rich text)
                        'max_per_user' => $ticket->max_per_user, // Max tickets per user
                        'revenue' => (string) $ticketRevenue, // Revenue for this ticket type as string
                    ];
                }

                // Retrieve venue details
                $venueQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $venue = $venueModel->get_venue($venueQueryCondition);

                // Format venue data for response
                $venueData = null; // Initialize as null
                if (! empty($venue)) {
                    // Get country name
                    $countryQueryCondition = [
                        'country_id' => $venue->country_id, // Find country
                    ];
                    $country = $countryModel->get_country($countryQueryCondition);
                    $countryName = ! empty($country) ? $country->name : null;

                    // Format venue data excluding timestamps
                    $venueData = [
                        'venue_id' => $venue->venue_id, // Venue ID
                        'venue_name' => $venue->venue_name, // Venue name
                        'venue_address' => $venue->venue_address, // Venue address
                        'city' => $venue->city, // City
                        'state_province' => $venue->state_province, // State/Province
                        'postal_code' => $venue->postal_code, // Postal code
                        'country_id' => $venue->country_id, // Country ID
                        'country_name' => $countryName, // Country name
                        'latitude' => (string) $venue->latitude, // Latitude as string
                        'longitude' => (string) $venue->longitude, // Longitude as string
                        'maximum_attendees' => $venue->maximum_attendees, // Maximum attendees
                        'additional_details' => $venue->additional_details, // Additional details
                        'venue_image' => $venue->venue_image, // Venue image path
                    ];
                }

                // Retrieve event artists with social media links
                $artistsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $artists = $eventArtistModel->get_event_artists_list($artistsQueryCondition);

                // Format artists array for response with social media links
                $artistsArray = [];
                foreach ($artists as $artist) {
                    // Get social media links for this artist
                    $artistSocialMediaQueryCondition = [
                        'event_artist_id' => $artist->event_artist_id, // Filter by artist ID
                    ];
                    $artistSocialMedia = $artistSocialMediaModel->get_artist_social_media_list($artistSocialMediaQueryCondition);

                    // Format social media links array
                    $artistSocialMediaArray = [];
                    foreach ($artistSocialMedia as $socialMedia) {
                        // Format social media data excluding timestamps
                        $artistSocialMediaArray[] = [
                            'artist_social_media_id' => $socialMedia->artist_social_media_id, // Social media ID
                            'platform' => $socialMedia->platform, // Platform name
                            'url' => $socialMedia->url, // Social media URL
                        ];
                    }

                    // Format artist data excluding timestamps
                    $artistsArray[] = [
                        'event_artist_id' => $artist->event_artist_id, // Artist ID
                        'artist_name' => $artist->artist_name, // Artist name
                        'artist_image' => $artist->artist_image, // Artist image path
                        'social_media' => $artistSocialMediaArray, // Social media links array
                    ];
                }

                // Retrieve terms & conditions
                $termsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $terms = $eventTermsConditionModel->get_event_terms_condition($termsQueryCondition);

                // Format terms & conditions data for response
                $termsData = null; // Initialize as null
                if (! empty($terms)) {
                    // Format terms data excluding timestamps
                    $termsData = [
                        'event_terms_id' => $terms->event_terms_id, // Terms ID
                        'terms_content' => $terms->terms_content, // Terms content (rich text)
                    ];
                }

                // Retrieve active coupons (filter by validity dates and usage limits)
                $couponsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $allCoupons = $couponModel->get_coupons_list($couponsQueryCondition);

                // Filter active coupons: start_date <= TODAY <= end_date (or end_date is null), times_used < max_times_applicable
                // Use Carbon for reliable date comparison and formatting
                $today = Carbon::now()->format('Y-m-d'); // Get today's date in Y-m-d format
                $couponsArray = [];

                foreach ($allCoupons as $coupon) {
                    // Check start date: must be <= today
                    $startDate = ! empty($coupon->start_date) ? Carbon::parse($coupon->start_date)->format('Y-m-d') : null;
                    $isStartValid = ! empty($startDate) ? ($startDate <= $today) : true; // If start date missing, treat as valid

                    // Check end date: must be >= today (or null)
                    $isEndValid = true; // Default to valid if no end date
                    if (! empty($coupon->end_date)) {
                        $endDate = Carbon::parse($coupon->end_date)->format('Y-m-d');
                        $isEndValid = $endDate >= $today;
                    }

                    // Check usage limit: times_used < max_times_applicable
                    $isNotFullyUsed = $coupon->times_used < $coupon->max_times_applicable;

                    // Coupon is active only when all conditions pass
                    if ($isStartValid && $isEndValid && $isNotFullyUsed) {
                        // Format coupon data excluding timestamps
                        $couponsArray[] = [
                            'coupon_id' => $coupon->coupon_id, // Coupon ID
                            'coupon_code' => $coupon->coupon_code, // Coupon code
                            'discount_type' => $coupon->discount_type, // Discount type
                            'discount_percent' => $coupon->discount_percent !== null ? (string) $coupon->discount_percent : null, // Discount percent as string or null
                            'flat_discount_amount' => $coupon->flat_discount_amount !== null ? (string) $coupon->flat_discount_amount : null, // Flat discount amount as string or null
                            'max_cap_discount' => $coupon->max_cap_discount !== null ? (string) $coupon->max_cap_discount : null, // Max cap discount as string or null
                            'max_times_applicable' => $coupon->max_times_applicable, // Max times applicable
                            'start_date' => ! empty($coupon->start_date) ? Carbon::parse($coupon->start_date)->format('d-m-Y') : null, // Start date formatted as d-m-Y
                            'end_date' => ! empty($coupon->end_date) ? Carbon::parse($coupon->end_date)->format('d-m-Y') : null, // End date formatted as d-m-Y or null
                            'times_used' => $coupon->times_used, // Times used
                        ];
                    }
                }

                // Calculate event data score (completion percentage)
                $completedSections = 0; // Initialize completed sections counter
                $totalSections = 5; // Total sections (artists and coupons are optional, so they don't count)

                // 1. Event Information (Step 1) - Required: event_title, description, category, dates, times
                if (! empty($event->event_title) && ! empty($event->description) && ! empty($event->event_category_id) && ! empty($event->start_date) && ! empty($event->end_date) && ! empty($event->start_time) && ! empty($event->end_time)) {
                    $completedSections++; // Event information is complete
                }

                // 2. Event Media (Step 1) - At least thumbnail or banner
                if ((! empty($eventMedia['thumbnail']) && count($eventMedia['thumbnail']) > 0) || (! empty($eventMedia['banner']) && count($eventMedia['banner']) > 0)) {
                    $completedSections++; // Event media is complete
                }

                // 3. Tickets (Step 2) - At least one ticket created
                if (! empty($ticketsArray) && count($ticketsArray) > 0) {
                    $completedSections++; // Tickets are complete
                }

                // 4. Venue (Step 3) - Venue record exists
                if (! empty($venueData)) {
                    $completedSections++; // Venue is complete
                }

                // 5. Terms & Conditions (Step 5) - Terms record exists
                if (! empty($termsData)) {
                    $completedSections++; // Terms & conditions are complete
                }

                // Calculate percentage
                $percentage = ($completedSections / $totalSections) * 100; // Calculate percentage
                $percentage = round($percentage); // Round to nearest integer

                // Determine score label based on percentage
                $label = 'Poor'; // Default label
                if ($percentage >= 81) {
                    $label = 'Excellent'; // 81-100%
                } elseif ($percentage >= 61) {
                    $label = 'Good'; // 61-80%
                } elseif ($percentage >= 41) {
                    $label = 'Fair'; // 41-60%
                }

                // Format event data score for response
                $eventDataScore = [
                    'percentage' => $percentage, // Completion percentage
                    'label' => $label, // Score label
                    'completed_sections' => $completedSections, // Number of completed sections
                    'total_sections' => $totalSections, // Total number of sections
                ];

                // Build complete event summary response
                $eventSummary = [
                    'event_information' => $eventInformation, // Event basic information
                    'event_media' => $eventMedia, // Event media grouped by type
                    'social_media' => $socialMediaArray, // Social media links
                    'tickets' => $ticketsArray, // Tickets with pricing and revenue
                    'total_revenue' => (string) $totalRevenue, // Total revenue from all tickets as string
                    'venue' => $venueData, // Venue details (null if not set)
                    'artists' => $artistsArray, // Event artists with social media
                    'terms_conditions' => $termsData, // Terms & conditions (null if not set)
                    'coupons' => $couponsArray, // Active coupons
                    'event_data_score' => $eventDataScore, // Event data score
                ];

                // Return success response with event summary
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event summary retrieved successfully',
                        'event_summary' => $eventSummary,
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::getEventSummary');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving event summary',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Publish Event
     *
     * Publishes an event by updating status flags (is_draft = false, is_published = true).
     * Makes the event visible to End Users on public listing pages.
     * Only draft events can be published. Basic validation is performed (not too rigid).
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function publishEvent(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to publish it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Profile completeness check: require host (and optionally business) fields before publishing
                $authenticatedUser->refresh();
                $authenticatedUser->load('business');
                $host = $authenticatedUser;
                $business = $host->business;
                $accountType = null;
                if (! empty($host->business_id) && $business !== null) {
                    $accountType = $business->account_type;
                }
                $missingFields = [];

                // E007 when account_type is null (profile/business setup not completed)
                if ($accountType === null) {
                    $missingFields[] = 'account_type';
                } elseif ($accountType === 'personal') {
                    // Personal: only first_name, last_name, email, phone_number; no business info required
                    if (empty(trim((string) $host->first_name))) {
                        $missingFields[] = 'first_name';
                    }
                    if (empty(trim((string) $host->last_name))) {
                        $missingFields[] = 'last_name';
                    }
                    if (empty(trim((string) $host->email))) {
                        $missingFields[] = 'email';
                    }
                    if (empty(trim((string) ($host->phone_number ?? '')))) {
                        $missingFields[] = 'phone_number';
                    }
                } else {
                    // Business: host fields + company name, business type, tax id, business intersection, business street address
                    if (empty(trim((string) $host->first_name))) {
                        $missingFields[] = 'first_name';
                    }
                    if (empty(trim((string) $host->last_name))) {
                        $missingFields[] = 'last_name';
                    }
                    if (empty(trim((string) $host->email))) {
                        $missingFields[] = 'email';
                    }
                    if (empty(trim((string) ($host->phone_number ?? '')))) {
                        $missingFields[] = 'phone_number';
                    }
                    if (empty(trim((string) ($business->business_name ?? '')))) {
                        $missingFields[] = 'business_name';
                    }
                    if (empty(trim((string) ($business->business_type ?? '')))) {
                        $missingFields[] = 'business_type';
                    }
                    if (empty(trim((string) ($business->tax_id ?? '')))) {
                        $missingFields[] = 'tax_id';
                    }
                    $hasIntersection = (! empty($business->business_intersection_id) && (int) $business->business_intersection_id > 0)
                        || ! empty(trim((string) ($business->other_business_intersection ?? '')));
                    if (! $hasIntersection) {
                        $missingFields[] = 'business_intersection';
                    }
                    if (empty(trim((string) ($business->business_street_address ?? '')))) {
                        $missingFields[] = 'business_street_address';
                    }
                }

                if (! empty($missingFields)) {
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E007',
                            'error_message' => 'Complete your profile before publishing events.',
                            'action_required' => 'complete_profile',
                            'missing_fields' => $missingFields,
                        ],
                    ];

                    return response()->json($result, 400);
                }

                // Check Stripe account and KYC completion before allowing event publishing
                // Refresh user to get latest data including stripe_account_id
                $authenticatedUser->refresh();
                $stripeAccountId = $authenticatedUser->stripe_account_id;

                // Check if host has Stripe account
                if (empty($stripeAccountId)) {
                    // No Stripe account exists, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E005',
                            'error_message' => 'You must create a Stripe account before publishing events. Please create your Stripe account first.',
                            'action_required' => 'create_stripe_account',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Check KYC completion
                try {
                    $stripeService = new StripeService;
                    $kycCompleted = $stripeService->isKycCompleted($stripeAccountId);

                    if (! $kycCompleted) {
                        // KYC not completed, generate onboarding link and return error
                        $frontendUrl = config('constants.event_frontend_url');

                        // Check if return_url is provided in request, otherwise use profile page
                        $returnUrl = $request->input('return_url');
                        if (empty($returnUrl)) {
                            $returnUrl = $frontendUrl.'/dashboard/profile';
                        }
                        $refreshUrl = $returnUrl; // Use same URL for refresh

                        $accountLink = $stripeService->createAccountLink($stripeAccountId, $returnUrl, $refreshUrl);
                        $onboardingUrl = $accountLink->url;

                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E006',
                                'error_message' => 'You must complete KYC verification before publishing events. Please complete your Stripe onboarding first.',
                                'onboarding_url' => $onboardingUrl,
                                'action_required' => 'complete_kyc',
                            ],
                        ];

                        // Return JSON response with 400 Bad Request status code
                        return response()->json($result, 400);
                    }
                } catch (\Exception $e) {
                    // Log error but don't block publishing if Stripe check fails (graceful degradation)
                    Log::error('Error checking KYC status in publishEvent', [
                        'host_user_id' => $hostUserId,
                        'stripe_account_id' => $stripeAccountId,
                        'error' => $e->getMessage(),
                    ]);

                    // For now, allow publishing even if KYC check fails (can be made stricter later)
                    // This prevents blocking hosts if Stripe API is temporarily unavailable
                }

                // Check if event is already published
                if ($event->is_published == true && $event->is_draft == false) {
                    // Event is already published, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Event is already published',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Check if event is not a draft (should not happen, but check anyway)
                if ($event->is_draft == false) {
                    // Event is not a draft, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Only draft events can be published',
                        ],
                    ];

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }

                // Basic validation (not too rigid) - these are recommendations, not strict requirements
                // Check if event has basic information (title, description, category, dates, times)
                $hasBasicInfo = ! empty($event->event_title) && ! empty($event->description) && ! empty($event->event_category_id) && ! empty($event->start_date) && ! empty($event->end_date) && ! empty($event->start_time) && ! empty($event->end_time);

                // Note: We allow publishing even if basic info is missing (not too rigid as per PRD)
                // Warnings can be added in the future if needed, but they won't block publishing

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Prepare update data to publish event
                    $updateData = [
                        'is_draft' => false, // Set is_draft to false
                        'is_published' => true, // Set is_published to true
                    ];

                    // Update event status to published
                    $queryCondition = [
                        'event_id' => $data['event_id'], // Find by event ID
                    ];
                    $updateResult = $eventModel->update_event_data($queryCondition, $updateData);

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Get updated event record for response
                $updatedEvent = $eventModel->get_event($queryCondition);

                // Format updated event data for response
                $eventData = [
                    'event_id' => $updatedEvent->event_id, // Event ID
                    'event_title' => $updatedEvent->event_title, // Event title
                    'is_draft' => $updatedEvent->is_draft, // Draft status
                    'is_published' => $updatedEvent->is_published, // Published status
                ];

                // Return success response with updated event data
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event published successfully',
                        'event' => $eventData,
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::publishEvent');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while publishing the event',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Event Data for Editing
     *
     * Retrieves all event data from all 7 steps for a draft event in a format
     * optimized for form preloading when editing. The data is organized by steps
     * to make it easy for the frontend to populate each step's form fields.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getEventDataForEditing(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $eventCategoryModel = new EventCategoryModel;
                $eventMediaModel = new EventMediaModel;
                $eventSocialMediaModel = new EventSocialMediaModel;
                $ticketModel = new TicketModel;
                $ticketCategoryModel = new TicketCategoryModel;
                $venueModel = new VenueModel;
                $countryModel = new CountryModel;
                $eventArtistModel = new EventArtistModel;
                $artistSocialMediaModel = new ArtistSocialMediaModel;
                $eventTermsConditionModel = new EventTermsConditionModel;
                $couponModel = new CouponModel;

                // Verify event exists and belongs to authenticated host user
                $queryCondition = [
                    'event_id' => $data['event_id'], // Event ID to find
                    'host_user_id' => $hostUserId, // Must belong to authenticated user
                ];
                $event = $eventModel->get_event($queryCondition);

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to view it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // ============================================
                // STEP 1: Event Details (Event Info, Media, Social Media)
                // ============================================

                // Format event information for response
                $startDateFormatted = date('d-m-Y', strtotime($event->start_date)); // Format start date as d-m-Y
                $endDateFormatted = date('d-m-Y', strtotime($event->end_date)); // Format end date as d-m-Y
                $startTimeFormatted = date('H:i', strtotime($event->start_time)); // Format start time as H:i
                $endTimeFormatted = date('H:i', strtotime($event->end_time)); // Format end time as H:i

                // Format event data for Step 1 response excluding timestamps
                $step1Event = [
                    'event_id' => $event->event_id, // Event ID
                    'event_title' => $event->event_title, // Event title
                    'description' => $event->description, // Rich text description
                    'event_category_id' => $event->event_category_id, // Category ID
                    'start_date' => $startDateFormatted, // Start date formatted as d-m-Y
                    'end_date' => $endDateFormatted, // End date formatted as d-m-Y
                    'start_time' => $startTimeFormatted, // Start time formatted as H:i
                    'end_time' => $endTimeFormatted, // End time formatted as H:i
                    'key_highlights' => $event->key_highlights, // Key highlights (rich text, optional)
                ];

                // Retrieve event media grouped by media type
                $mediaQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $allMedia = $eventMediaModel->get_event_media_list($mediaQueryCondition);

                // Group media by type
                $step1Media = [
                    'thumbnail' => [], // Thumbnail media array
                    'banner' => [], // Banner media array
                    'flyer' => [], // Flyer media array
                    'video' => [], // Video media array
                ];

                // Loop through all media and group by type
                foreach ($allMedia as $media) {
                    // Format media data excluding timestamps
                    $mediaData = [
                        'event_media_id' => $media->event_media_id, // Media ID
                        'media_type' => $media->media_type, // Media type
                        'file_path' => $media->file_path, // File path
                        'file_name' => $media->file_name, // File name
                        'file_size' => $media->file_size, // File size
                    ];

                    // Add video_duration if media type is video
                    if ($media->media_type == 'video' && ! empty($media->video_duration)) {
                        $mediaData['video_duration'] = $media->video_duration; // Video duration
                    }

                    // Add to appropriate media type array
                    if ($media->media_type == 'thumbnail') {
                        $step1Media['thumbnail'][] = $mediaData;
                    } elseif ($media->media_type == 'banner') {
                        $step1Media['banner'][] = $mediaData;
                    } elseif ($media->media_type == 'flyer') {
                        $step1Media['flyer'][] = $mediaData;
                    } elseif ($media->media_type == 'video') {
                        $step1Media['video'][] = $mediaData;
                    }
                }

                // Retrieve social media links
                $socialMediaQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $allSocialMedia = $eventSocialMediaModel->get_event_social_media_list($socialMediaQueryCondition);

                // Format social media links array for response
                $step1SocialMedia = [];
                foreach ($allSocialMedia as $socialMedia) {
                    // Format social media data excluding timestamps
                    $step1SocialMedia[] = [
                        'event_social_media_id' => $socialMedia->event_social_media_id, // Social media ID
                        'platform' => $socialMedia->platform, // Platform name
                        'url' => $socialMedia->url, // Social media URL
                    ];
                }

                // Build Step 1 response
                $step1Data = [
                    'event' => $step1Event, // Event basic information
                    'media' => $step1Media, // Event media grouped by type
                    'social_media' => $step1SocialMedia, // Social media links
                ];

                // ============================================
                // STEP 2: Ticketing (Tickets and Ticket Categories)
                // ============================================

                // Retrieve tickets with category information
                $ticketsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $tickets = $ticketModel->get_tickets_list($ticketsQueryCondition);

                // Format tickets array for response with category information
                $step2Tickets = [];
                foreach ($tickets as $ticket) {
                    // Get category name for this ticket
                    $categoryQueryCondition = [
                        'ticket_category_id' => $ticket->ticket_category_id, // Find category
                    ];
                    $category = $ticketCategoryModel->get_ticket_category($categoryQueryCondition);
                    $categoryName = ! empty($category) ? $category->category_name : null;

                    // Format ticket data for response excluding timestamps
                    $step2Tickets[] = [
                        'ticket_id' => $ticket->ticket_id, // Ticket ID
                        'ticket_category_id' => $ticket->ticket_category_id, // Category ID
                        'category_name' => $categoryName, // Category name
                        'ticket_type' => $ticket->ticket_type, // Ticket type
                        'description' => $ticket->description, // Description
                        'price' => (string) $ticket->price, // Price as string
                        'total_available' => $ticket->total_available, // Total available
                        'sold_quantity' => $ticket->sold_quantity, // Sold quantity
                        'ticket_info' => $ticket->ticket_info, // Ticket info (rich text)
                        'max_per_user' => $ticket->max_per_user, // Max tickets per user
                    ];
                }

                // Sort tickets by ticket_id (creation order)
                usort($step2Tickets, function ($a, $b) {
                    return $a['ticket_id'] - $b['ticket_id'];
                });

                // Retrieve all ticket categories for this event (for dropdown)
                $ticketCategoriesQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $ticketCategories = $ticketCategoryModel->get_ticket_categories_list($ticketCategoriesQueryCondition);

                // Format ticket categories array for response
                $step2TicketCategories = [];
                foreach ($ticketCategories as $category) {
                    // Format category data excluding timestamps
                    $step2TicketCategories[] = [
                        'ticket_category_id' => $category->ticket_category_id, // Category ID
                        'category_name' => $category->category_name, // Category name
                    ];
                }

                // Build Step 2 response
                $step2Data = [
                    'tickets' => $step2Tickets, // Tickets array
                    'ticket_categories' => $step2TicketCategories, // Ticket categories array
                ];

                // ============================================
                // STEP 3: Venue Details
                // ============================================

                // Retrieve venue details
                $venueQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $venue = $venueModel->get_venue($venueQueryCondition);

                // Format venue data for response
                $step3Venue = null; // Initialize as null
                if (! empty($venue)) {
                    // Format venue data excluding timestamps
                    $step3Venue = [
                        'venue_id' => $venue->venue_id, // Venue ID
                        'venue_name' => $venue->venue_name, // Venue name
                        'venue_address' => $venue->venue_address, // Venue address
                        'city' => $venue->city, // City
                        'state_province' => $venue->state_province, // State/Province
                        'postal_code' => $venue->postal_code, // Postal code
                        'country_id' => $venue->country_id, // Country ID
                        'latitude' => (string) $venue->latitude, // Latitude as string
                        'longitude' => (string) $venue->longitude, // Longitude as string
                        'maximum_attendees' => $venue->maximum_attendees, // Maximum attendees
                        'additional_details' => $venue->additional_details, // Additional details
                        'venue_image' => $venue->venue_image, // Venue image path
                    ];
                }

                // Build Step 3 response
                $step3Data = [
                    'venue' => $step3Venue, // Venue details (null if not set)
                ];

                // ============================================
                // STEP 4: Event Members (Artists)
                // ============================================

                // Retrieve event artists with social media links
                $artistsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $artists = $eventArtistModel->get_event_artists_list($artistsQueryCondition);

                // Format artists array for response with social media links
                $step4Artists = [];
                foreach ($artists as $artist) {
                    // Get social media links for this artist
                    $artistSocialMediaQueryCondition = [
                        'event_artist_id' => $artist->event_artist_id, // Filter by artist ID
                    ];
                    $artistSocialMedia = $artistSocialMediaModel->get_artist_social_media_list($artistSocialMediaQueryCondition);

                    // Format social media links array
                    $artistSocialMediaArray = [];
                    foreach ($artistSocialMedia as $socialMedia) {
                        // Format social media data excluding timestamps
                        $artistSocialMediaArray[] = [
                            'artist_social_media_id' => $socialMedia->artist_social_media_id, // Social media ID
                            'platform' => $socialMedia->platform, // Platform name
                            'url' => $socialMedia->url, // Social media URL
                        ];
                    }

                    // Format artist data excluding timestamps
                    $step4Artists[] = [
                        'event_artist_id' => $artist->event_artist_id, // Artist ID
                        'artist_name' => $artist->artist_name, // Artist name
                        'artist_image' => $artist->artist_image, // Artist image path
                        'social_media' => $artistSocialMediaArray, // Social media links array
                    ];
                }

                // Build Step 4 response
                $step4Data = [
                    'artists' => $step4Artists, // Event artists with social media
                ];

                // ============================================
                // STEP 5: Terms & Conditions
                // ============================================

                // Retrieve terms & conditions
                $termsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $terms = $eventTermsConditionModel->get_event_terms_condition($termsQueryCondition);

                // Format terms & conditions data for response
                $step5Terms = null; // Initialize as null
                if (! empty($terms)) {
                    // Format terms data excluding timestamps
                    $step5Terms = [
                        'event_terms_id' => $terms->event_terms_id, // Terms ID
                        'terms_content' => $terms->terms_content, // Terms content (rich text)
                    ];
                }

                // Build Step 5 response
                $step5Data = [
                    'terms' => $step5Terms, // Terms & conditions (null if not set)
                ];

                // ============================================
                // STEP 6: Coupons
                // ============================================

                // Retrieve all coupons for this event (not filtered by validity - all coupons for editing)
                $couponsQueryCondition = [
                    'event_id' => $data['event_id'], // Filter by event ID
                ];
                $allCoupons = $couponModel->get_coupons_list($couponsQueryCondition);

                // Format coupons array for response (all coupons, not just active ones)
                $step6Coupons = [];
                foreach ($allCoupons as $coupon) {
                    // Format coupon data excluding timestamps
                    $step6Coupons[] = [
                        'coupon_id' => $coupon->coupon_id, // Coupon ID
                        'coupon_code' => $coupon->coupon_code, // Coupon code
                        'discount_type' => $coupon->discount_type, // Discount type
                        'discount_percent' => $coupon->discount_percent !== null ? (string) $coupon->discount_percent : null, // Discount percent as string or null
                        'flat_discount_amount' => $coupon->flat_discount_amount !== null ? (string) $coupon->flat_discount_amount : null, // Flat discount amount as string or null
                        'max_cap_discount' => $coupon->max_cap_discount !== null ? (string) $coupon->max_cap_discount : null, // Max cap discount as string or null
                        'max_times_applicable' => $coupon->max_times_applicable, // Max times applicable
                        'start_date' => date('d-m-Y', strtotime($coupon->start_date)), // Start date formatted as d-m-Y
                        'end_date' => ! empty($coupon->end_date) ? date('d-m-Y', strtotime($coupon->end_date)) : null, // End date formatted as d-m-Y or null
                        'times_used' => $coupon->times_used, // Times used
                    ];
                }

                // Build Step 6 response
                $step6Data = [
                    'coupons' => $step6Coupons, // All coupons (for editing, regardless of validity)
                ];

                // Build complete event data response organized by steps
                $eventDataForEditing = [
                    'event_id' => $event->event_id, // Event ID
                    'step_1' => $step1Data, // Step 1: Event details, media, social media
                    'step_2' => $step2Data, // Step 2: Tickets and ticket categories
                    'step_3' => $step3Data, // Step 3: Venue details
                    'step_4' => $step4Data, // Step 4: Event members (artists)
                    'step_5' => $step5Data, // Step 5: Terms & conditions
                    'step_6' => $step6Data, // Step 6: Coupons
                ];

                // Return success response with event data organized by steps
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event data retrieved successfully',
                        'event_id' => $event->event_id, // Event ID
                        'step_1' => $step1Data, // Step 1 data
                        'step_2' => $step2Data, // Step 2 data
                        'step_3' => $step3Data, // Step 3 data
                        'step_4' => $step4Data, // Step 4 data
                        'step_5' => $step5Data, // Step 5 data
                        'step_6' => $step6Data, // Step 6 data
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::getEventDataForEditing');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving event data for editing',
                    ],
                ];

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Events List
     *
     * Retrieves a paginated list of events for the authenticated Event Host with support for
     * status filtering (live, upcoming, completed, drafts), search functionality, and
     * comprehensive event information including revenue, attendees count, and ticket pricing.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getEventsList(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for filtering events by owner
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'status' => 'nullable|string|in:live,upcoming,completed,drafts', // Status filter must be one of the valid values
            'search' => 'nullable|string|max:255', // Search query (optional, max 255 characters)
            'page' => 'nullable|integer|min:1', // Page number (optional, minimum 1)
            'per_page' => 'nullable|integer|min:1|max:100', // Items per page (optional, 1-100)
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $eventModel = new EventModel;
                $eventCategoryModel = new EventCategoryModel;
                $venueModel = new VenueModel;
                $ticketModel = new TicketModel;
                $eventMediaModel = new EventMediaModel;

                // Get pagination parameters with defaults
                $page = isset($data['page']) && $data['page'] > 0 ? (int) $data['page'] : 1; // Default page 1
                $perPage = isset($data['per_page']) && $data['per_page'] > 0 && $data['per_page'] <= 100 ? (int) $data['per_page'] : 30; // Default 30, max 100

                // Build base query to get events for authenticated host user
                $query = EventModel::where('host_user_id', $hostUserId); // Filter by host user ID

                // Apply status filter if provided
                if (isset($data['status']) && ! empty($data['status'])) {
                    $status = $data['status']; // Get status filter value

                    // Apply status-specific filters based on status type
                    if ($status == 'live') {
                        // Live/Ongoing: Current date/time between start and end date/time, and published
                        $query->whereRaw("NOW() BETWEEN CONCAT(start_date, ' ', start_time) AND CONCAT(end_date, ' ', end_time)")
                            ->where('is_draft', false) // Must not be draft
                            ->where('is_published', true); // Must be published
                    } elseif ($status == 'upcoming') {
                        // Upcoming: Start date/time in future, and published
                        $query->whereRaw("CONCAT(start_date, ' ', start_time) > NOW()")
                            ->where('is_draft', false) // Must not be draft
                            ->where('is_published', true); // Must be published
                    } elseif ($status == 'completed') {
                        // Completed: End date/time has passed, and published
                        $query->whereRaw("CONCAT(end_date, ' ', end_time) < NOW()")
                            ->where('is_draft', false) // Must not be draft
                            ->where('is_published', true); // Must be published
                    } elseif ($status == 'drafts') {
                        // Drafts: is_draft = true and is_published = false
                        $query->where('is_draft', true) // Must be draft
                            ->where('is_published', false); // Must not be published
                    }
                }

                // Apply search filter if provided
                if (isset($data['search']) && ! empty($data['search'])) {
                    $search = $data['search']; // Get search query

                    // Search across event_title and description fields using LIKE queries
                    $query->where(function ($q) use ($search) {
                        $q->where('event_title', 'LIKE', "%{$search}%") // Search in event title
                            ->orWhere('description', 'LIKE', "%{$search}%"); // Search in description
                    });
                }

                // Add eager loading for relationships to optimize queries
                $query->with(['eventCategory', 'venue']); // Load category and venue relationships

                // Sort by start_date DESC (newest first), then by start_time DESC
                $query->orderBy('start_date', 'DESC')
                    ->orderBy('start_time', 'DESC');

                // Get total count before pagination for pagination metadata
                $totalRecords = $query->count(); // Total number of records matching filters

                // Apply pagination to query
                $events = $query->skip(($page - 1) * $perPage) // Skip records for previous pages
                    ->take($perPage) // Take only records for current page
                    ->get(); // Execute query and get results

                // Initialize array to store formatted event data
                $eventsArray = [];

                // Process each event to calculate additional data and format response
                foreach ($events as $event) {
                    // Get category name
                    $categoryName = ! empty($event->eventCategory) ? $event->eventCategory->category_name : null;

                    // Get venue information
                    $venueName = null; // Initialize venue name
                    $maximumAttendees = null; // Initialize maximum attendees
                    if (! empty($event->venue)) {
                        $venueName = $event->venue->venue_name; // Get venue name
                        $maximumAttendees = $event->venue->maximum_attendees; // Get maximum attendees
                    }

                    // Calculate total sold tickets and revenue from tickets table
                    $ticketQueryCondition = [
                        'event_id' => $event->event_id, // Filter by event ID
                    ];
                    $tickets = $ticketModel->get_tickets_list($ticketQueryCondition); // Get all tickets for this event

                    // Initialize calculation variables
                    $totalSoldTickets = 0; // Total number of tickets sold
                    $totalRevenue = 0; // Total revenue from ticket sales
                    $minTicketPrice = null; // Minimum ticket price
                    $maxTicketPrice = null; // Maximum ticket price

                    // Calculate revenue, sold tickets, and price range from tickets
                    foreach ($tickets as $ticket) {
                        $totalSoldTickets += $ticket->sold_quantity; // Add sold quantity to total
                        $ticketRevenue = $ticket->sold_quantity * $ticket->price; // Calculate revenue for this ticket type
                        $totalRevenue += $ticketRevenue; // Add to total revenue

                        // Track min and max ticket prices
                        if ($minTicketPrice === null || $ticket->price < $minTicketPrice) {
                            $minTicketPrice = $ticket->price; // Update minimum price
                        }
                        if ($maxTicketPrice === null || $ticket->price > $maxTicketPrice) {
                            $maxTicketPrice = $ticket->price; // Update maximum price
                        }
                    }

                    // Format ticket price display
                    $ticketPriceDisplay = 'No tickets'; // Default display text
                    if ($minTicketPrice !== null && $maxTicketPrice !== null) {
                        if ($minTicketPrice == $maxTicketPrice) {
                            // Single price if min and max are same
                            $ticketPriceDisplay = '$'.number_format($minTicketPrice, 2, '.', '').' per ticket';
                        } else {
                            // Price range if min and max are different
                            $ticketPriceDisplay = '$'.number_format($minTicketPrice, 2, '.', '').' - $'.number_format($maxTicketPrice, 2, '.', '');
                        }
                    }

                    // Format attendees display
                    $attendeesDisplay = '0 attendees'; // Default display text
                    if ($maximumAttendees !== null) {
                        $attendeesDisplay = $totalSoldTickets.'/'.$maximumAttendees.' attendees'; // Format as "X/Y attendees"
                    } elseif ($totalSoldTickets > 0) {
                        $attendeesDisplay = $totalSoldTickets.' attendees'; // Show sold count if no maximum
                    }

                    // Format revenue display
                    $revenueDisplay = '$0 Revenue'; // Default display text
                    if ($totalRevenue > 0) {
                        $revenueDisplay = '$'.number_format($totalRevenue, 2, '.', '').' Revenue'; // Format revenue with currency
                    }

                    // Calculate event status based on dates and draft/published flags
                    $eventStatus = 'draft'; // Default status
                    if ($event->is_draft == false && $event->is_published == true) {
                        // Event is published, calculate status based on dates using Carbon for reliable date/time comparisons
                        // Get current date and time using Carbon
                        $currentDateTime = Carbon::now(); // Get current date and time

                        // Parse start date and time using Carbon
                        // start_date is cast as 'date' (Y-m-d format), start_time is cast as 'datetime' (Y-m-d H:i:s format)
                        // We need to extract just the time portion from start_time and combine with start_date
                        $startDate = Carbon::parse($event->start_date)->format('Y-m-d'); // Format start date as Y-m-d string
                        $startTime = ! empty($event->start_time) ? Carbon::parse($event->start_time)->format('H:i:s') : '00:00:00'; // Extract time portion from start_time
                        $startDateTime = Carbon::parse($startDate.' '.$startTime); // Combine start date and time

                        // Parse end date and time using Carbon
                        // end_date is cast as 'date' (Y-m-d format), end_time is cast as 'datetime' (Y-m-d H:i:s format)
                        // Handle NULL end_time by defaulting to end of day (23:59:59) for proper comparison
                        $endDate = Carbon::parse($event->end_date)->format('Y-m-d'); // Format end date as Y-m-d string
                        $endTime = ! empty($event->end_time) ? Carbon::parse($event->end_time)->format('H:i:s') : '23:59:59'; // Extract time portion from end_time or default to end of day
                        $endDateTime = Carbon::parse($endDate.' '.$endTime); // Combine end date and time

                        // Calculate status with proper Carbon date/time comparisons
                        // This ensures consistent status calculation matching dashboard logic
                        if ($currentDateTime >= $startDateTime && $currentDateTime <= $endDateTime) {
                            $eventStatus = 'live'; // Event is currently live/ongoing
                        } elseif ($currentDateTime < $startDateTime) {
                            $eventStatus = 'upcoming'; // Event is upcoming
                        } elseif ($currentDateTime > $endDateTime) {
                            $eventStatus = 'completed'; // Event is completed
                        }
                    }

                    // Get event thumbnail (first thumbnail media)
                    $mediaQueryCondition = [
                        'event_id' => $event->event_id, // Filter by event ID
                        'media_type' => 'thumbnail', // Filter by media type
                    ];
                    $thumbnail = $eventMediaModel->get_event_media($mediaQueryCondition); // Get first thumbnail
                    $thumbnailPath = ! empty($thumbnail) ? $thumbnail->file_path : null; // Get file path or null

                    // Format event data for response
                    $eventData = [
                        'event_id' => $event->event_id, // Event ID
                        'event_title' => $event->event_title, // Event title
                        'description' => $event->description, // Event description
                        'status' => $eventStatus, // Calculated status (live, upcoming, completed, draft)
                        'category_name' => $categoryName, // Category name
                        'start_date' => date('d-m-Y', strtotime($event->start_date)), // Start date formatted as d-m-Y
                        'start_time' => date('H:i', strtotime($event->start_time)), // Start time formatted as H:i
                        'end_date' => date('d-m-Y', strtotime($event->end_date)), // End date formatted as d-m-Y
                        'end_time' => date('H:i', strtotime($event->end_time)), // End time formatted as H:i
                        'venue_name' => $venueName, // Venue name or null
                        'attendees' => [
                            'sold' => $totalSoldTickets, // Total sold tickets
                            'maximum' => $maximumAttendees, // Maximum attendees or null
                            'display' => $attendeesDisplay, // Formatted display string
                        ],
                        'ticket_price' => [
                            'min' => $minTicketPrice !== null ? (float) $minTicketPrice : null, // Minimum ticket price or null
                            'max' => $maxTicketPrice !== null ? (float) $maxTicketPrice : null, // Maximum ticket price or null
                            'display' => $ticketPriceDisplay, // Formatted display string
                        ],
                        'revenue' => [
                            'amount' => (float) $totalRevenue, // Total revenue amount
                            'display' => $revenueDisplay, // Formatted display string
                        ],
                        'thumbnail' => $thumbnailPath, // Thumbnail file path or null
                        'is_hidden_by_admin' => (bool) $event->is_hidden_by_admin, // Flag indicating if event is hidden by admin
                        'hidden_reason' => $event->is_hidden_by_admin ? $event->hidden_reason : null, // Hide reason if event is hidden
                        'hidden_at' => $event->is_hidden_by_admin && ! empty($event->hidden_at) ? date('d-m-Y H:i:s', strtotime($event->hidden_at)) : null, // Hide timestamp if event is hidden
                    ];

                    // Add formatted event data to array
                    $eventsArray[] = $eventData;
                }

                // Calculate pagination metadata
                $totalPages = $totalRecords > 0 ? (int) ceil($totalRecords / $perPage) : 0; // Calculate total pages
                $nextPage = $page < $totalPages ? $page + 1 : null; // Next page number or null
                $prevPage = $page > 1 ? $page - 1 : null; // Previous page number or null

                // Format pagination data according to user's specified format
                $paginationData = [
                    'total_records' => $totalRecords, // Total number of records
                    'current_page' => $page, // Current page number
                    'total_pages' => $totalPages, // Total number of pages
                    'next_page' => $nextPage, // Next page number or null
                    'prev_page' => $prevPage, // Previous page number or null
                ];

                // Return success response with events list and pagination
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Events retrieved successfully',
                        'events' => $eventsArray, // Array of formatted event data
                        'pagination' => $paginationData, // Pagination metadata
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::getEventsList');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving events',
                    ],
                ];
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Event Details
     *
     * Retrieves comprehensive event details for display on the Event View Details Page.
     * This API is optimized for performance using eager loading to minimize database queries.
     * Returns header information, summary cards, event overview content, and sidebar details.
     *
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getEventDetails(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for event ownership verification
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event ID must exist in database
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Load event with all relationships using eager loading to optimize performance
                // This single query loads all related data instead of making multiple queries
                $event = EventModel::with([
                    'eventCategory',                    // Category relationship (belongsTo)
                    'venue.country',                    // Venue with country (nested relationship)
                    'media',                            // All media files (hasMany)
                    'socialMedia',                      // Social media links (hasMany)
                    'tickets.ticketCategory',           // Tickets with categories (nested relationship)
                    'artists.socialMedia',              // Artists with social media (nested relationship)
                    'termsConditions',                  // Terms & conditions (hasOne)
                    'coupons',                           // All coupons (hasMany)
                ])->where('event_id', $data['event_id']) // Filter by event ID
                    ->where('host_user_id', $hostUserId)  // Filter by host user ID for ownership verification
                    ->first(); // Get single event record

                // Check if event exists and belongs to user
                if (empty($event) || $event == null) {
                    // Event not found or doesn't belong to user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'Event not found or you do not have permission to view it',
                        ],
                    ];

                    // Return JSON response with 404 Not Found status code
                    return response()->json($result, 404);
                }

                // Calculate event status based on dates and draft/published flags
                $eventStatus = 'draft'; // Default status
                if ($event->is_draft == false && $event->is_published == true) {
                    // Event is published, calculate status based on dates using Carbon for reliable date/time comparisons
                    // Get current date and time using Carbon
                    $currentDateTime = Carbon::now(); // Get current date and time

                    // Parse start date and time using Carbon
                    // start_date is cast as 'date' (Y-m-d format), start_time is cast as 'datetime' (Y-m-d H:i:s format)
                    // We need to extract just the time portion from start_time and combine with start_date
                    $startDate = Carbon::parse($event->start_date)->format('Y-m-d'); // Format start date as Y-m-d string
                    $startTime = ! empty($event->start_time) ? Carbon::parse($event->start_time)->format('H:i:s') : '00:00:00'; // Extract time portion from start_time
                    $startDateTime = Carbon::parse($startDate.' '.$startTime); // Combine start date and time

                    // Parse end date and time using Carbon
                    // end_date is cast as 'date' (Y-m-d format), end_time is cast as 'datetime' (Y-m-d H:i:s format)
                    // Handle NULL end_time by defaulting to end of day (23:59:59) for proper comparison
                    $endDate = Carbon::parse($event->end_date)->format('Y-m-d'); // Format end date as Y-m-d string
                    $endTime = ! empty($event->end_time) ? Carbon::parse($event->end_time)->format('H:i:s') : '23:59:59'; // Extract time portion from end_time or default to end of day
                    $endDateTime = Carbon::parse($endDate.' '.$endTime); // Combine end date and time

                    // Calculate status with proper Carbon date/time comparisons
                    // This ensures consistent status calculation matching dashboard and event listing logic
                    if ($currentDateTime >= $startDateTime && $currentDateTime <= $endDateTime) {
                        $eventStatus = 'live'; // Event is currently live/ongoing
                    } elseif ($currentDateTime < $startDateTime) {
                        $eventStatus = 'upcoming'; // Event is upcoming
                    } elseif ($currentDateTime > $endDateTime) {
                        $eventStatus = 'completed'; // Event is completed
                    }
                }

                // Format header information for response
                $headerData = [
                    'event_id' => $event->event_id, // Event ID
                    'event_title' => $event->event_title, // Event title
                    'status' => $eventStatus, // Calculated status (live, upcoming, completed, draft)
                    'category_name' => ! empty($event->eventCategory) ? $event->eventCategory->category_name : null, // Category name or null
                    'created_date' => date('d-m-Y', strtotime($event->created_at)), // Created date formatted as d-m-Y
                    'is_hidden_by_admin' => (bool) $event->is_hidden_by_admin, // Flag indicating if event is hidden by admin
                    'hidden_reason' => $event->is_hidden_by_admin ? $event->hidden_reason : null, // Hide reason if event is hidden
                    'hidden_at' => $event->is_hidden_by_admin && ! empty($event->hidden_at) ? date('d-m-Y H:i:s', strtotime($event->hidden_at)) : null, // Hide timestamp if event is hidden
                ];

                // Calculate summary cards metrics from loaded relationships
                // Registered Count: Sum of sold_quantity from tickets
                $registeredCount = $event->tickets->sum('sold_quantity'); // Sum sold quantities from tickets collection

                // Revenue: Sum of (sold_quantity * price) from tickets
                $totalRevenue = $event->tickets->sum(function ($ticket) {
                    return $ticket->sold_quantity * $ticket->price; // Calculate revenue per ticket type
                });

                // Ticket Types Count: Count of tickets
                $ticketTypesCount = $event->tickets->count(); // Count tickets in collection

                // Active Coupons Count: Filter coupons by validity and count
                // Use Carbon for proper date comparison to ensure accurate filtering
                $currentDate = Carbon::now()->format('Y-m-d'); // Get current date in Y-m-d format for comparison
                $activeCouponsCount = $event->coupons->filter(function ($coupon) use ($currentDate) {
                    // Check if coupon is valid (within date range and not fully used)
                    // Use Carbon for proper date comparison to handle date strings correctly
                    $startDate = Carbon::parse($coupon->start_date)->format('Y-m-d'); // Parse and format start date
                    $isStartValid = $startDate <= $currentDate; // Check if start date has passed or is today

                    // Check end date (optional field)
                    $isEndValid = true; // Default to valid if no end date
                    if (! empty($coupon->end_date)) {
                        $endDate = Carbon::parse($coupon->end_date)->format('Y-m-d'); // Parse and format end date
                        $isEndValid = $endDate >= $currentDate; // Check if end date is today or in future
                    }

                    $isValidDate = $isStartValid && $isEndValid; // Both conditions must be true
                    $isNotFullyUsed = $coupon->times_used < $coupon->max_times_applicable; // Check usage limit

                    return $isValidDate && $isNotFullyUsed; // Return true if both conditions met
                })->count(); // Count active coupons

                // Format summary cards data for response
                $summaryCardsData = [
                    'registered_count' => (int) $registeredCount, // Total registered attendees
                    'revenue' => (float) $totalRevenue, // Total revenue
                    'ticket_types' => (int) $ticketTypesCount, // Number of ticket types
                    'active_coupons' => (int) $activeCouponsCount, // Number of active coupons
                ];

                // Format event overview data
                // Event Description and Key Highlights
                $eventOverviewData = [
                    'description' => $event->description, // Full description with rich text formatting
                    'ticket_info' => $event->ticket_info, // Ticket info (rich text)
                    'key_highlights' => $event->key_highlights, // "What to expect:" section (rich text)
                ];

                // Group event media by type for response
                $eventMedia = [
                    'thumbnail' => [], // Thumbnail media array
                    'banner' => [], // Banner media array
                    'flyer' => [], // Flyer media array
                    'video' => [], // Video media array
                ];

                // Loop through all media and group by type
                foreach ($event->media as $media) {
                    // Format media data excluding timestamps
                    $mediaData = [
                        'event_media_id' => $media->event_media_id, // Media ID
                        'media_type' => $media->media_type, // Media type
                        'file_path' => $media->file_path, // File path
                        'file_name' => $media->file_name, // File name
                        'file_size' => $media->file_size, // File size
                    ];

                    // Add video_duration if media type is video
                    if ($media->media_type == 'video' && ! empty($media->video_duration)) {
                        $mediaData['video_duration'] = $media->video_duration; // Video duration
                    }

                    // Add to appropriate media type array
                    if ($media->media_type == 'thumbnail') {
                        $eventMedia['thumbnail'][] = $mediaData; // Add to thumbnail array
                    } elseif ($media->media_type == 'banner') {
                        $eventMedia['banner'][] = $mediaData; // Add to banner array
                    } elseif ($media->media_type == 'flyer') {
                        $eventMedia['flyer'][] = $mediaData; // Add to flyer array
                    } elseif ($media->media_type == 'video') {
                        $eventMedia['video'][] = $mediaData; // Add to video array
                    }
                }

                // Format tickets array with category information and revenue
                $ticketsArray = [];
                foreach ($event->tickets as $ticket) {
                    // Get category name from eager loaded relationship
                    $categoryName = ! empty($ticket->ticketCategory) ? $ticket->ticketCategory->category_name : null;

                    // Calculate revenue for this ticket type
                    $ticketRevenue = $ticket->sold_quantity * $ticket->price;

                    // Format ticket data for response excluding timestamps
                    $ticketsArray[] = [
                        'ticket_id' => $ticket->ticket_id, // Ticket ID
                        'category_name' => $categoryName, // Category name
                        'description' => $ticket->description, // Description/tag
                        'ticket_info' => $ticket->ticket_info, // Ticket info (rich text)
                        'sold_quantity' => $ticket->sold_quantity, // Sold quantity
                        'total_available' => $ticket->total_available, // Total available
                        'price' => (string) $ticket->price, // Price as string
                        'revenue' => (string) $ticketRevenue, // Revenue for this ticket type as string
                    ];
                }

                // Format artists array with social media links
                $artistsArray = [];
                foreach ($event->artists as $artist) {
                    // Format social media links for this artist
                    $artistSocialMediaArray = [];
                    foreach ($artist->socialMedia as $socialMedia) {
                        // Format social media data excluding timestamps
                        $artistSocialMediaArray[] = [
                            'artist_social_media_id' => $socialMedia->artist_social_media_id, // Social media ID
                            'platform' => $socialMedia->platform, // Platform name
                            'url' => $socialMedia->url, // Social media URL
                        ];
                    }

                    // Format artist data for response excluding timestamps
                    $artistsArray[] = [
                        'event_artist_id' => $artist->event_artist_id, // Artist ID
                        'artist_name' => $artist->artist_name, // Artist name
                        'artist_image' => $artist->artist_image, // Artist image path or null
                        'social_media' => $artistSocialMediaArray, // Social media links array
                    ];
                }

                // Format terms & conditions data
                $termsConditionsData = ! empty($event->termsConditions) ? $event->termsConditions->terms_content : null; // Terms content or null

                // Add tickets and total revenue to event overview
                $eventOverviewData['media'] = $eventMedia; // Event media grouped by type
                $eventOverviewData['tickets'] = $ticketsArray; // Tickets array
                $eventOverviewData['total_revenue'] = (string) $totalRevenue; // Total revenue as string
                $eventOverviewData['artists'] = $artistsArray; // Artists array
                $eventOverviewData['terms_conditions'] = $termsConditionsData; // Terms & conditions or null

                // Format sidebar data
                // Event Details
                $sidebarEventDetails = [
                    'start_date' => date('d-m-Y', strtotime($event->start_date)), // Start date formatted as d-m-Y
                    'start_time' => date('H:i', strtotime($event->start_time)), // Start time formatted as H:i
                    'end_date' => date('d-m-Y', strtotime($event->end_date)), // End date formatted as d-m-Y
                    'end_time' => date('H:i', strtotime($event->end_time)), // End time formatted as H:i
                ];

                // Format venue details
                $venueData = null; // Initialize as null
                if (! empty($event->venue)) {
                    // Venue exists, format venue data
                    $countryName = ! empty($event->venue->country) ? $event->venue->country->name : null; // Get country name from relationship

                    $venueData = [
                        'venue_name' => $event->venue->venue_name, // Venue name
                        'venue_address' => $event->venue->venue_address, // Street address
                        'city' => $event->venue->city, // City
                        'state_province' => $event->venue->state_province, // State/Province
                        'postal_code' => $event->venue->postal_code, // ZIP/Postal code
                        'country_name' => $countryName, // Country name or null
                        'latitude' => (float) $event->venue->latitude, // Latitude as float
                        'longitude' => (float) $event->venue->longitude, // Longitude as float
                    ];
                }

                // Format social media links for sidebar
                $sidebarSocialMediaArray = [];
                foreach ($event->socialMedia as $socialMedia) {
                    // Format social media data excluding timestamps
                    $sidebarSocialMediaArray[] = [
                        'event_social_media_id' => $socialMedia->event_social_media_id, // Social media ID
                        'platform' => $socialMedia->platform, // Platform name
                        'url' => $socialMedia->url, // Social media URL
                    ];
                }

                // Format active coupons for sidebar
                $activeCouponsArray = [];
                foreach ($event->coupons as $coupon) {
                    // Check if coupon is active (valid date and not fully used)
                    // Use Carbon for proper date comparison to handle date strings correctly
                    $startDate = Carbon::parse($coupon->start_date)->format('Y-m-d'); // Parse and format start date
                    $isStartValid = $startDate <= $currentDate; // Check if start date has passed or is today

                    // Check end date (optional field)
                    $isEndValid = true; // Default to valid if no end date
                    if (! empty($coupon->end_date)) {
                        $endDate = Carbon::parse($coupon->end_date)->format('Y-m-d'); // Parse and format end date
                        $isEndValid = $endDate >= $currentDate; // Check if end date is today or in future
                    }

                    $isValidDate = $isStartValid && $isEndValid; // Both conditions must be true
                    $isNotFullyUsed = $coupon->times_used < $coupon->max_times_applicable; // Check usage limit

                    if ($isValidDate && $isNotFullyUsed) {
                        // Coupon is active, format discount display
                        $discountDisplay = ''; // Initialize discount display
                        if ($coupon->discount_type == 'percentage') {
                            // Percentage discount
                            $discountDisplay = number_format($coupon->discount_percent, 0).'% OFF'; // Format as "20% OFF"
                        } elseif ($coupon->discount_type == 'flat') {
                            // Flat discount
                            $discountDisplay = '$'.number_format($coupon->flat_discount_amount, 2, '.', '').' OFF'; // Format as "$50.00 OFF"
                        }

                        // Format active coupon data for response excluding timestamps
                        // Use Carbon to properly format dates from Y-m-d (database) to d-m-Y (response)
                        $activeCouponsArray[] = [
                            'coupon_id' => $coupon->coupon_id, // Coupon ID
                            'coupon_code' => $coupon->coupon_code, // Coupon code
                            'discount_type' => $coupon->discount_type, // Discount type (percentage or flat)
                            'discount_display' => $discountDisplay, // Formatted discount display
                            'times_used' => $coupon->times_used, // Times used
                            'max_times_applicable' => $coupon->max_times_applicable, // Max times applicable
                            'valid_until' => ! empty($coupon->end_date) ? Carbon::parse($coupon->end_date)->format('d-m-Y') : null, // Valid until date formatted as d-m-Y or null
                        ];
                    }
                }

                // Format sidebar data
                $sidebarData = [
                    'event_details' => $sidebarEventDetails, // Event details (dates and times)
                    'venue' => $venueData, // Venue details or null
                    'social_media' => $sidebarSocialMediaArray, // Social media links array
                    'active_coupons' => $activeCouponsArray, // Active coupons array
                ];

                // Build complete event details response
                $eventDetailsData = [
                    'header' => $headerData, // Header information
                    'summary_cards' => $summaryCardsData, // Summary cards metrics
                    'event_overview' => $eventOverviewData, // Event overview content
                    'sidebar' => $sidebarData, // Sidebar content
                ];

                // Return success response with event details
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Event details retrieved successfully',
                        'event_details' => $eventDetailsData, // Complete event details
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::getEventDetails');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving event details',
                    ],
                ];
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Attendees List
     *
     * Retrieves a paginated list of all attendees (End Users who have purchased tickets) across all events
     * created by the authenticated Event Host. The API displays attendee information, total transactions,
     * total spend, last transaction date, and a list of events each attendee has attended with ticket
     * counts and spend per event. Supports search, date range filtering, event filtering, and sorting.
     *
     * @return string JSON encoded response
     */
    public function getAttendeesList(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get host_user_id from authenticated user for filtering events by owner
        $hostUserId = $authenticatedUser->host_user_id;

        // Define validation rules for the request fields
        $rules = [
            'search' => 'nullable|string|max:255', // Search query for name, email, contact (optional, max 255 characters)
            'start_date' => 'nullable|date_format:d-m-Y', // Start date for date range filter (format: d-m-Y)
            'end_date' => 'nullable|date_format:d-m-Y', // End date for date range filter (format: d-m-Y)
            'events_filter' => 'nullable|string|max:255', // Free text search for event titles (optional, max 255 characters)
            'event_id' => 'nullable|integer|exists:events,event_id', // Optional event ID filter to get attendees for specific event
            'sort_by' => 'nullable|string|in:last_txn_date,total_spend,total_txns', // Sort option (optional, must be one of valid values)
            'page' => 'nullable|integer|min:1', // Page number (optional, minimum 1)
            'per_page' => 'nullable|integer|min:1|max:100', // Items per page (optional, 1-100)
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $userModel = new UserModel;
                $orderModel = new OrderModel;
                $eventModel = new EventModel;

                // Validate event ownership if event_id is provided
                // This ensures the event belongs to the authenticated host user for security
                if (isset($data['event_id']) && ! empty($data['event_id'])) {
                    // Prepare query condition to check event ownership
                    $eventQueryCondition = [
                        'event_id' => (int) $data['event_id'], // Event ID from request
                        'host_user_id' => $hostUserId, // Must belong to authenticated host user
                    ];

                    // Check if event exists and belongs to authenticated host user
                    $event = $eventModel->get_event($eventQueryCondition);

                    // If event not found or doesn't belong to host user, return error
                    if (empty($event) || $event == null) {
                        // Event not found or doesn't belong to host user, return error
                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E404',
                                'error_message' => 'Event not found or you do not have permission to access this event',
                            ],
                        ];

                        // Return JSON response with 404 Not Found status code
                        return response()->json($result, 404);
                    }
                }

                // Get pagination parameters with defaults
                $page = isset($data['page']) && $data['page'] > 0 ? (int) $data['page'] : 1; // Default page 1
                $perPage = isset($data['per_page']) && $data['per_page'] > 0 && $data['per_page'] <= 100 ? (int) $data['per_page'] : 10; // Default 10, max 100

                // Prepare filters array for model method
                $filters = []; // Initialize filters array

                // Add search filter if provided
                if (isset($data['search']) && ! empty($data['search'])) {
                    $filters['search'] = $data['search']; // Add search query to filters
                }

                // Convert and add date range filters if provided
                if (isset($data['start_date']) && ! empty($data['start_date'])) {
                    // Convert start_date from d-m-Y to Y-m-d format for database
                    $startDate = \DateTime::createFromFormat('d-m-Y', $data['start_date']); // Parse date
                    if ($startDate) {
                        $filters['start_date'] = $startDate->format('Y-m-d'); // Format as Y-m-d and add to filters
                    }
                }

                if (isset($data['end_date']) && ! empty($data['end_date'])) {
                    // Convert end_date from d-m-Y to Y-m-d format for database
                    $endDate = \DateTime::createFromFormat('d-m-Y', $data['end_date']); // Parse date
                    if ($endDate) {
                        $endDateFormatted = $endDate->format('Y-m-d'); // Format as Y-m-d
                        $endDateFormatted .= ' 23:59:59'; // Add end of day time for inclusive range
                        $filters['end_date'] = $endDateFormatted; // Add to filters
                    }
                }

                // Add events filter if provided
                if (isset($data['events_filter']) && ! empty($data['events_filter'])) {
                    $filters['events_filter'] = $data['events_filter']; // Add events filter query to filters
                }

                // Add event_id filter if provided
                // This filters attendees to only show those who purchased tickets for the specific event
                if (isset($data['event_id']) && ! empty($data['event_id'])) {
                    $filters['event_id'] = (int) $data['event_id']; // Add event ID to filters as integer
                }

                // Get sort_by parameter with default
                $sortBy = isset($data['sort_by']) && ! empty($data['sort_by']) ? $data['sort_by'] : 'last_txn_date'; // Default to last_txn_date

                // Call UserModel method to get attendees list with aggregates
                $attendeesResult = $userModel->get_attendees_list_with_aggregates($hostUserId, $filters, $sortBy, $page, $perPage);

                // Extract attendees collection and total records from result
                $attendees = $attendeesResult->attendees; // Get attendees collection
                $totalRecords = $attendeesResult->total_records; // Get total records count

                // Initialize array to store formatted attendee data
                $attendeesArray = [];

                // Get user IDs from current page attendees for events query
                $userIds = $attendees->pluck('user_id')->toArray(); // Extract user IDs

                // Call OrderModel method to get events per users for current page attendees
                $eventsFilter = isset($filters['events_filter']) ? $filters['events_filter'] : null; // Get events filter or null
                $eventId = isset($filters['event_id']) ? $filters['event_id'] : null; // Get event_id filter or null
                $eventsData = $orderModel->get_events_per_users($hostUserId, $userIds, $eventsFilter, $eventId); // Get events data from model with event_id filter

                // Group events by user_id for easy lookup
                $eventsByUserId = []; // Initialize array to store events grouped by user
                foreach ($eventsData as $eventData) {
                    $userId = $eventData->user_id; // Get user ID

                    // Initialize array for this user if not exists
                    if (! isset($eventsByUserId[$userId])) {
                        $eventsByUserId[$userId] = []; // Initialize empty array
                    }

                    // Add event data to user's events array
                    $ticketSubtotal = (float) $eventData->ticket_subtotal; // Base ticket cost for this event
                    $allocatedCouponDiscount = (float) $eventData->coupon_discount_amount; // Coupon discount share allocated to this event
                    $eventsByUserId[$userId][] = [
                        'event_id' => (int) $eventData->event_id, // Event ID as integer
                        'event_title' => $eventData->event_title, // Event title
                        'tickets_purchased' => (int) $eventData->tickets_purchased, // Tickets purchased as integer
                        'event_spend' => $ticketSubtotal - $allocatedCouponDiscount, // Final amount paid for this event
                    ];
                }

                // Format attendee data for response
                foreach ($attendees as $attendee) {
                    // Get user ID
                    $userId = $attendee->user_id;

                    // Get events list for this user (or empty array if no events)
                    $eventsList = isset($eventsByUserId[$userId]) ? $eventsByUserId[$userId] : [];

                    // Format last transaction date as d-m-Y H:i:s
                    $lastTxnFormatted = null; // Default to null
                    if (! empty($attendee->last_txn_date)) {
                        $lastTxnFormatted = date('d-m-Y H:i:s', strtotime($attendee->last_txn_date)); // Format as d-m-Y H:i:s
                    }

                    // Format attendee data for response
                    $attendeeData = [
                        'user_id' => (int) $userId, // User ID as integer
                        'name' => $attendee->full_name, // User full name
                        'email' => $attendee->email, // User email
                        'contact' => $attendee->contact_number, // User contact number
                        'total_txns' => (int) $attendee->total_txns, // Total transactions as integer
                        'total_spend' => (float) $attendee->total_spend, // Total spend as float
                        'last_txn' => $lastTxnFormatted, // Last transaction date formatted as d-m-Y H:i:s
                        'events' => $eventsList, // List of events attended with ticket counts and spend
                    ];

                    // Add formatted attendee data to array
                    $attendeesArray[] = $attendeeData;
                }

                // Calculate pagination metadata
                $totalPages = $totalRecords > 0 ? (int) ceil($totalRecords / $perPage) : 0; // Calculate total pages
                $nextPage = $page < $totalPages ? $page + 1 : null; // Next page number or null
                $prevPage = $page > 1 ? $page - 1 : null; // Previous page number or null

                // Format pagination data according to standard format
                $paginationData = [
                    'total_records' => $totalRecords, // Total number of records
                    'current_page' => $page, // Current page number
                    'total_pages' => $totalPages, // Total number of pages
                    'next_page' => $nextPage, // Next page number or null
                    'prev_page' => $prevPage, // Previous page number or null
                ];

                // Return success response with attendees list and pagination
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Attendees retrieved successfully',
                        'attendees' => $attendeesArray, // Array of formatted attendee data
                        'pagination' => $paginationData, // Pagination metadata
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in EventController::getAttendeesList');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving attendees',
                    ],
                ];
            }
        } else {
            // Validation failed, return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Convert PHP ini size value (e.g., "50M", "2M", "128K") to bytes
     *
     * Helper method to convert PHP configuration size values to bytes for comparison.
     * Supports formats: K (kilobytes), M (megabytes), G (gigabytes)
     *
     * @param  string  $size  PHP ini size value (e.g., "50M", "2M", "128K")
     * @return int Size in bytes
     */
    private function convertToBytes($size)
    {
        // Remove whitespace and convert to uppercase
        $size = trim(strtoupper($size));

        // Extract number and unit
        $number = (int) $size;
        $unit = preg_replace('/[^A-Z]/', '', $size);

        // Convert based on unit
        switch ($unit) {
            case 'G':
                // Gigabytes to bytes
                return $number * 1024 * 1024 * 1024;
            case 'M':
                // Megabytes to bytes
                return $number * 1024 * 1024;
            case 'K':
                // Kilobytes to bytes
                return $number * 1024;
            default:
                // Assume bytes if no unit specified
                return (int) $size;
        }
    }

    /**
     * Get human-readable error message for PHP file upload error codes
     *
     * Translates PHP upload error codes (UPLOAD_ERR_*) into user-friendly error messages
     * to help identify the exact reason for upload failures.
     *
     * @param  int  $errorCode  PHP upload error code
     * @return string Human-readable error message
     */
    private function getUploadErrorMessage($errorCode)
    {
        // Map PHP upload error codes to descriptive error messages
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'The uploaded file exceeds the upload_max_filesize directive in php.ini. Maximum allowed size: '.ini_get('upload_max_filesize'),
            UPLOAD_ERR_FORM_SIZE => 'The uploaded file exceeds the MAX_FILE_SIZE directive that was specified in the HTML form. Maximum allowed size: 50MB',
            UPLOAD_ERR_PARTIAL => 'The uploaded file was only partially uploaded. Please try uploading again.',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded. Please select a video file.',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing a temporary folder on the server. Please contact the administrator.',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk. Please check server permissions or contact the administrator.',
            UPLOAD_ERR_EXTENSION => 'A PHP extension stopped the file upload. Please contact the administrator.',
        ];

        // Return specific error message if code exists, otherwise generic message
        if (isset($errorMessages[$errorCode])) {
            return $errorMessages[$errorCode];
        }

        // Return generic error message for unknown error codes
        return 'File upload failed with error code: '.$errorCode.'. Please check file size, format, and try again.';
    }
}
