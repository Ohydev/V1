<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\ArtistSocialMediaModel;
use App\Models\BusinessModel;
use App\Models\CmsPageModel;
use App\Models\CountryModel;
use App\Models\CouponModel;
use App\Models\EventArtistModel;
use App\Models\EventMediaModel;
use App\Models\EventModel;
use App\Models\EventSocialMediaModel;
use App\Models\EventTermsConditionModel;
use App\Models\HostUserModel;
use App\Models\OrderModel;
use App\Models\SuperAdminModel;
use App\Models\SupportRequestModel;
use App\Models\TicketCategoryModel;
use App\Models\TicketModel;
use App\Models\UserFeedbackModel;
use App\Models\UserModel;
use App\Models\UserReportModel;
use App\Models\VenueModel;
use App\Services\PlatformFeeService;
use App\Services\StripeService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Laravel\Sanctum\PersonalAccessToken;

class SuperAdminController extends Controller
{
    /**
     * Get authenticated Super Admin profile details.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminProfile(Request $request)
    {
        // Initialize response container
        $result = []; // Holds final success/error payload

        // Retrieve authenticated user provided by AuthenticateSuperAdmin middleware
        $authenticatedSuperAdmin = $request->user(); // Should be SuperAdminModel instance

        // Safety check to ensure middleware injected user context
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            // Return authentication error if user context missing
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E003', // Authentication error code
                    'error_message' => 'Authentication required', // Message for client
                ],
            ];

            // Respond with 401 Unauthorized immediately
            return response()->json($result, 401);
        }

        // Build profile info array without extra DB query using authenticated model instance
        $superAdminInfo = [
            'super_admin_id' => $authenticatedSuperAdmin->super_admin_id, // Unique identifier
            'email' => $authenticatedSuperAdmin->email, // Read-only email
            'first_name' => $authenticatedSuperAdmin->first_name, // First name
            'last_name' => $authenticatedSuperAdmin->last_name, // Last name
            'phone_number' => $authenticatedSuperAdmin->phone_number, // Phone number (nullable)
            'profile_image' => $authenticatedSuperAdmin->profile_image, // Stored profile image path (nullable)
        ];

        // Prepare success response payload
        $result = [
            'success' => true, // Operation successful
            'data' => [
                'message' => 'Profile information retrieved successfully', // Confirmation message
                'super_admin_info' => $superAdminInfo, // Profile data payload
            ],
        ];

        // Return JSON response with profile data
        return response()->json($result);
    }

    /**
     * Super Admin Login API
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function superAdminLogin(Request $request)
    {
        // Initialize result array to store response payload
        $result = []; // Result array will hold final response structure

        // Get all request data from the incoming HTTP request
        $data = $request->all(); // Retrieve entire JSON payload for validation and processing

        // Define validation rules for the login request fields
        $rules = [
            'email' => 'required|email', // Email address must be present and valid
            'password' => 'required', // Password is mandatory
            'remember_me' => 'nullable', // Remember me flag is optional (boolean or string)
        ];

        // Perform validation using Laravel Validator with the defined rules
        $validation = Validator::make($data, $rules); // Create validator instance to check payload

        // Check if validation passes before processing authentication logic
        if (! $validation->fails()) {
            // Validation succeeded, proceed with authentication flow
            try {
                // Initialize SuperAdminModel to interact with super_admins table
                $superAdminModel = new SuperAdminModel; // Model provides DB access helpers

                // Prepare query condition to find super admin by email
                $queryCondition = [
                    'email' => $data['email'], // Match record using email supplied by request
                ];

                // Fetch super admin record from database using model helper
                $superAdmin = $superAdminModel->get_super_admin($queryCondition); // Retrieve first matching record

                // Check if super admin exists; if not, return authentication error
                if (empty($superAdmin) || $superAdmin == null) {
                    // Super admin not found, respond with generic authentication error
                    $result = [
                        'success' => false, // Indicate failure
                        'error' => [
                            'error_code' => 'E003', // Authentication error code
                            'error_message' => 'Invalid email or password', // Generic message for security
                        ],
                    ];

                    // Return 401 Unauthorized response for missing account
                    return response()->json($result, 401); // Stop execution after response
                }

                // Verify provided password against stored hash using Laravel Hash facade
                $passwordValid = Hash::check($data['password'], $superAdmin->password); // Compare plaintext with hash

                // Check if password validation failed
                if (! $passwordValid) {
                    // Password incorrect, respond with same generic authentication error
                    $result = [
                        'success' => false, // Indicate failure
                        'error' => [
                            'error_code' => 'E003', // Authentication error
                            'error_message' => 'Invalid email or password', // Same message for security
                        ],
                    ];

                    // Return 401 Unauthorized response for invalid password
                    return response()->json($result, 401); // Stop execution after response
                }

                // Determine remember me preference (supports multiple truthy representations)
                $rememberMe = false; // Default to false unless explicitly set
                if (isset($data['remember_me'])) {
                    // Evaluate remember_me value for truthy representations
                    $rememberMe = ($data['remember_me'] === true || $data['remember_me'] === 'true' || $data['remember_me'] === '1' || $data['remember_me'] === 1);
                }

                // Use Carbon to compute token expiration timestamp based on remember me flag
                $tokenExpiry = $rememberMe ? Carbon::now()->addDays(30) : Carbon::now()->addHour(); // Extended vs regular sessions

                // Generate Sanctum token with calculated expiration and full abilities
                $token = $superAdmin->createToken('super-admin-token', ['*'], $tokenExpiry)->plainTextToken; // Create token and get plain text value

                // Build super admin info array for response payload
                $superAdminInfo = [
                    'super_admin_id' => $superAdmin->super_admin_id, // Unique identifier
                    'email' => $superAdmin->email, // Login email
                    'first_name' => $superAdmin->first_name, // First name
                    'last_name' => $superAdmin->last_name, // Last name
                    'phone_number' => $superAdmin->phone_number, // Phone number (nullable)
                    'profile_image' => $superAdmin->profile_image, // Profile image path (nullable)
                ];

                // Prepare success response structure with message, info, and token
                $result = [
                    'success' => true, // Indicate successful authentication
                    'data' => [
                        'message' => 'Logged In Successfully', // Success message
                        'super_admin_info' => $superAdminInfo, // Super admin details
                        'token' => $token, // Sanctum token to be used in future requests
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in SuperAdminController::superAdminLogin'); // Log context
                Log::info($e->getMessage()); // Log message
                Log::info($e); // Log stack trace

                // Prepare generic server error response payload
                $result = [
                    'success' => false, // Indicate failure
                    'error' => [
                        'error_code' => 'E002', // Server error code
                        'error_message' => 'An error occurred while processing your request', // Generic error message
                    ],
                ];

                // Return 500 Internal Server Error response with payload
                return response()->json($result, 500); // Stop execution after response
            }
        } else {
            // Validation failed, prepare validation error response
            $result = [
                'success' => false, // Indicate failure
                'error' => [
                    'error_code' => 'E001', // Validation error code
                    'error_message' => $validation->errors(), // Return validation messages
                ],
            ];

            // Return 400 Bad Request response due to validation failure
            return response()->json($result, 400); // Stop execution after response
        }

        // Return success response (200 OK by default) when everything succeeds
        return response()->json($result); // Send final response payload to client
    }

    /**
     * Update authenticated Super Admin profile details (email is read-only).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateSuperAdminProfile(Request $request)
    {
        // Initialize result container for response payload
        $result = []; // Will hold success/error structure

        // Retrieve authenticated Super Admin injected by middleware
        $authenticatedSuperAdmin = $request->user(); // Instance of SuperAdminModel

        // Verify authentication context exists
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            // Return authentication required error if context missing
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        // Gather request payload for validation
        $data = $request->all(); // Retrieve all posted fields

        // Define validation rules for editable profile fields
        $rules = [
            'first_name' => 'required|string|max:255', // First name must be provided
            'last_name' => 'required|string|max:255', // Last name must be provided
            'phone_number' => 'nullable|string|max:255', // Phone number optional
            'profile_image' => 'nullable|image|mimes:jpeg,jpg,png,gif|max:2048', // Profile image optional with size/type limits
        ];

        // Execute validation using Laravel Validator
        $validation = Validator::make($data, $rules); // Validator instance for request data

        // Continue only if validation passes
        if (! $validation->fails()) {
            try {
                // Initialize model for update operations
                $superAdminModel = new SuperAdminModel; // Provides DB helper methods

                // Build query condition targeting current super admin
                $queryCondition = [
                    'super_admin_id' => $authenticatedSuperAdmin->super_admin_id, // Unique identifier for update
                ];

                // Build array of columns to update
                $updateData = [
                    'first_name' => $data['first_name'], // Update first name
                    'last_name' => $data['last_name'], // Update last name
                ];

                // Include phone_number if key supplied (even null) to allow clearing value
                if (array_key_exists('phone_number', $data)) {
                    $updateData['phone_number'] = $data['phone_number']; // Set phone number
                }

                // Handle profile image upload when file provided
                if ($request->hasFile('profile_image')) {
                    // Retrieve uploaded file instance
                    $profileImage = $request->file('profile_image'); // Uploaded image

                    // Delete old profile image if stored previously
                    $existingImagePath = $authenticatedSuperAdmin->profile_image; // Existing file path
                    if (! empty($existingImagePath) && Storage::disk('public')->exists($existingImagePath)) {
                        Storage::disk('public')->delete($existingImagePath); // Remove old image to free space
                    }

                    // Prepare directory for storing new image
                    $directory = "super_admins/{$authenticatedSuperAdmin->super_admin_id}"; // Storage path per super admin

                    // Generate unique filename using timestamp
                    $timestamp = time(); // Current timestamp
                    $extension = $profileImage->getClientOriginalExtension(); // Original file extension
                    $filename = "profile_image_{$timestamp}.{$extension}"; // Compose filename

                    // Store file in public disk and capture stored path
                    $storedPath = $profileImage->storeAs($directory, $filename, 'public'); // Save file

                    // Attach stored path to update data
                    $updateData['profile_image'] = $storedPath; // Persist path to DB
                }

                // Perform update via model helper (returns affected rows)
                $updateResult = $superAdminModel->update_super_admin_data($queryCondition, $updateData);

                // Verify that update affected at least one row
                if ($updateResult > 0) {
                    // Refresh authenticated model to reflect latest DB values
                    $authenticatedSuperAdmin->refresh(); // Reload from database

                    // Build updated profile info for response payload
                    $superAdminInfo = [
                        'super_admin_id' => $authenticatedSuperAdmin->super_admin_id,
                        'email' => $authenticatedSuperAdmin->email, // Email remains read-only
                        'first_name' => $authenticatedSuperAdmin->first_name,
                        'last_name' => $authenticatedSuperAdmin->last_name,
                        'phone_number' => $authenticatedSuperAdmin->phone_number,
                        'profile_image' => $authenticatedSuperAdmin->profile_image,
                    ];

                    // Prepare success response payload
                    $result = [
                        'success' => true,
                        'data' => [
                            'message' => 'Profile updated successfully',
                            'super_admin_info' => $superAdminInfo,
                        ],
                    ];
                } else {
                    // No rows updated, return server error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E002',
                            'error_message' => 'Failed to update profile',
                        ],
                    ];

                    return response()->json($result, 500);
                }
            } catch (\Exception $e) {
                // Log exception details for troubleshooting
                Log::info('Exception in SuperAdminController::updateSuperAdminProfile');
                Log::info($e->getMessage());
                Log::info($e);

                // Respond with server error
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request',
                    ],
                ];

                return response()->json($result, 500);
            }
        } else {
            // Validation failed - return validation errors
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        // Return success response when update completes
        return response()->json($result);
    }

    /**
     * Get Super Admin Dashboard (global view of events, revenue, and recent activity).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminDashboard(Request $request)
    {
        // Initialize result container for response data
        $result = []; // Stores success/error payload

        // Retrieve authenticated Super Admin to confirm session
        $authenticatedSuperAdmin = $request->user(); // Provided by middleware

        try {
            // Initialize models used for dashboard metrics
            $eventModel = new EventModel; // Provides event queries
            $orderModel = new OrderModel; // Provides order queries
            $userModel = new UserModel; // Provides user counts

            // Calculate total events that are currently live (is_published and not draft)
            $liveEventsCount = $eventModel->where('is_draft', false)
                ->where('is_published', true)
                ->where(function ($query) {
                    $now = Carbon::now(); // Current timestamp
                    $query->where(function ($innerQuery) use ($now) {
                        $innerQuery->whereRaw("CONCAT(start_date, ' ', start_time) <= ?", [$now->format('Y-m-d H:i:s')])
                            ->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) >= ?", [$now->format('Y-m-d H:i:s')]);
                    });
                })
                ->count(); // Count live events

            // Calculate completed events (end datetime has passed)
            $completedEventsCount = $eventModel->where('is_draft', false)
                ->where('is_published', true)
                ->where(function ($query) {
                    $now = Carbon::now();
                    $query->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) < ?", [$now->format('Y-m-d H:i:s')]);
                })
                ->count();

            // Calculate total revenue across the platform using orders table
            $totalRevenue = (float) $orderModel->sum('total_amount'); // Sum total_amount column

            // Calculate settlement totals (after Stripe deduction)
            $stripeService = new StripeService;

            // Calculate total settled (net after Stripe fees)
            $settledOrdersForTotal = OrderModel::where('order_status', 'settled')->get();
            $totalSettled = 0;
            foreach ($settledOrdersForTotal as $order) {
                $customerPaid = (float) $order->total_amount;
                $stripeFee = (float) ($order->stripe_fee ?? 0);

                // If Stripe fee is missing, try to retrieve from Stripe API
                if ($stripeFee == 0 && ! empty($order->stripe_payment_intent_id)) {
                    $retrievedFee = $stripeService->getPaymentFee($order->stripe_payment_intent_id);
                    if ($retrievedFee !== null) {
                        $stripeFee = $retrievedFee;
                        // Store retrieved fee in order
                        $order->stripe_fee = $retrievedFee;
                        $order->save();
                    } else {
                        // Fallback: Calculate estimated Stripe fee
                        $stripeFee = ($customerPaid * 0.029) + 0.30;
                    }
                } elseif ($stripeFee == 0) {
                    // No payment intent ID, calculate estimated fee
                    $stripeFee = ($customerPaid * 0.029) + 0.30;
                }

                $totalSettled += ($customerPaid - $stripeFee);
            }
            $totalSettled = round($totalSettled, 2);

            // Calculate pending settlement (net after Stripe fees)
            $pendingOrders = OrderModel::where('order_status', 'paid')
                ->whereNull('stripe_transfer_id')
                ->get();
            $pendingSettlement = 0;
            foreach ($pendingOrders as $order) {
                $customerPaid = (float) $order->total_amount;
                $stripeFee = (float) ($order->stripe_fee ?? 0);

                // If Stripe fee is missing, try to retrieve from Stripe API
                if ($stripeFee == 0 && ! empty($order->stripe_payment_intent_id)) {
                    $retrievedFee = $stripeService->getPaymentFee($order->stripe_payment_intent_id);
                    if ($retrievedFee !== null) {
                        $stripeFee = $retrievedFee;
                        // Store retrieved fee in order
                        $order->stripe_fee = $retrievedFee;
                        $order->save();
                    } else {
                        // Fallback: Calculate estimated Stripe fee
                        $stripeFee = ($customerPaid * 0.029) + 0.30;
                    }
                } elseif ($stripeFee == 0) {
                    // No payment intent ID, calculate estimated fee
                    $stripeFee = ($customerPaid * 0.029) + 0.30;
                }

                $pendingSettlement += ($customerPaid - $stripeFee);
            }
            $pendingSettlement = round($pendingSettlement, 2);

            // Calculate total events (published, non-draft)
            $totalEventsCount = $eventModel->where('is_draft', false)
                ->where('is_published', true)
                ->count();

            // Calculate total users (end users)
            $totalUsersCount = $userModel->count();

            // Calculate total platform fees collected from settled orders
            // Get all settled orders with relationships needed for platform fee calculation
            $settledOrders = OrderModel::with(['orderTickets.ticket.event'])
                ->where('order_status', 'settled')
                ->get();

            $totalPlatformFeesCollected = 0;

            // Loop through settled orders to calculate platform fees
            foreach ($settledOrders as $order) {
                // Get customer paid amount
                $customerPaid = (float) $order->total_amount;

                // Get Stripe fee (retrieve from API if missing)
                $stripeFee = (float) ($order->stripe_fee ?? 0);

                // If Stripe fee is missing, try to retrieve from Stripe API
                if ($stripeFee == 0 && ! empty($order->stripe_payment_intent_id)) {

                    $retrievedFee = $stripeService->getPaymentFee($order->stripe_payment_intent_id);

                    if ($retrievedFee !== null) {
                        $stripeFee = $retrievedFee;
                    } else {
                        // Fallback: Calculate estimated Stripe fee
                        $stripeFee = ($customerPaid * 0.029) + 0.30;
                    }
                } elseif ($stripeFee == 0) {
                    // No payment intent ID, calculate estimated fee
                    $stripeFee = ($customerPaid * 0.029) + 0.30;
                }

                // Calculate net amount after Stripe fee
                $netAfterStripe = $customerPaid - $stripeFee;

                // Get host_user_id from order's event (via order_tickets -> ticket -> event)
                $hostUserId = null;
                $firstOrderTicket = $order->orderTickets->first();
                if ($firstOrderTicket && $firstOrderTicket->ticket && $firstOrderTicket->ticket->event) {
                    $hostUserId = $firstOrderTicket->ticket->event->host_user_id;
                }

                // Get platform fee settings for host
                $feeSettings = PlatformFeeService::getFeeForHost($hostUserId);

                // Get total ticket quantity for this order
                $ticketCount = $order->orderTickets->sum('quantity');

                // Calculate platform fee on net amount (after Stripe fees)
                $platformFee = PlatformFeeService::calculateFee($feeSettings, $netAfterStripe, $ticketCount);
                $totalPlatformFeesCollected += $platformFee;
            }

            // Compose summary array mirroring Host dashboard structure with additional totals
            $summaryData = [
                'active_events' => (int) $liveEventsCount, // Live events count
                'completed_events' => (int) $completedEventsCount, // Completed events count
                'total_events' => (int) $totalEventsCount, // Total published events
                'total_users' => (int) $totalUsersCount, // Total registered users
                'total_revenue' => $totalRevenue, // Total revenue float
                'total_settled' => $totalSettled, // Total amount settled across all events
                'pending_settlement' => $pendingSettlement, // Total amount pending settlement
                'total_platform_fees_collected' => round($totalPlatformFeesCollected, 2), // Total platform fees collected from settled orders
            ];

            // Fetch recent events (latest 3) with related tickets, media, venue
            $recentEvents = $eventModel->with(['tickets', 'venue', 'media'])
                ->where('is_draft', false)
                ->where('is_published', true)
                ->orderByDesc('created_at')
                ->limit(3)
                ->get();

            // Prepare recent events payload
            $recentEventsArray = []; // Holds formatted recent events
            foreach ($recentEvents as $event) {
                // Determine status using Carbon comparisons
                $eventStatus = 'draft'; // Default fallback
                if (! $event->is_draft && $event->is_published) {
                    $now = Carbon::now(); // Current timestamp
                    $startDate = Carbon::parse($event->start_date)->format('Y-m-d');
                    $startTime = ! empty($event->start_time) ? Carbon::parse($event->start_time)->format('H:i:s') : '00:00:00';
                    $startDateTime = Carbon::parse("{$startDate} {$startTime}");

                    $endDate = Carbon::parse($event->end_date)->format('Y-m-d');
                    $endTime = ! empty($event->end_time) ? Carbon::parse($event->end_time)->format('H:i:s') : '23:59:59';
                    $endDateTime = Carbon::parse("{$endDate} {$endTime}");

                    if ($now->betweenIncluded($startDateTime, $endDateTime)) {
                        $eventStatus = 'live';
                    } elseif ($now->lt($startDateTime)) {
                        $eventStatus = 'upcoming';
                    } elseif ($now->gt($endDateTime)) {
                        $eventStatus = 'completed';
                    }
                }

                // Calculate attendees (sum of sold_quantity)
                $attendeesCount = 0;
                if (! empty($event->tickets) && $event->tickets->count() > 0) {
                    $attendeesCount = $event->tickets->sum('sold_quantity'); // Sum sold tickets
                }

                // Calculate revenue for this event from ticket sales
                $eventRevenue = 0;
                if (! empty($event->tickets) && $event->tickets->count() > 0) {
                    $eventRevenue = $event->tickets->sum(function ($ticket) {
                        return $ticket->sold_quantity * (float) $ticket->price; // Multiply sold quantity by price
                    });
                }

                // Determine venue name if relationship loaded
                $venueName = null;
                if (! empty($event->venue)) {
                    $venueName = $event->venue->venue_name;
                }

                // Grab thumbnail path from media relationship (first thumbnail entry)
                $thumbnailPath = null;
                if (! empty($event->media) && $event->media->count() > 0) {
                    $thumbnail = $event->media->firstWhere('media_type', 'thumbnail');
                    if (! empty($thumbnail)) {
                        $thumbnailPath = $thumbnail->file_path;
                    }
                }

                // Format event date and time using Carbon
                $formattedDate = ! empty($event->start_date) ? Carbon::parse($event->start_date)->format('d-m-Y') : null;
                $formattedTime = ! empty($event->start_time) ? Carbon::parse($event->start_time)->format('H:i') : null;

                // Assemble event data entry
                $recentEventsArray[] = [
                    'event_id' => (int) $event->event_id,
                    'event_title' => $event->event_title,
                    'status' => $eventStatus,
                    'date' => $formattedDate,
                    'time' => $formattedTime,
                    'attendees' => (int) $attendeesCount,
                    'venue_name' => $venueName,
                    'revenue' => (float) $eventRevenue,
                    'thumbnail' => $thumbnailPath,
                    'is_hidden_by_admin' => (bool) $event->is_hidden_by_admin, // Flag indicating if event is hidden by admin
                    'hidden_reason' => $event->is_hidden_by_admin && ! empty($event->hidden_reason) ? $event->hidden_reason : null, // Hide reason only if hidden
                ];
            }

            // Get recent settlements (last 5)
            $recentSettlements = $orderModel->where('order_status', 'settled')
                ->whereNotNull('stripe_transfer_id')
                ->with(['orderTickets.ticket.event.hostUser'])
                ->orderByDesc('settled_at')
                ->limit(5)
                ->get();

            // Format recent settlements
            $recentSettlementsArray = [];
            foreach ($recentSettlements as $order) {
                // Get event from first order ticket
                $firstOrderTicket = $order->orderTickets->first();
                $event = $firstOrderTicket && $firstOrderTicket->ticket ? $firstOrderTicket->ticket->event : null;
                $hostUser = $event && $event->hostUser ? $event->hostUser : null;

                $recentSettlementsArray[] = [
                    'event_id' => $event ? $event->event_id : null,
                    'event_title' => $event ? $event->event_title : 'N/A',
                    'host_name' => $hostUser ? trim($hostUser->first_name.' '.$hostUser->last_name) : 'N/A',
                    'amount' => number_format((float) $order->total_amount, 2, '.', ''),
                    'settled_at' => $order->settled_at ? $order->settled_at->format('Y-m-d H:i:s') : null,
                    'transfer_id' => $order->stripe_transfer_id,
                ];
            }

            // Prepare success response payload mirroring host dashboard structure
            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Dashboard data retrieved successfully',
                    'summary' => $summaryData,
                    'recent_events' => $recentEventsArray,
                    'settlement_summary' => [
                        'total_settled' => number_format($totalSettled, 2, '.', ''),
                        'pending_settlement' => number_format($pendingSettlement, 2, '.', ''),
                        'recent_settlements' => $recentSettlementsArray,
                    ],
                ],
            ];
        } catch (\Exception $e) {
            // Log exception for debugging
            Log::info('Exception in SuperAdminController::getSuperAdminDashboard');
            Log::info($e->getMessage());
            Log::info($e);

            // Return server error response
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving dashboard data',
                ],
            ];

            return response()->json($result, 500);
        }

        // Return success response
        return response()->json($result);
    }

    /**
     * Get Super Admin Analytics - Returns month-wise analytics data for events, revenue, and profit
     *
     * Returns analytics data grouped by month for a specified year, including:
     * - Number of events (counted by start_date)
     * - Revenue generated (sum of order amounts by order_date)
     * - Profit made (platform fees collected from settled orders by order_date)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminAnalytics(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        try {
            // Get authenticated Super Admin from request (set by AuthenticateSuperAdmin middleware)
            $superAdmin = $request->user();

            // Safety check to ensure middleware injected user context
            if (empty($superAdmin) || $superAdmin == null) {
                // Return authentication error if user context missing
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E003',
                        'error_message' => 'Authentication required',
                    ],
                ];

                return response()->json($result, 401);
            }

            // Get all request data from the incoming request
            $data = $request->all();

            // Define validation rules for the request fields
            $rules = [
                'year' => 'required|integer|min:2020|max:2100', // Year is required, must be integer, between 2020-2100
            ];

            // Perform validation using Laravel Validator
            $validation = Validator::make($data, $rules);

            // Check if validation passes, proceed only if validation is successful
            if ($validation->fails()) {
                // Validation failed, return validation errors
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E001',
                        'error_message' => $validation->errors(),
                    ],
                ];

                return response()->json($result, 400);
            }

            // Get year from request data
            $year = (int) $data['year'];

            // Initialize models and services
            $eventModel = new EventModel;
            $orderModel = new OrderModel;
            $stripeService = new StripeService;

            // Month abbreviations array for response
            $monthAbbreviations = [
                1 => 'Jan',
                2 => 'Feb',
                3 => 'Mar',
                4 => 'Apr',
                5 => 'May',
                6 => 'Jun',
                7 => 'Jul',
                8 => 'Aug',
                9 => 'Sep',
                10 => 'Oct',
                11 => 'Nov',
                12 => 'Dec',
            ];

            // Initialize arrays for events, revenue, and profit
            $eventsData = [];
            $revenueData = [];
            $profitData = [];

            // Get current date to determine upcoming months
            $currentDate = Carbon::now();
            $currentYear = (int) $currentDate->format('Y');
            $currentMonth = (int) $currentDate->format('n'); // 1-12 format

            // Always return all 12 months for consistent graph rendering
            $allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

            // Loop through all 12 months
            foreach ($allMonths as $month) {
                // Check if this month is in the future
                $isUpcomingMonth = ($year > $currentYear) || ($year == $currentYear && $month > $currentMonth);

                if ($isUpcomingMonth) {
                    // For upcoming months, set values to null
                    $monthAbbr = $monthAbbreviations[$month];
                    $eventsData[] = [$monthAbbr => null];
                    $revenueData[] = [$monthAbbr => null];
                    $profitData[] = [$monthAbbr => null];

                    continue;
                }

                // Calculate events count for this month
                $eventsCount = $eventModel->where('is_draft', false)
                    ->where('is_published', true)
                    ->whereYear('start_date', $year)
                    ->whereMonth('start_date', $month)
                    ->count();

                // Calculate revenue for this month (sum of total_amount from paid/settled orders)
                $revenue = (float) $orderModel->whereIn('order_status', ['paid', 'settled'])
                    ->whereYear('order_date', $year)
                    ->whereMonth('order_date', $month)
                    ->sum('total_amount');

                // Calculate profit (platform fees) for this month (from settled orders only)
                // Get all settled orders for this month
                $settledOrders = OrderModel::with(['orderTickets.ticket.event'])
                    ->where('order_status', 'settled')
                    ->whereYear('order_date', $year)
                    ->whereMonth('order_date', $month)
                    ->get();

                $profit = 0.00;

                // Loop through settled orders to calculate platform fees
                foreach ($settledOrders as $order) {
                    // Get customer paid amount
                    $customerPaid = (float) $order->total_amount;

                    // Get Stripe fee (retrieve from API if missing)
                    $stripeFee = (float) ($order->stripe_fee ?? 0);

                    // If Stripe fee is missing, try to retrieve from Stripe API
                    if ($stripeFee == 0 && ! empty($order->stripe_payment_intent_id)) {
                        $retrievedFee = $stripeService->getPaymentFee($order->stripe_payment_intent_id);

                        if ($retrievedFee !== null) {
                            // Store retrieved fee in order
                            $stripeFee = $retrievedFee;
                            $order->stripe_fee = $retrievedFee;
                            $order->save();
                        } else {
                            // Fallback: Calculate estimated Stripe fee
                            $stripeFee = ($customerPaid * 0.029) + 0.30;
                        }
                    } elseif ($stripeFee == 0) {
                        // No payment intent ID, calculate estimated fee
                        $stripeFee = ($customerPaid * 0.029) + 0.30;
                    }

                    // Calculate net amount after Stripe fee
                    $netAfterStripe = $customerPaid - $stripeFee;

                    // Get host_user_id from order's event (via order_tickets -> ticket -> event)
                    $hostUserId = null;
                    $firstOrderTicket = $order->orderTickets->first();
                    if ($firstOrderTicket && $firstOrderTicket->ticket && $firstOrderTicket->ticket->event) {
                        $hostUserId = $firstOrderTicket->ticket->event->host_user_id;
                    }

                    // Get platform fee settings for host
                    $feeSettings = PlatformFeeService::getFeeForHost($hostUserId);

                    // Get total ticket quantity for this order
                    $ticketCount = $order->orderTickets->sum('quantity');

                    // Calculate platform fee on net amount (after Stripe fees)
                    $platformFee = PlatformFeeService::calculateFee($feeSettings, $netAfterStripe, $ticketCount);
                    $profit += $platformFee;
                }

                // Round profit to 2 decimal places
                $profit = round($profit, 2);

                // Build data arrays with month abbreviation as key
                $monthAbbr = $monthAbbreviations[$month];
                $eventsData[] = [$monthAbbr => (int) $eventsCount];
                $revenueData[] = [$monthAbbr => round($revenue, 2)];
                $profitData[] = [$monthAbbr => $profit];
            }

            // Build success response
            $result = [
                'success' => true,
                'data' => [
                    'year' => $year,
                    'events' => $eventsData,
                    'revenue' => $revenueData,
                    'profit' => $profitData,
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::error('Exception in SuperAdminController::getSuperAdminAnalytics', [
                'method' => __METHOD__,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving analytics data',
                ],
            ];

            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get Super Admin Reports List (all user-submitted reports with optional filters).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminReportsList(Request $request)
    {
        $result = [];

        $authenticatedSuperAdmin = $request->user();
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        $data = $request->all();
        $rules = [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'priority' => 'nullable|in:high,medium,low',
            'type' => 'nullable|in:event,host_profile,order',
            'report_type' => 'nullable|in:event,host_profile,order',
            'status' => 'nullable|in:new,in_review,resolved',
            'search' => 'nullable|string',
        ];
        $validation = Validator::make($data, $rules);
        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        try {
            $perPage = ! empty($data['per_page']) ? (int) $data['per_page'] : 10;
            $page = ! empty($data['page']) ? (int) $data['page'] : 1;

            // Normalize type filter: accept either 'type' or 'report_type'
            $reportTypeFilter = $data['type'] ?? $data['report_type'] ?? null;

            $reportsQuery = UserReportModel::query()
                ->with(['user', 'event.hostUser', 'hostUser', 'order.orderTickets.ticket.event.hostUser']);

            // Filter by priority (high, medium, low)
            if (! empty($data['priority'])) {
                $reportsQuery->where('priority', $data['priority']);
            }
            // Filter by status (new, in_review, resolved)
            if (! empty($data['status'])) {
                $reportsQuery->where('status', $data['status']);
            }
            // Filter by type (event, host_profile, order)
            if (! empty($reportTypeFilter)) {
                if ($reportTypeFilter === 'event') {
                    $reportsQuery->whereNotNull('event_id');
                } elseif ($reportTypeFilter === 'host_profile') {
                    $reportsQuery->whereNotNull('host_user_id');
                } else {
                    $reportsQuery->whereNotNull('order_id');
                }
            }
            if (! empty($data['search'])) {
                $searchTerm = $data['search'];
                $reportsQuery->where(function ($query) use ($searchTerm) {
                    $query->where('title', 'like', '%'.$searchTerm.'%')
                        ->orWhere('description', 'like', '%'.$searchTerm.'%');
                });
            }

            $paginated = $reportsQuery->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);

            $reportsArray = [];
            foreach ($paginated->items() as $report) {
                $reporter = [
                    'user_id' => (int) $report->user->user_id,
                    'full_name' => trim(($report->user->first_name ?? '').' '.($report->user->last_name ?? '')),
                    'email' => $report->user->email,
                ];

                $reportType = $report->event_id !== null ? 'event' : ($report->host_user_id !== null ? 'host_profile' : 'order');

                $item = [
                    'report_id' => (int) $report->report_id,
                    'report_type' => $reportType,
                    'status' => $report->status ?? 'new',
                    'event_id' => $report->event_id !== null ? (int) $report->event_id : null,
                    'host_user_id' => $report->host_user_id !== null ? (int) $report->host_user_id : null,
                    'order_id' => $report->order_id !== null ? (int) $report->order_id : null,
                    'title' => $report->title,
                    'description' => $report->description,
                    'priority' => $report->priority,
                    'created_at' => Carbon::parse($report->created_at)->format('d-m-Y H:i:s'),
                    'reporter' => $reporter,
                ];

                // Resolve event and host_user for all report types (always send both)
                $eventForDetails = null;
                $hostUserForDetails = null;
                if ($report->event_id !== null && $report->relationLoaded('event') && $report->event) {
                    $eventForDetails = $report->event;
                    if ($eventForDetails->relationLoaded('hostUser') && $eventForDetails->hostUser) {
                        $hostUserForDetails = $eventForDetails->hostUser;
                    }
                } elseif ($report->host_user_id !== null && $report->relationLoaded('hostUser') && $report->hostUser) {
                    $hostUserForDetails = $report->hostUser;
                } elseif ($report->order_id !== null && $report->relationLoaded('order') && $report->order && $report->order->relationLoaded('orderTickets')) {
                    $firstOrderTicket = $report->order->orderTickets->first();
                    if ($firstOrderTicket && $firstOrderTicket->relationLoaded('ticket') && $firstOrderTicket->ticket) {
                        $ticket = $firstOrderTicket->ticket;
                        if ($ticket->relationLoaded('event') && $ticket->event) {
                            $eventForDetails = $ticket->event;
                            if ($eventForDetails->relationLoaded('hostUser') && $eventForDetails->hostUser) {
                                $hostUserForDetails = $eventForDetails->hostUser;
                            }
                        }
                    }
                }
                $item['event'] = $eventForDetails ? [
                    'event_id' => (int) $eventForDetails->event_id,
                    'event_title' => $eventForDetails->event_title,
                    'host_user_id' => (int) $eventForDetails->host_user_id,
                ] : null;
                $item['host_user'] = $hostUserForDetails ? [
                    'host_user_id' => (int) $hostUserForDetails->host_user_id,
                    'first_name' => $hostUserForDetails->first_name,
                    'last_name' => $hostUserForDetails->last_name,
                    'email' => $hostUserForDetails->email,
                    'phone_number' => $hostUserForDetails->phone_number ?? null,
                    'profile_image' => $hostUserForDetails->profile_image ?? null,
                ] : null;
                if ($report->order_id !== null && $report->relationLoaded('order') && $report->order) {
                    $item['order'] = [
                        'order_id' => (int) $report->order->order_id,
                        'order_number' => $report->order->order_number,
                        'order_status' => $report->order->order_status,
                        'order_date' => $report->order->order_date ? Carbon::parse($report->order->order_date)->format('d-m-Y') : null,
                        'total_amount' => $report->order->total_amount !== null ? (float) $report->order->total_amount : null,
                        'user_id' => (int) $report->order->user_id,
                    ];
                } else {
                    $item['order'] = null;
                }

                $reportsArray[] = $item;
            }

            $paginationData = [
                'total_records' => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'total_pages' => $paginated->lastPage(),
                'next_page' => $paginated->currentPage() < $paginated->lastPage() ? $paginated->currentPage() + 1 : null,
                'prev_page' => $paginated->currentPage() > 1 ? $paginated->currentPage() - 1 : null,
            ];

            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Reports retrieved successfully',
                    'reports' => $reportsArray,
                    'pagination' => $paginationData,
                ],
            ];
        } catch (\Exception $e) {
            Log::info('Exception in SuperAdminController::getSuperAdminReportsList');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving reports',
                ],
            ];

            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Get Super Admin Feedbacks List (all feedbacks from users and hosts with pagination).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminFeedbacksList(Request $request)
    {
        $result = [];

        $authenticatedSuperAdmin = $request->user();
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        $data = $request->all();
        $rules = [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
        $validation = Validator::make($data, $rules);
        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        try {
            $perPage = ! empty($data['per_page']) ? (int) $data['per_page'] : 10;
            $page = ! empty($data['page']) ? (int) $data['page'] : 1;

            $feedbacksQuery = UserFeedbackModel::query()
                ->with(['user', 'hostUser']);

            $paginated = $feedbacksQuery->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);

            $feedbacksArray = [];
            foreach ($paginated->items() as $feedback) {
                $submitter = [
                    'name' => null,
                    'email' => null,
                ];
                if ($feedback->submitter_type === 'user' && $feedback->relationLoaded('user') && $feedback->user) {
                    $submitter['name'] = trim(($feedback->user->first_name ?? '').' '.($feedback->user->last_name ?? ''));
                    $submitter['email'] = $feedback->user->email;
                } elseif ($feedback->submitter_type === 'host' && $feedback->relationLoaded('hostUser') && $feedback->hostUser) {
                    $submitter['name'] = trim(($feedback->hostUser->first_name ?? '').' '.($feedback->hostUser->last_name ?? ''));
                    $submitter['email'] = $feedback->hostUser->email;
                }

                $feedbacksArray[] = [
                    'feedback_id' => (int) $feedback->feedback_id,
                    'submitter_type' => $feedback->submitter_type,
                    'submitter' => $submitter,
                    'title' => $feedback->title,
                    'description' => $feedback->description,
                    'created_at' => Carbon::parse($feedback->created_at)->format('d-m-Y H:i:s'),
                ];
            }

            $paginationData = [
                'total_records' => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'total_pages' => $paginated->lastPage(),
                'next_page' => $paginated->currentPage() < $paginated->lastPage() ? $paginated->currentPage() + 1 : null,
                'prev_page' => $paginated->currentPage() > 1 ? $paginated->currentPage() - 1 : null,
            ];

            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Feedbacks retrieved successfully',
                    'feedbacks' => $feedbacksArray,
                    'pagination' => $paginationData,
                ],
            ];
        } catch (\Exception $e) {
            Log::info('Exception in SuperAdminController::getSuperAdminFeedbacksList');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving feedbacks',
                ],
            ];

            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Get Super Admin Support Requests List (all support requests from users and hosts with pagination).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminSupportRequestsList(Request $request)
    {
        $result = [];

        $authenticatedSuperAdmin = $request->user();
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        $data = $request->all();
        $rules = [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
        ];
        $validation = Validator::make($data, $rules);
        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        try {
            $perPage = ! empty($data['per_page']) ? (int) $data['per_page'] : 10;
            $page = ! empty($data['page']) ? (int) $data['page'] : 1;

            $supportRequestsQuery = SupportRequestModel::query()
                ->with(['user', 'hostUser']);

            $paginated = $supportRequestsQuery->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);

            $supportRequestsArray = [];
            foreach ($paginated->items() as $supportRequest) {
                $submitter = [
                    'name' => null,
                    'email' => null,
                ];
                if ($supportRequest->submitter_type === 'user' && $supportRequest->relationLoaded('user') && $supportRequest->user) {
                    $submitter['name'] = trim(($supportRequest->user->first_name ?? '').' '.($supportRequest->user->last_name ?? ''));
                    $submitter['email'] = $supportRequest->user->email;
                } elseif ($supportRequest->submitter_type === 'host' && $supportRequest->relationLoaded('hostUser') && $supportRequest->hostUser) {
                    $submitter['name'] = trim(($supportRequest->hostUser->first_name ?? '').' '.($supportRequest->hostUser->last_name ?? ''));
                    $submitter['email'] = $supportRequest->hostUser->email;
                }

                $supportRequestsArray[] = [
                    'support_request_id' => (int) $supportRequest->support_request_id,
                    'submitter_type' => $supportRequest->submitter_type,
                    'submitter' => $submitter,
                    'title' => $supportRequest->title,
                    'description' => $supportRequest->description,
                    'created_at' => Carbon::parse($supportRequest->created_at)->format('d-m-Y H:i:s'),
                ];
            }

            $paginationData = [
                'total_records' => $paginated->total(),
                'current_page' => $paginated->currentPage(),
                'total_pages' => $paginated->lastPage(),
                'next_page' => $paginated->currentPage() < $paginated->lastPage() ? $paginated->currentPage() + 1 : null,
                'prev_page' => $paginated->currentPage() > 1 ? $paginated->currentPage() - 1 : null,
            ];

            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Support requests retrieved successfully',
                    'support_requests' => $supportRequestsArray,
                    'pagination' => $paginationData,
                ],
            ];
        } catch (\Exception $e) {
            Log::info('Exception in SuperAdminController::getSuperAdminSupportRequestsList');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving support requests',
                ],
            ];

            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Update report status (Super Admin only). Allowed values: in_review, resolved.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateReportStatus(Request $request)
    {
        $result = [];

        $authenticatedSuperAdmin = $request->user();
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        $data = $request->all();
        $rules = [
            'report_id' => 'required|integer|min:1',
            'status' => 'required|in:in_review,resolved',
        ];
        $validation = Validator::make($data, $rules);
        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        try {
            $report = UserReportModel::find($data['report_id']);
            if (! $report) {
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E404',
                        'error_message' => 'Report not found',
                    ],
                ];

                return response()->json($result, 404);
            }

            $report->update(['status' => $data['status']]);

            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Report status updated successfully',
                    'report_id' => (int) $report->report_id,
                    'status' => $report->status,
                ],
            ];

            return response()->json($result);
        } catch (\Exception $e) {
            Log::info('Exception in SuperAdminController::updateReportStatus');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while updating report status',
                ],
            ];

            return response()->json($result, 500);
        }
    }

    /**
     * Get Super Admin Events List (global listing similar to host events list).
     * POST: all parameters (filters + pagination) in request body (e.g. JSON).
     *
     * @param  Request  $request  Body: page, per_page, status, search, category_id, reported_events, business_intersection_id, date_from, date_to
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminEventsList(Request $request)
    {
        // Initialize result container
        $result = []; // Holds response data

        // Retrieve authenticated Super Admin
        $authenticatedSuperAdmin = $request->user(); // Provided by middleware

        // Ensure authentication exists
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        // Collect filter parameters
        $data = $request->all();

        // Define validation rules for filters
        $rules = [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'status' => 'nullable|in:live,upcoming,completed',
            'search' => 'nullable|string',
            'category_id' => 'nullable|integer|exists:event_categories,event_category_id',
            'reported_events' => 'nullable|boolean',
            'business_intersection_id' => 'nullable|integer|exists:business_intersections,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'city' => 'nullable|string',
            'state' => 'nullable|string',
            'postal_code' => 'nullable|string',
        ];

        $validation = Validator::make($data, $rules);

        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        // Date range: date_from must be before or equal to date_to when both are set
        if (! empty($data['date_from']) && ! empty($data['date_to']) && $data['date_from'] > $data['date_to']) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => ['date_to' => ['The date_to must be after or equal to date_from.']],
                ],
            ];

            return response()->json($result, 400);
        }

        try {
            $eventModel = new EventModel; // Event model

            // Base query for events (exclude drafts, include only published)
            $eventsQuery = $eventModel->with(['venue', 'tickets', 'media'])
                ->where('is_draft', false)
                ->where('is_published', true);

            // Apply category filter
            if (isset($data['category_id']) && $data['category_id'] !== '' && $data['category_id'] !== null) {
                $eventsQuery->where('event_category_id', (int) $data['category_id']);
            }

            // Apply reported events filter
            if (isset($data['reported_events']) && $data['reported_events'] !== '') {
                $reportedOnly = filter_var($data['reported_events'], FILTER_VALIDATE_BOOLEAN);
                if ($reportedOnly) {
                    $eventsQuery->whereExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('user_reports')
                            ->whereColumn('user_reports.event_id', 'events.event_id');
                    });
                } else {
                    $eventsQuery->whereNotExists(function ($query) {
                        $query->select(DB::raw(1))
                            ->from('user_reports')
                            ->whereColumn('user_reports.event_id', 'events.event_id');
                    });
                }
            }

            // Apply business intersection filter (via host's business)
            if (isset($data['business_intersection_id']) && $data['business_intersection_id'] !== '' && $data['business_intersection_id'] !== null) {
                $eventsQuery->whereHas('hostUser', function ($q) use ($data) {
                    $q->whereHas('business', function ($b) use ($data) {
                        $b->where('business_intersection_id', (int) $data['business_intersection_id']);
                    });
                });
            }

            // Apply city filter via related venue (exact match)
            if (! empty($data['city'])) {
                $city = $data['city'];
                $eventsQuery->whereHas('venue', function ($q) use ($city) {
                    $q->where('city', $city);
                });
            }

            // Apply state filter via related venue (exact match)
            if (! empty($data['state'])) {
                $state = $data['state'];
                $eventsQuery->whereHas('venue', function ($q) use ($state) {
                    $q->where('state_province', $state);
                });
            }

            // Apply postal code filter via related venue (exact match)
            if (! empty($data['postal_code'])) {
                $postalCode = $data['postal_code'];
                $eventsQuery->whereHas('venue', function ($q) use ($postalCode) {
                    $q->where('postal_code', $postalCode);
                });
            }

            // Apply date range filter (events overlapping the range)
            if (! empty($data['date_from'])) {
                $eventsQuery->where('end_date', '>=', $data['date_from']);
            }
            if (! empty($data['date_to'])) {
                $eventsQuery->where('start_date', '<=', $data['date_to']);
            }

            // Apply search filter (title or description)
            if (! empty($data['search'])) {
                $searchTerm = $data['search'];
                $eventsQuery->where(function ($query) use ($searchTerm) {
                    $query->where('event_title', 'like', '%'.$searchTerm.'%')
                        ->orWhere('description', 'like', '%'.$searchTerm.'%');
                });
            }

            $now = Carbon::now();

            // Status counts for tabs: same filters as list but WITHOUT status filter, so counts are always live/upcoming/completed totals
            $statusCountsQuery = clone $eventsQuery;
            $statusCountsResult = $statusCountsQuery->selectRaw("
                    SUM(CASE WHEN CONCAT(events.start_date, ' ', events.start_time) <= ? AND CONCAT(events.end_date, ' ', COALESCE(events.end_time, '23:59:59')) >= ? THEN 1 ELSE 0 END) AS live_count,
                    SUM(CASE WHEN CONCAT(events.start_date, ' ', events.start_time) > ? THEN 1 ELSE 0 END) AS upcoming_count,
                    SUM(CASE WHEN CONCAT(events.end_date, ' ', COALESCE(events.end_time, '23:59:59')) < ? THEN 1 ELSE 0 END) AS completed_count
                ", [
                $now->format('Y-m-d H:i:s'),
                $now->format('Y-m-d H:i:s'),
                $now->format('Y-m-d H:i:s'),
                $now->format('Y-m-d H:i:s'),
            ])->first();

            $statusCounts = [
                'live' => (int) ($statusCountsResult->live_count ?? 0),
                'upcoming' => (int) ($statusCountsResult->upcoming_count ?? 0),
                'completed' => (int) ($statusCountsResult->completed_count ?? 0),
            ];

            // Apply status filter to the list (counts above are unchanged by this)
            $statusFilter = $data['status'] ?? null;
            if (! empty($statusFilter)) {
                $eventsQuery->where(function ($query) use ($statusFilter, $now) {
                    if ($statusFilter === 'live') {
                        $query->whereRaw("CONCAT(start_date, ' ', start_time) <= ?", [$now->format('Y-m-d H:i:s')])
                            ->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) >= ?", [$now->format('Y-m-d H:i:s')]);
                    } elseif ($statusFilter === 'upcoming') {
                        $query->whereRaw("CONCAT(start_date, ' ', start_time) > ?", [$now->format('Y-m-d H:i:s')]);
                    } elseif ($statusFilter === 'completed') {
                        $query->whereRaw("CONCAT(end_date, ' ', COALESCE(end_time, '23:59:59')) < ?", [$now->format('Y-m-d H:i:s')]);
                    }
                });
            }

            // Handle pagination defaults
            $perPage = ! empty($data['per_page']) ? (int) $data['per_page'] : 10;
            $page = ! empty($data['page']) ? (int) $data['page'] : 1;

            // Paginate the filtered query
            $paginatedEvents = $eventsQuery->orderByDesc('created_at')->paginate($perPage, ['*'], 'page', $page);

            // Prepare events array
            $eventsArray = [];
            foreach ($paginatedEvents->items() as $event) {
                $eventStatus = 'draft';
                if (! $event->is_draft && $event->is_published) {
                    $startDate = Carbon::parse($event->start_date)->format('Y-m-d');
                    $startTime = ! empty($event->start_time) ? Carbon::parse($event->start_time)->format('H:i:s') : '00:00:00';
                    $startDateTime = Carbon::parse("{$startDate} {$startTime}");

                    $endDate = Carbon::parse($event->end_date)->format('Y-m-d');
                    $endTime = ! empty($event->end_time) ? Carbon::parse($event->end_time)->format('H:i:s') : '23:59:59';
                    $endDateTime = Carbon::parse("{$endDate} {$endTime}");

                    if ($now->betweenIncluded($startDateTime, $endDateTime)) {
                        $eventStatus = 'live';
                    } elseif ($now->lt($startDateTime)) {
                        $eventStatus = 'upcoming';
                    } elseif ($now->gt($endDateTime)) {
                        $eventStatus = 'completed';
                    }
                }

                $attendeesCount = ! empty($event->tickets) ? $event->tickets->sum('sold_quantity') : 0;
                $eventRevenue = ! empty($event->tickets)
                    ? $event->tickets->sum(function ($ticket) {
                        return $ticket->sold_quantity * (float) $ticket->price;
                    })
                    : 0;

                $venueName = ! empty($event->venue) ? $event->venue->venue_name : null;

                $thumbnailPath = null;
                if (! empty($event->media) && $event->media->count() > 0) {
                    $thumbnail = $event->media->firstWhere('media_type', 'thumbnail');
                    if (! empty($thumbnail)) {
                        $thumbnailPath = $thumbnail->file_path;
                    }
                }

                $eventsArray[] = [
                    'event_id' => (int) $event->event_id,
                    'event_title' => $event->event_title,
                    'description' => $event->description,
                    'status' => $eventStatus,
                    'date' => Carbon::parse($event->start_date)->format('d-m-Y'),
                    'time' => Carbon::parse($event->start_time)->format('H:i'),
                    'attendees' => (int) $attendeesCount,
                    'venue_name' => $venueName,
                    'revenue' => (float) $eventRevenue,
                    'thumbnail' => $thumbnailPath,
                    'is_hidden_by_admin' => (bool) $event->is_hidden_by_admin, // Flag indicating if event is hidden by admin
                    'hidden_reason' => $event->is_hidden_by_admin ? $event->hidden_reason : null, // Hide reason if event is hidden
                    'hidden_at' => $event->is_hidden_by_admin && ! empty($event->hidden_at) ? Carbon::parse($event->hidden_at)->format('d-m-Y H:i:s') : null, // Hide timestamp if event is hidden
                ];
            }

            // Prepare pagination metadata (matching host structure)
            $paginationData = [
                'total_records' => $paginatedEvents->total(),
                'current_page' => $paginatedEvents->currentPage(),
                'total_pages' => $paginatedEvents->lastPage(),
                'next_page' => $paginatedEvents->currentPage() < $paginatedEvents->lastPage() ? $paginatedEvents->currentPage() + 1 : null,
                'prev_page' => $paginatedEvents->currentPage() > 1 ? $paginatedEvents->currentPage() - 1 : null,
            ];

            // Build success payload
            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Events retrieved successfully',
                    'status_counts' => $statusCounts,
                    'events' => $eventsArray,
                    'pagination' => $paginationData,
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details
            Log::info('Exception in SuperAdminController::getSuperAdminEventsList');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving events',
                ],
            ];

            return response()->json($result, 500);
        }

        // Return success response
        return response()->json($result);
    }

    /**
     * Get detailed event data for Super Admin (mirrors host get_event_details).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminEventDetails(Request $request)
    {
        // Initialize result container
        $result = []; // Holds final payload

        // Ensure request user is authenticated super admin
        $authenticatedSuperAdmin = $request->user();
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        // Gather request data
        $data = $request->all();

        // Validate input
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id',
        ];
        $validation = Validator::make($data, $rules);

        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        try {
            // Initialize models
            $eventModel = new EventModel;
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
            $businessModel = new BusinessModel;
            $hostUserModel = new HostUserModel;

            // Fetch event (only published events visible)
            $eventCondition = [
                'event_id' => $data['event_id'],
                'is_draft' => false,
                'is_published' => true,
            ];
            $event = $eventModel->get_event($eventCondition);

            if (empty($event) || $event == null) {
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E404',
                        'error_message' => 'Event not found',
                    ],
                ];

                return response()->json($result, 404);
            }

            // Step 1 - Event basics
            $eventData = [
                'event_id' => $event->event_id,
                'event_title' => $event->event_title,
                'description' => $event->description,
                'event_category_id' => $event->event_category_id,
                'start_date' => Carbon::parse($event->start_date)->format('d-m-Y'),
                'end_date' => Carbon::parse($event->end_date)->format('d-m-Y'),
                'start_time' => Carbon::parse($event->start_time)->format('H:i'),
                'end_time' => Carbon::parse($event->end_time)->format('H:i'),
                'key_highlights' => $event->key_highlights,
                'is_hidden_by_admin' => (bool) $event->is_hidden_by_admin, // Flag indicating if event is hidden by admin
                'hidden_reason' => $event->is_hidden_by_admin && ! empty($event->hidden_reason) ? $event->hidden_reason : null, // Hide reason only if hidden
                'hidden_at' => $event->is_hidden_by_admin && ! empty($event->hidden_at) ? Carbon::parse($event->hidden_at)->format('d-m-Y H:i:s') : null, // Hide timestamp only if hidden
            ];

            // Media grouped by type
            $mediaRecords = $eventMediaModel->get_event_media_list(['event_id' => $event->event_id]);
            $mediaData = [
                'thumbnail' => [],
                'banner' => [],
                'flyer' => [],
                'video' => [],
            ];
            foreach ($mediaRecords as $media) {
                $mediaEntry = [
                    'event_media_id' => $media->event_media_id,
                    'media_type' => $media->media_type,
                    'file_path' => $media->file_path,
                    'file_name' => $media->file_name,
                    'file_size' => $media->file_size,
                ];
                if ($media->media_type == 'video' && ! empty($media->video_duration)) {
                    $mediaEntry['video_duration'] = $media->video_duration;
                }
                $mediaData[$media->media_type][] = $mediaEntry;
            }

            // Social media
            $socialMediaRecords = $eventSocialMediaModel->get_event_social_media_list(['event_id' => $event->event_id]);
            $socialMediaData = [];
            foreach ($socialMediaRecords as $social) {
                $socialMediaData[] = [
                    'event_social_media_id' => $social->event_social_media_id,
                    'platform' => $social->platform,
                    'url' => $social->url,
                ];
            }

            // Tickets
            $ticketsRecords = $ticketModel->get_tickets_list(['event_id' => $event->event_id]);
            $ticketsData = [];
            foreach ($ticketsRecords as $ticket) {
                $category = $ticketCategoryModel->get_ticket_category(['ticket_category_id' => $ticket->ticket_category_id]);
                $ticketsData[] = [
                    'ticket_id' => $ticket->ticket_id,
                    'ticket_category_id' => $ticket->ticket_category_id,
                    'category_name' => ! empty($category) ? $category->category_name : null,
                    'ticket_type' => $ticket->ticket_type,
                    'description' => $ticket->description,
                    'price' => (string) $ticket->price,
                    'total_available' => $ticket->total_available,
                    'sold_quantity' => $ticket->sold_quantity,
                    'ticket_info' => $ticket->ticket_info,
                    'max_per_user' => $ticket->max_per_user,
                ];
            }

            // Venue
            $venue = $venueModel->get_venue(['event_id' => $event->event_id]);
            $venueData = null;
            if (! empty($venue)) {
                $country = ! empty($venue->country_id) ? $countryModel->get_country(['country_id' => $venue->country_id]) : null;
                $venueData = [
                    'venue_id' => $venue->venue_id,
                    'venue_name' => $venue->venue_name,
                    'venue_address' => $venue->venue_address,
                    'city' => $venue->city,
                    'state_province' => $venue->state_province,
                    'postal_code' => $venue->postal_code,
                    'country' => ! empty($country) ? $country->name : null,
                    'latitude' => (string) $venue->latitude,
                    'longitude' => (string) $venue->longitude,
                    'maximum_attendees' => $venue->maximum_attendees,
                    'additional_details' => $venue->additional_details,
                    'venue_image' => $venue->venue_image,
                ];
            }

            // Artists
            $artistsRecords = $eventArtistModel->get_event_artists_list(['event_id' => $event->event_id]);
            $artistsData = [];
            foreach ($artistsRecords as $artist) {
                $artistSocials = $artistSocialMediaModel->get_artist_social_media_list(['event_artist_id' => $artist->event_artist_id]);
                $artistSocialData = [];
                foreach ($artistSocials as $artistSocial) {
                    $artistSocialData[] = [
                        'artist_social_media_id' => $artistSocial->artist_social_media_id,
                        'platform' => $artistSocial->platform,
                        'url' => $artistSocial->url,
                    ];
                }
                $artistsData[] = [
                    'event_artist_id' => $artist->event_artist_id,
                    'artist_name' => $artist->artist_name,
                    'artist_image' => $artist->artist_image,
                    'social_media' => $artistSocialData,
                ];
            }

            // Terms
            $terms = $eventTermsConditionModel->get_event_terms_condition(['event_id' => $event->event_id]);
            $termsData = ! empty($terms) ? [
                'event_terms_id' => $terms->event_terms_id,
                'terms_content' => $terms->terms_content,
            ] : null;

            // Coupons
            $couponsRecords = $couponModel->get_coupons_list(['event_id' => $event->event_id]);
            $couponsData = [];
            foreach ($couponsRecords as $coupon) {
                $couponsData[] = [
                    'coupon_id' => $coupon->coupon_id,
                    'coupon_code' => $coupon->coupon_code,
                    'discount_type' => $coupon->discount_type,
                    'discount_percent' => $coupon->discount_percent,
                    'max_cap_discount' => $coupon->max_cap_discount,
                    'flat_discount_amount' => $coupon->flat_discount_amount,
                    'max_times_applicable' => $coupon->max_times_applicable,
                    'start_date' => ! empty($coupon->start_date) ? Carbon::parse($coupon->start_date)->format('d-m-Y') : null,
                    'end_date' => ! empty($coupon->end_date) ? Carbon::parse($coupon->end_date)->format('d-m-Y') : null,
                    'times_used' => $coupon->times_used,
                ];
            }

            // Host info
            $hostUser = $hostUserModel->get_host_user(['host_user_id' => $event->host_user_id]);
            $businessInfo = null;
            if (! empty($hostUser) && ! empty($hostUser->business_id)) {
                $business = $businessModel->get_business(['business_id' => $hostUser->business_id]);
                if (! empty($business)) {
                    $businessInfo = [
                        'business_name' => $business->business_name,
                        'account_type' => $business->account_type,
                        'industry' => $business->industry,
                        'company_size' => $business->company_size,
                    ];
                }
            }
            $hostData = ! empty($hostUser) ? [
                'host_user_id' => $hostUser->host_user_id,
                'first_name' => $hostUser->first_name,
                'last_name' => $hostUser->last_name,
                'email' => $hostUser->email,
                'business' => $businessInfo,
            ] : null;

            // Prepare response
            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Event details retrieved successfully',
                    'event' => $eventData,
                    'media' => $mediaData,
                    'social_media' => $socialMediaData,
                    'tickets' => $ticketsData,
                    'venue' => $venueData,
                    'artists' => $artistsData,
                    'terms' => $termsData,
                    'coupons' => $couponsData,
                    'host' => $hostData,
                ],
            ];
        } catch (\Exception $e) {
            Log::info('Exception in SuperAdminController::getSuperAdminEventDetails');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving event details',
                ],
            ];

            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Get Registered Users List (global, with filters/pagination).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminRegisteredUsersList(Request $request)
    {
        // Initialize result container
        $result = []; // Holds final response payload

        // Ensure user is authenticated Super Admin
        $authenticatedSuperAdmin = $request->user();
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        // Collect filters
        $data = $request->all();

        // Validate request filters
        $rules = [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'search' => 'nullable|string',
            'start_date' => 'nullable|date_format:d-m-Y',
            'end_date' => 'nullable|date_format:d-m-Y',
            'sort_by' => 'nullable|in:latest,total_spend,total_orders',
            'gender' => 'nullable|in:Male,Female,Other,Prefer Not to say',
            'age_range' => 'nullable|string|in:10-20,20-30,30-40,40-50,50-60,60+',
            'state_id' => 'nullable|integer|min:1', // Optional filter by users.state_id
            'zipcode' => 'nullable|string|max:20', // Optional filter by users.zipcode
        ];
        $validation = Validator::make($data, $rules);
        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        try {
            $perPage = ! empty($data['per_page']) ? (int) $data['per_page'] : 10;
            $page = ! empty($data['page']) ? (int) $data['page'] : 1;
            $sortBy = $data['sort_by'] ?? 'latest';

            $startDate = ! empty($data['start_date']) ? Carbon::createFromFormat('d-m-Y', $data['start_date'])->startOfDay() : null;
            $endDate = ! empty($data['end_date']) ? Carbon::createFromFormat('d-m-Y', $data['end_date'])->endOfDay() : null;

            $userQuery = UserModel::query()
                ->leftJoin('orders', 'orders.user_id', '=', 'users.user_id')
                ->select(
                    'users.user_id',
                    DB::raw("TRIM(CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, ''))) as full_name"),
                    'users.email',
                    'users.contact_number',
                    'users.gender',
                    'users.created_at',
                    DB::raw('COUNT(orders.order_id) as total_orders'),
                    DB::raw('COALESCE(SUM(orders.total_amount), 0) as total_spend'),
                    DB::raw('MAX(orders.created_at) as last_order_date')
                )
                ->groupBy('users.user_id', 'users.first_name', 'users.last_name', 'users.email', 'users.contact_number', 'users.gender', 'users.created_at');

            // Apply search filter
            if (! empty($data['search'])) {
                $searchTerm = $data['search'];
                $userQuery->where(function ($query) use ($searchTerm) {
                    $query->where(DB::raw("TRIM(CONCAT(COALESCE(users.first_name, ''), ' ', COALESCE(users.last_name, '')))"), 'like', '%'.$searchTerm.'%')
                        ->orWhere('users.email', 'like', '%'.$searchTerm.'%');
                });
            }

            // Apply date filters on user creation date
            if (! empty($startDate)) {
                $userQuery->where('users.created_at', '>=', $startDate->format('Y-m-d H:i:s'));
            }
            if (! empty($endDate)) {
                $userQuery->where('users.created_at', '<=', $endDate->format('Y-m-d H:i:s'));
            }

            // Apply gender filter
            if (! empty($data['gender'])) {
                $userQuery->where('users.gender', $data['gender']);
            }

            // Apply state filter (users.state_id)
            if (! empty($data['state_id'])) {
                $userQuery->where('users.state_id', (int) $data['state_id']);
            }

            // Apply zipcode filter (users.zipcode)
            if (! empty($data['zipcode'])) {
                $userQuery->where('users.zipcode', $data['zipcode']);
            }

            // Apply age range filter (age computed from users.dob; users with null dob are excluded)
            if (! empty($data['age_range'])) {
                $userQuery->whereNotNull('users.dob');
                $ageExpr = 'TIMESTAMPDIFF(YEAR, users.dob, CURDATE())';
                switch ($data['age_range']) {
                    case '10-20':
                        $userQuery->whereRaw($ageExpr.' >= 10 AND '.$ageExpr.' < 20');
                        break;
                    case '20-30':
                        $userQuery->whereRaw($ageExpr.' >= 20 AND '.$ageExpr.' < 30');
                        break;
                    case '30-40':
                        $userQuery->whereRaw($ageExpr.' >= 30 AND '.$ageExpr.' < 40');
                        break;
                    case '40-50':
                        $userQuery->whereRaw($ageExpr.' >= 40 AND '.$ageExpr.' < 50');
                        break;
                    case '50-60':
                        $userQuery->whereRaw($ageExpr.' >= 50 AND '.$ageExpr.' < 60');
                        break;
                    case '60+':
                        $userQuery->whereRaw($ageExpr.' >= 60');
                        break;
                }
            }

            // Sorting
            if ($sortBy === 'total_spend') {
                $userQuery->orderByDesc(DB::raw('total_spend'));
            } elseif ($sortBy === 'total_orders') {
                $userQuery->orderByDesc(DB::raw('total_orders'));
            } else {
                $userQuery->orderByDesc('users.created_at');
            }

            // Paginate
            $usersPaginated = $userQuery->paginate($perPage, ['*'], 'page', $page);

            $usersArray = [];
            foreach ($usersPaginated->items() as $user) {
                $usersArray[] = [
                    'user_id' => (int) $user->user_id,
                    'full_name' => $user->full_name,
                    'email' => $user->email,
                    'contact_number' => $user->contact_number,
                    'gender' => $user->gender,
                    'created_at' => Carbon::parse($user->created_at)->format('d-m-Y'),
                    'total_orders' => (int) $user->total_orders,
                    'total_spend' => (float) $user->total_spend,
                    'last_order_date' => ! empty($user->last_order_date) ? Carbon::parse($user->last_order_date)->format('d-m-Y') : null,
                ];
            }

            $paginationData = [
                'total_records' => $usersPaginated->total(),
                'current_page' => $usersPaginated->currentPage(),
                'total_pages' => $usersPaginated->lastPage(),
                'next_page' => $usersPaginated->currentPage() < $usersPaginated->lastPage() ? $usersPaginated->currentPage() + 1 : null,
                'prev_page' => $usersPaginated->currentPage() > 1 ? $usersPaginated->currentPage() - 1 : null,
            ];

            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Registered users retrieved successfully',
                    'users' => $usersArray,
                    'pagination' => $paginationData,
                ],
            ];
        } catch (\Exception $e) {
            Log::info('Exception in SuperAdminController::getSuperAdminRegisteredUsersList');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving users',
                ],
            ];

            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Get Super Admin Attendees List (global scope with filters).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminAttendeesList(Request $request)
    {
        // Initialize result array to structure the final JSON response
        $result = []; // Stores success or error payload

        // Retrieve authenticated user from middleware context for safety
        $authenticatedSuperAdmin = $request->user(); // Should be SuperAdminModel instance

        // Ensure the request has a valid authenticated Super Admin
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            // Return authentication error if user context missing
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003', // Authentication error code
                    'error_message' => 'Authentication required', // Message for client
                ],
            ];

            // Respond with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Capture request input payload for validation and processing
        $data = $request->all(); // Fetch all query parameters

        // Define validation rules for attendees list filters
        $rules = [
            'search' => 'nullable|string|max:255', // Optional search text
            'start_date' => 'nullable|date_format:d-m-Y', // Optional start date in d-m-Y format
            'end_date' => 'nullable|date_format:d-m-Y', // Optional end date in d-m-Y format
            'events_filter' => 'nullable|string|max:255', // Optional event title filter
            'event_id' => 'nullable|integer|exists:events,event_id', // Optional event ID filter
            'host_user_id' => 'nullable|integer|exists:host_users,host_user_id', // Optional host filter
            'sort_by' => 'nullable|string|in:last_txn_date,total_spend,total_txns', // Sorting options
            'page' => 'nullable|integer|min:1', // Pagination page number
            'per_page' => 'nullable|integer|min:1|max:100', // Items per page constraint
        ];

        // Run validation against incoming request data
        $validation = Validator::make($data, $rules); // Create validator instance

        // If validation fails return error response immediately
        if ($validation->fails()) {
            // Build validation error response payload
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001', // Validation error code
                    'error_message' => $validation->errors(), // Return Laravel validation messages
                ],
            ];

            // Respond with 400 Bad Request status code
            return response()->json($result, 400);
        }

        try {
            // Instantiate UserModel to fetch attendees with aggregates
            $userModel = new UserModel; // Handles attendee queries

            // Instantiate OrderModel to fetch events per attendee
            $orderModel = new OrderModel; // Handles event breakdown queries

            // Determine pagination parameters with defaults
            $page = isset($data['page']) && $data['page'] > 0 ? (int) $data['page'] : 1; // Default page 1
            $perPage = isset($data['per_page']) && $data['per_page'] > 0 && $data['per_page'] <= 100 ? (int) $data['per_page'] : 10; // Default 10 per page

            // Determine sort option with default fallback
            $sortBy = isset($data['sort_by']) && ! empty($data['sort_by']) ? $data['sort_by'] : 'last_txn_date'; // Default to last_txn_date

            // Initialize filters array that will be passed to model queries
            $filters = []; // Collects optional filters

            // Add search filter when provided
            if (isset($data['search']) && ! empty($data['search'])) {
                $filters['search'] = $data['search']; // Store search text
            }

            // Convert start_date to database friendly format using Carbon when provided
            if (isset($data['start_date']) && ! empty($data['start_date'])) {
                $startDate = Carbon::createFromFormat('d-m-Y', $data['start_date'])->startOfDay(); // Normalize to start of day
                $filters['start_date'] = $startDate->format('Y-m-d'); // Store as Y-m-d for whereDate clause
            }

            // Convert end_date to database friendly format using Carbon when provided
            if (isset($data['end_date']) && ! empty($data['end_date'])) {
                $endDate = Carbon::createFromFormat('d-m-Y', $data['end_date'])->endOfDay(); // Normalize to end of day
                $filters['end_date'] = $endDate->format('Y-m-d H:i:s'); // Store as Y-m-d H:i:s for inclusive comparison
            }

            // Add events_filter when provided to match event titles
            if (isset($data['events_filter']) && ! empty($data['events_filter'])) {
                $filters['events_filter'] = $data['events_filter']; // Store events filter text
            }

            // Add event_id filter when provided to restrict to a specific event
            if (isset($data['event_id']) && ! empty($data['event_id'])) {
                $filters['event_id'] = (int) $data['event_id']; // Cast event ID to integer
            }

            // Add host_user_id filter when provided to restrict to a host
            if (isset($data['host_user_id']) && ! empty($data['host_user_id'])) {
                $filters['host_user_id'] = (int) $data['host_user_id']; // Cast host user ID to integer
            }

            // Fetch attendees list with aggregates using prepared filters
            $attendeesResult = $userModel->get_super_admin_attendees_list_with_aggregates($filters, $sortBy, $page, $perPage); // Execute aggregate query

            // Extract attendees collection and total record count from result
            $attendees = $attendeesResult->attendees; // Collection of attendee rows
            $totalRecords = $attendeesResult->total_records; // Total number of attendees matching filters

            // Extract user IDs for current page to fetch per-event breakdown
            $userIds = $attendees->pluck('user_id')->toArray(); // Collect user IDs

            // Fetch events per attendee only when there are users on current page
            $eventsData = ! empty($userIds) ? $orderModel->get_super_admin_events_per_users($userIds, $filters) : collect(); // Query or return empty collection

            // Group events by user_id for quick lookup during response formatting
            $eventsByUserId = []; // Initialize grouping array
            foreach ($eventsData as $eventRow) {
                $userId = $eventRow->user_id; // Current attendee ID
                if (! isset($eventsByUserId[$userId])) {
                    $eventsByUserId[$userId] = []; // Initialize user entry if missing
                }
                $ticketSubtotal = (float) $eventRow->ticket_subtotal; // Base ticket cost for this event
                $allocatedCouponDiscount = (float) $eventRow->coupon_discount_amount; // Coupon discount share allocated to this event
                $finalEventSpend = $ticketSubtotal - $allocatedCouponDiscount; // Final paid amount for this event (platform fee not included as it's calculated during settlement)
                $eventsByUserId[$userId][] = [
                    'event_id' => (int) $eventRow->event_id, // Event identifier
                    'event_title' => $eventRow->event_title, // Event title text
                    'tickets_purchased' => (int) $eventRow->tickets_purchased, // Tickets purchased for event
                    'ticket_subtotal' => $ticketSubtotal, // Ticket subtotal before fees/discounts
                    'coupon_discount' => $allocatedCouponDiscount, // Coupon discount applied to this event
                    'event_spend' => $finalEventSpend, // Final amount paid for this event
                ];
            }

            // Prepare attendees array for response payload
            $attendeesArray = []; // Holds formatted attendees
            foreach ($attendees as $attendee) {
                $userId = $attendee->user_id; // Current attendee ID
                $lastTxnFormatted = null; // Default last transaction to null
                if (! empty($attendee->last_txn_date)) {
                    $lastTxnFormatted = Carbon::parse($attendee->last_txn_date)->format('d-m-Y H:i:s'); // Format timestamp using Carbon
                }
                $eventsList = isset($eventsByUserId[$userId]) ? $eventsByUserId[$userId] : []; // Retrieve events list if available
                $attendeesArray[] = [
                    'user_id' => (int) $userId, // Cast user ID to integer
                    'name' => $attendee->full_name, // Attendee full name
                    'email' => $attendee->email, // Attendee email
                    'contact' => $attendee->contact_number, // Attendee contact number
                    'total_txns' => (int) $attendee->total_txns, // Total transactions count
                    'total_spend' => (float) $attendee->total_spend, // Total spend amount
                    'last_txn' => $lastTxnFormatted, // Last transaction timestamp formatted
                    'events' => $eventsList, // Events attended list
                ];
            }

            // Compute pagination metadata
            $totalPages = $totalRecords > 0 ? (int) ceil($totalRecords / $perPage) : 0; // Calculate total pages
            $nextPage = $page < $totalPages ? $page + 1 : null; // Determine next page value
            $prevPage = $page > 1 ? $page - 1 : null; // Determine previous page value

            // Assemble pagination array per standard format
            $paginationData = [
                'total_records' => $totalRecords, // Total matching records
                'current_page' => $page, // Current page number
                'total_pages' => $totalPages, // Total pages count
                'next_page' => $nextPage, // Next page number or null
                'prev_page' => $prevPage, // Previous page number or null
            ];

            // Build success response payload
            $result = [
                'success' => true, // Indicate successful execution
                'data' => [
                    'message' => 'Attendees retrieved successfully', // Success message
                    'attendees' => $attendeesArray, // Formatted attendees list
                    'pagination' => $paginationData, // Pagination metadata
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging
            Log::info('Exception in SuperAdminController::getSuperAdminAttendeesList'); // Log method identifier
            Log::info($e->getMessage()); // Log exception message
            Log::info($e); // Log exception stack trace

            // Prepare server error response payload
            $result = [
                'success' => false, // Indicate failure
                'error' => [
                    'error_code' => 'E002', // General server error code
                    'error_message' => 'An error occurred while retrieving attendees', // Client-facing message
                ],
            ];

            // Respond with 500 Internal Server Error status code
            return response()->json($result, 500);
        }

        // Return successful JSON response with attendees data
        return response()->json($result);
    }

    /**
     * Get Super Admin Event Hosts List.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminEventHostsList(Request $request)
    {
        // Initialize result container
        $result = []; // Stores success or error payload

        // Retrieve authenticated Super Admin via middleware
        $authenticatedSuperAdmin = $request->user(); // Should be SuperAdminModel instance

        // Ensure authentication context exists
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        // Capture all query parameters
        $data = $request->all();

        // Define validation rules for filters
        $rules = [
            'search' => 'nullable|string|max:255',
            'account_type' => 'nullable|in:business,personal',
            'has_business_profile' => 'nullable|boolean',
            'business_intersection_id' => 'nullable|integer|exists:business_intersections,id',
            'has_reports' => 'nullable|boolean',
            'start_date' => 'nullable|date_format:d-m-Y',
            'end_date' => 'nullable|date_format:d-m-Y',
            'status' => 'nullable|in:active,inactive',
            'sort_by' => 'nullable|in:newest,total_revenue,events_created,last_login,reports_count',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|min:1|max:100',
            'state_id' => 'nullable|integer|min:1', // Optional filter by host_users.state_id
            'zipcode' => 'nullable|string|max:20', // Optional filter by host_users.zipcode
        ];

        // Run validation
        $validation = Validator::make($data, $rules);

        if ($validation->fails()) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E001',
                    'error_message' => $validation->errors(),
                ],
            ];

            return response()->json($result, 400);
        }

        try {
            // Instantiate HostUserModel for aggregate query
            $hostUserModel = new HostUserModel;

            // Prepare filters array for model
            $filters = [];
            if (! empty($data['search'])) {
                $filters['search'] = $data['search'];
            }
            if (! empty($data['account_type'])) {
                $filters['account_type'] = $data['account_type'];
            }
            if (isset($data['has_business_profile'])) {
                $filters['has_business_profile'] = (bool) $data['has_business_profile'];
            }
            if (! empty($data['start_date'])) {
                $filters['start_date'] = Carbon::createFromFormat('d-m-Y', $data['start_date'])->format('Y-m-d');
            }
            if (! empty($data['end_date'])) {
                $filters['end_date'] = Carbon::createFromFormat('d-m-Y', $data['end_date'])->format('Y-m-d');
            }
            if (! empty($data['status'])) {
                $filters['status'] = $data['status'];
            }
            if (! empty($data['business_intersection_id'])) {
                $filters['business_intersection_id'] = (int) $data['business_intersection_id'];
            }
            if (isset($data['has_reports'])) {
                $filters['has_reports'] = (bool) $data['has_reports'];
            }
            if (! empty($data['state_id'])) {
                $filters['state_id'] = (int) $data['state_id'];
            }
            if (! empty($data['zipcode'])) {
                $filters['zipcode'] = $data['zipcode'];
            }

            // Determine pagination parameters
            $perPage = isset($data['per_page']) ? (int) $data['per_page'] : 10;
            $page = isset($data['page']) ? (int) $data['page'] : 1;
            $sortBy = isset($data['sort_by']) ? $data['sort_by'] : 'newest';

            // Fetch host list with aggregates via model
            $hostsResult = $hostUserModel->get_super_admin_host_list_with_aggregates($filters, $sortBy, $page, $perPage);
            $hosts = $hostsResult->hosts;
            $totalRecords = $hostsResult->total_records;

            // Format hosts for response
            $hostsArray = [];
            foreach ($hosts as $host) {
                $hasBusinessProfile = ! empty($host->business_id);
                $lastLoginFormatted = ! empty($host->last_login_at) ? Carbon::parse($host->last_login_at)->format('d-m-Y H:i:s') : null;

                $eventsLiveCount = (int) $host->events_live;
                $eventsCompletedCount = (int) $host->events_completed;
                $eventsCreatedCount = (int) $host->events_created;

                // Business intersection: use other_business_intersection string when set, else lookup name
                $businessIntersectionId = ! empty($host->business_intersection_id) ? (int) $host->business_intersection_id : null;
                $businessIntersection = ! empty($host->other_business_intersection)
                    ? $host->other_business_intersection
                    : ($host->business_intersection_name ?? null);

                $hostData = [
                    'host_user_id' => (int) $host->host_user_id,
                    'first_name' => $host->first_name,
                    'last_name' => $host->last_name,
                    'email' => $host->email,
                    'phone_number' => $host->phone_number,
                    'account_type' => $host->account_type,
                    'has_business_profile' => $hasBusinessProfile,
                    'business_intersection_id' => $businessIntersectionId,
                    'business_intersection' => $businessIntersection,
                    'business' => [
                        'business_name' => $host->business_name,
                        'industry' => $host->industry,
                        'country_name' => $host->business_country_name,
                    ],
                    'metrics' => [
                        'events_created' => $eventsCreatedCount,
                        'events_live' => $eventsLiveCount,
                        'events_completed' => $eventsCompletedCount,
                        'total_revenue_generated' => (float) $host->total_revenue_generated,
                        'total_tickets_sold' => (int) $host->total_tickets_sold,
                        'reports_count' => (int) ($host->reports_count ?? 0),
                    ],
                    'last_login' => $lastLoginFormatted,
                    'is_blocked' => (bool) $host->is_blocked, // Block status flag
                    'blocked_reason' => $host->is_blocked && ! empty($host->blocked_reason) ? $host->blocked_reason : null, // Block reason only if blocked
                    'blocked_at' => $host->is_blocked && ! empty($host->blocked_at) ? Carbon::parse($host->blocked_at)->format('d-m-Y H:i:s') : null, // Block timestamp only if blocked
                    'blocked_by_super_admin_id' => $host->is_blocked && ! empty($host->blocked_by_super_admin_id) ? (int) $host->blocked_by_super_admin_id : null, // Super admin ID only if blocked
                ];

                $hostsArray[] = $hostData;
            }

            // Compute pagination metadata
            $totalPages = $totalRecords > 0 ? (int) ceil($totalRecords / $perPage) : 0;
            $nextPage = $page < $totalPages ? $page + 1 : null;
            $prevPage = $page > 1 ? $page - 1 : null;

            $paginationData = [
                'total_records' => $totalRecords,
                'current_page' => $page,
                'total_pages' => $totalPages,
                'next_page' => $nextPage,
                'prev_page' => $prevPage,
            ];

            // Build success response
            $result = [
                'success' => true,
                'data' => [
                    'message' => 'Event hosts retrieved successfully',
                    'hosts' => $hostsArray,
                    'pagination' => $paginationData,
                ],
            ];
        } catch (\Exception $e) {
            Log::info('Exception in SuperAdminController::getSuperAdminEventHostsList');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving event hosts',
                ],
            ];

            return response()->json($result, 500);
        }

        return response()->json($result);
    }

    /**
     * Toggle Event Host block status (block/unblock) by Super Admin.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleEventHostBlockStatus(Request $request)
    {
        // Initialize response container for success/error payload
        $result = []; // Will be populated before returning

        // Retrieve authenticated Super Admin injected via middleware
        $authenticatedSuperAdmin = $request->user(); // Should hold SuperAdminModel instance

        // Ensure authentication context exists before proceeding
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            // Prepare authentication error payload
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E003', // Authentication error code
                    'error_message' => 'Authentication required', // Client-facing message
                ],
            ];

            // Return 401 Unauthorized since user context is missing
            return response()->json($result, 401);
        }

        // Capture request payload for validation and processing
        $data = $request->all(); // Contains host_user_id, action, reason

        // Define validation rules for incoming payload
        $rules = [
            'host_user_id' => 'required|integer|exists:host_users,host_user_id', // Host identifier must exist
            'action' => 'required|in:block,unblock', // Only allow block/unblock actions
            'reason' => 'nullable|string|max:500', // Optional reason capped for readability
        ];

        // Run Laravel validation against defined rules
        $validation = Validator::make($data, $rules); // Validator instance

        // Handle validation failures by returning E001 error
        if ($validation->fails()) {
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E001', // Validation error code
                    'error_message' => $validation->errors(), // Detailed validation messages
                ],
            ];

            // Return 400 Bad Request with validation feedback
            return response()->json($result, 400);
        }

        try {
            // Instantiate HostUserModel for DB interactions
            $hostUserModel = new HostUserModel; // Provides CRUD helpers

            // Build query condition to fetch requested host user
            $queryCondition = [
                'host_user_id' => $data['host_user_id'], // Target host identifier
            ];

            // Retrieve host user record from database
            $hostUser = $hostUserModel->get_host_user($queryCondition); // Returns object or null

            // Return not found error if host user does not exist
            if (empty($hostUser) || $hostUser == null) {
                $result = [
                    'success' => false, // Operation failed
                    'error' => [
                        'error_code' => 'E404', // Not found error code
                        'error_message' => 'Event host not found', // Client-facing message
                    ],
                ];

                // Respond with 404 Not Found status
                return response()->json($result, 404);
            }

            // Determine requested action (block/unblock)
            $action = $data['action']; // Input already validated

            // Normalize provided reason (trim whitespace if supplied)
            $reason = isset($data['reason']) ? trim($data['reason']) : null; // Optional field

            // Prevent redundant block attempts when host already blocked
            if ($action === 'block' && $hostUser->is_blocked) {
                $result = [
                    'success' => false, // Operation failed
                    'error' => [
                        'error_code' => 'E004', // Business logic error code
                        'error_message' => 'Event host is already blocked', // Specific message
                    ],
                ];

                // Return 400 Bad Request for redundant operation
                return response()->json($result, 400);
            }

            // Prevent redundant unblock attempts when host already active
            if ($action === 'unblock' && ! $hostUser->is_blocked) {
                $result = [
                    'success' => false, // Operation failed
                    'error' => [
                        'error_code' => 'E004', // Business logic error code
                        'error_message' => 'Event host is already active', // Specific message
                    ],
                ];

                // Return 400 Bad Request for redundant operation
                return response()->json($result, 400);
            }

            // Begin transaction to ensure consistent updates and token revocation
            DB::beginTransaction(); // Start DB transaction

            try {
                // Prepare update payload based on requested action
                if ($action === 'block') {
                    // Build data payload for blocking the host
                    $updateData = [
                        'is_blocked' => true, // Set block flag
                        'blocked_reason' => $reason, // Store optional reason
                        'blocked_by_super_admin_id' => $authenticatedSuperAdmin->super_admin_id, // Track acting admin
                        'blocked_at' => Carbon::now()->format('Y-m-d H:i:s'), // Timestamp block action
                    ];

                    // Persist block metadata to database
                    $hostUserModel->update_host_user_data($queryCondition, $updateData); // Update host record

                    // Revoke all active Sanctum tokens for this host to force logout
                    PersonalAccessToken::where('tokenable_type', HostUserModel::class) // Filter host tokens
                        ->where('tokenable_id', $hostUser->host_user_id) // Match specific host
                        ->delete(); // Remove tokens to invalidate sessions
                } else {
                    // Build data payload for unblocking the host
                    $updateData = [
                        'is_blocked' => false, // Clear block flag
                        'blocked_reason' => null, // Remove stored reason
                        'blocked_by_super_admin_id' => null, // Remove acting admin reference
                        'blocked_at' => null, // Clear timestamp
                    ];

                    // Persist unblock metadata to database
                    $hostUserModel->update_host_user_data($queryCondition, $updateData); // Update host record
                }

                // Commit transaction after successful updates
                DB::commit(); // Finalize changes
            } catch (\Exception $transactionException) {
                // Roll back transaction on any failure to maintain data integrity
                DB::rollBack(); // Undo partial updates

                // Re-throw exception to be handled by outer catch block
                throw $transactionException; // Maintain original stack trace
            }

            // Prepare success response payload
            $result = [
                'success' => true, // Operation succeeded
                'data' => [
                    'message' => $action === 'block' ? 'Event host blocked successfully' : 'Event host unblocked successfully', // Contextual message
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in SuperAdminController::toggleEventHostBlockStatus'); // Method identifier
            Log::info($e->getMessage()); // Exception message
            Log::info($e); // Full stack trace

            // Prepare generic server error response payload
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E002', // General server error code
                    'error_message' => 'An error occurred while updating block status', // Client-facing message
                ],
            ];

            // Return 500 Internal Server Error response
            return response()->json($result, 500);
        }

        // Return success response for block/unblock action
        return response()->json($result);
    }

    /**
     * Get distinct venue cities for Super Admin filters.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSuperAdminVenueCities(Request $request)
    {
        // Initialize result container
        $result = [];

        // Retrieve authenticated Super Admin
        $authenticatedSuperAdmin = $request->user();

        // Ensure authentication exists
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required',
                ],
            ];

            return response()->json($result, 401);
        }

        try {
            // Fetch distinct non-empty venue cities ordered alphabetically
            $cities = VenueModel::query()
                ->whereNotNull('city')
                ->where('city', '!=', '')
                ->distinct()
                ->orderBy('city')
                ->pluck('city')
                ->toArray();

            // Fetch distinct non-empty venue states ordered alphabetically
            $states = VenueModel::query()
                ->whereNotNull('state_province')
                ->where('state_province', '!=', '')
                ->distinct()
                ->orderBy('state_province')
                ->pluck('state_province')
                ->toArray();

            $result = [
                'success' => true,
                'data' => [
                    'cities' => $cities,
                    'states' => $states,
                ],
            ];

            return response()->json($result);
        } catch (\Exception $e) {
            Log::info('Exception in SuperAdminController::getSuperAdminVenueCities');
            Log::info($e->getMessage());
            Log::info($e);

            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving venue cities',
                ],
            ];

            return response()->json($result, 500);
        }
    }

    /**
     * Toggle Event hide status (hide/unhide) by Super Admin.
     *
     * Allows super admin to hide or unhide published events. Only published events can be hidden.
     * Hidden events are excluded from public listings but remain visible to event hosts.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleEventHideStatus(Request $request)
    {
        // Initialize response container for success/error payload
        $result = []; // Will be populated before returning

        // Retrieve authenticated Super Admin injected via middleware
        $authenticatedSuperAdmin = $request->user(); // Should hold SuperAdminModel instance

        // Ensure authentication context exists before proceeding
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            // Prepare authentication error payload
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E003', // Authentication error code
                    'error_message' => 'Authentication required', // Client-facing message
                ],
            ];

            // Return 401 Unauthorized since user context is missing
            return response()->json($result, 401);
        }

        // Capture request payload for validation and processing
        $data = $request->all(); // Contains event_id, action, reason

        // Define validation rules for incoming payload
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event identifier must exist
            'action' => 'required|in:hide,unhide', // Only allow hide/unhide actions
            'reason' => 'nullable|string|max:500', // Optional reason capped for readability
        ];

        // Run Laravel validation against defined rules
        $validation = Validator::make($data, $rules); // Validator instance

        // Handle validation failures by returning E001 error
        if ($validation->fails()) {
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E001', // Validation error code
                    'error_message' => $validation->errors(), // Detailed validation messages
                ],
            ];

            // Return 400 Bad Request with validation feedback
            return response()->json($result, 400);
        }

        try {
            // Instantiate EventModel for DB interactions
            $eventModel = new EventModel; // Provides CRUD helpers

            // Build query condition to fetch requested event
            $queryCondition = [
                'event_id' => $data['event_id'], // Target event identifier
            ];

            // Retrieve event record from database
            $event = $eventModel->get_event($queryCondition); // Returns object or null

            // Return not found error if event does not exist
            if (empty($event) || $event == null) {
                $result = [
                    'success' => false, // Operation failed
                    'error' => [
                        'error_code' => 'E404', // Not found error code
                        'error_message' => 'Event not found', // Client-facing message
                    ],
                ];

                // Respond with 404 Not Found status
                return response()->json($result, 404);
            }

            // Determine requested action (hide/unhide)
            $action = $data['action']; // Input already validated

            // Normalize provided reason (trim whitespace if supplied)
            $reason = isset($data['reason']) ? trim($data['reason']) : null; // Optional field

            // For hide action: verify event is published before allowing hide
            if ($action === 'hide') {
                // Check if event is published (is_published = true AND is_draft = false)
                if (! $event->is_published || $event->is_draft) {
                    $result = [
                        'success' => false, // Operation failed
                        'error' => [
                            'error_code' => 'E004', // Business logic error code
                            'error_message' => 'Only published events can be hidden', // Specific message
                        ],
                    ];

                    // Return 400 Bad Request for invalid operation
                    return response()->json($result, 400);
                }

                // Prevent redundant hide attempts when event already hidden
                if ($event->is_hidden_by_admin) {
                    $result = [
                        'success' => false, // Operation failed
                        'error' => [
                            'error_code' => 'E004', // Business logic error code
                            'error_message' => 'Event is already hidden', // Specific message
                        ],
                    ];

                    // Return 400 Bad Request for redundant operation
                    return response()->json($result, 400);
                }
            }

            // For unhide action: verify event is actually hidden
            if ($action === 'unhide') {
                // Prevent redundant unhide attempts when event not hidden
                if (! $event->is_hidden_by_admin) {
                    $result = [
                        'success' => false, // Operation failed
                        'error' => [
                            'error_code' => 'E004', // Business logic error code
                            'error_message' => 'Event is not hidden', // Specific message
                        ],
                    ];

                    // Return 400 Bad Request for redundant operation
                    return response()->json($result, 400);
                }
            }

            // Begin transaction to ensure consistent updates
            DB::beginTransaction(); // Start DB transaction

            try {
                // Prepare update payload based on requested action
                if ($action === 'hide') {
                    // Build data payload for hiding the event
                    $updateData = [
                        'is_hidden_by_admin' => true, // Set hide flag
                        'hidden_reason' => $reason, // Store optional reason
                        'hidden_by_super_admin_id' => $authenticatedSuperAdmin->super_admin_id, // Track acting admin
                        'hidden_at' => Carbon::now()->format('Y-m-d H:i:s'), // Timestamp hide action
                    ];

                    // Persist hide metadata to database
                    $eventModel->update_event_data($queryCondition, $updateData); // Update event record
                } else {
                    // Build data payload for unhiding the event
                    $updateData = [
                        'is_hidden_by_admin' => false, // Clear hide flag
                        'hidden_reason' => null, // Remove stored reason
                        'hidden_by_super_admin_id' => null, // Remove acting admin reference
                        'hidden_at' => null, // Clear timestamp
                    ];

                    // Persist unhide metadata to database
                    $eventModel->update_event_data($queryCondition, $updateData); // Update event record
                }

                // Commit transaction after successful updates
                DB::commit(); // Finalize changes
            } catch (\Exception $transactionException) {
                // Roll back transaction on any failure to maintain data integrity
                DB::rollBack(); // Undo partial updates

                // Re-throw exception to be handled by outer catch block
                throw $transactionException; // Maintain original stack trace
            }

            // Prepare success response payload
            $result = [
                'success' => true, // Operation succeeded
                'data' => [
                    'message' => $action === 'hide' ? 'Event hidden successfully' : 'Event unhidden successfully', // Contextual message
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in SuperAdminController::toggleEventHideStatus'); // Method identifier
            Log::info($e->getMessage()); // Exception message
            Log::info($e); // Full stack trace

            // Prepare generic server error response payload
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E002', // General server error code
                    'error_message' => 'An error occurred while updating hide status', // Client-facing message
                ],
            ];

            // Return 500 Internal Server Error response
            return response()->json($result, 500);
        }

        // Return success response for hide/unhide action
        return response()->json($result);
    }

    /**
     * Toggle Event featured status (feature/unfeature) by Super Admin.
     *
     * Allows super admin to mark or unmark published events as featured. Only published events can be featured.
     * Featured events appear in a separate section on the End User homepage.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function toggleEventFeaturedStatus(Request $request)
    {
        // Initialize response container for success/error payload
        $result = []; // Will be populated before returning

        // Retrieve authenticated Super Admin injected via middleware
        $authenticatedSuperAdmin = $request->user(); // Should hold SuperAdminModel instance

        // Ensure authentication context exists before proceeding
        if (empty($authenticatedSuperAdmin) || $authenticatedSuperAdmin == null) {
            // Prepare authentication error payload
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E003', // Authentication error code
                    'error_message' => 'Authentication required', // Client-facing message
                ],
            ];

            // Return 401 Unauthorized since user context is missing
            return response()->json($result, 401);
        }

        // Capture request payload for validation and processing
        $data = $request->all(); // Contains event_id, action, reason

        // Define validation rules for incoming payload
        $rules = [
            'event_id' => 'required|integer|exists:events,event_id', // Event identifier must exist
            'action' => 'required|in:feature,unfeature', // Only allow feature/unfeature actions
        ];

        // Run Laravel validation against defined rules
        $validation = Validator::make($data, $rules); // Validator instance

        // Handle validation failures by returning E001 error
        if ($validation->fails()) {
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E001', // Validation error code
                    'error_message' => $validation->errors(), // Detailed validation messages
                ],
            ];

            // Return 400 Bad Request with validation feedback
            return response()->json($result, 400);
        }

        try {
            // Instantiate EventModel for DB interactions
            $eventModel = new EventModel; // Provides CRUD helpers

            // Build query condition to fetch requested event
            $queryCondition = [
                'event_id' => $data['event_id'], // Target event identifier
            ];

            // Retrieve event record from database
            $event = $eventModel->get_event($queryCondition); // Returns object or null

            // Return not found error if event does not exist
            if (empty($event) || $event == null) {
                $result = [
                    'success' => false, // Operation failed
                    'error' => [
                        'error_code' => 'E404', // Not found error code
                        'error_message' => 'Event not found', // Client-facing message
                    ],
                ];

                // Respond with 404 Not Found status
                return response()->json($result, 404);
            }

            // Determine requested action (feature/unfeature)
            $action = $data['action']; // Input already validated

            // For feature action: verify event is published before allowing feature
            if ($action === 'feature') {
                // Check if event is published (is_published = true AND is_draft = false)
                if (! $event->is_published || $event->is_draft) {
                    $result = [
                        'success' => false, // Operation failed
                        'error' => [
                            'error_code' => 'E004', // Business logic error code
                            'error_message' => 'Only published events can be featured', // Specific message
                        ],
                    ];

                    // Return 400 Bad Request for invalid operation
                    return response()->json($result, 400);
                }

                // Prevent redundant feature attempts when event already featured
                if ($event->is_featured) {
                    $result = [
                        'success' => false, // Operation failed
                        'error' => [
                            'error_code' => 'E004', // Business logic error code
                            'error_message' => 'Event is already featured', // Specific message
                        ],
                    ];

                    // Return 400 Bad Request for redundant operation
                    return response()->json($result, 400);
                }
            }

            // For unfeature action: verify event is actually featured
            if ($action === 'unfeature') {
                // Prevent redundant unfeature attempts when event not featured
                if (! $event->is_featured) {
                    $result = [
                        'success' => false, // Operation failed
                        'error' => [
                            'error_code' => 'E004', // Business logic error code
                            'error_message' => 'Event is not featured', // Specific message
                        ],
                    ];

                    // Return 400 Bad Request for redundant operation
                    return response()->json($result, 400);
                }
            }

            // Begin transaction to ensure consistent updates
            DB::beginTransaction(); // Start DB transaction

            try {
                // Prepare update payload based on requested action
                if ($action === 'feature') {
                    // Build data payload for featuring the event
                    $updateData = [
                        'is_featured' => true, // Set featured flag
                        'featured_by_super_admin_id' => $authenticatedSuperAdmin->super_admin_id, // Track acting admin
                        'featured_at' => Carbon::now()->format('Y-m-d H:i:s'), // Timestamp feature action
                    ];

                    // Persist featured metadata to database
                    $eventModel->update_event_data($queryCondition, $updateData); // Update event record
                } else {
                    // Build data payload for unfeaturing the event
                    $updateData = [
                        'is_featured' => false, // Clear featured flag
                        'featured_by_super_admin_id' => null, // Remove acting admin reference
                        'featured_at' => null, // Clear timestamp
                    ];

                    // Persist unfeature metadata to database
                    $eventModel->update_event_data($queryCondition, $updateData); // Update event record
                }

                // Commit transaction after successful updates
                DB::commit(); // Finalize changes
            } catch (\Exception $transactionException) {
                // Roll back transaction on any failure to maintain data integrity
                DB::rollBack(); // Undo partial updates

                // Re-throw exception to be handled by outer catch block
                throw $transactionException; // Maintain original stack trace
            }

            // Prepare success response payload
            $result = [
                'success' => true, // Operation succeeded
                'data' => [
                    'message' => $action === 'feature' ? 'Event featured successfully' : 'Event unfeatured successfully', // Contextual message
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in SuperAdminController::toggleEventFeaturedStatus'); // Method identifier
            Log::info($e->getMessage()); // Exception message
            Log::info($e); // Full stack trace

            // Prepare generic server error response payload
            $result = [
                'success' => false, // Operation failed
                'error' => [
                    'error_code' => 'E002', // General server error code
                    'error_message' => 'An error occurred while updating featured status', // Client-facing message
                ],
            ];

            // Return 500 Internal Server Error response
            return response()->json($result, 500);
        }

        // Return success response for feature/unfeature action
        return response()->json($result);
    }

    /**
     * Get CMS pages list with pagination, search, and filters.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCmsPagesList(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'page' => 'nullable|integer|min:1', // Page number for pagination
            'per_page' => 'nullable|integer|min:1|max:100', // Items per page (max 100)
            'search' => 'nullable|string|max:255', // Search term for title
            'is_active' => 'nullable|boolean', // Filter by active status
            'sort_by' => 'nullable|in:title,created_at', // Sort field
            'sort_order' => 'nullable|in:asc,desc', // Sort direction
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize CmsPageModel to perform database operations
                $cmsPageModel = new CmsPageModel;

                // Set default values for pagination
                $page = isset($data['page']) ? (int) $data['page'] : 1; // Default page 1
                $perPage = isset($data['per_page']) ? (int) $data['per_page'] : 30; // Default 30 per page

                // Build query conditions based on filters
                $query = CmsPageModel::query();

                // Apply search filter if provided
                if (! empty($data['search'])) {
                    $query->where('title', 'like', '%'.$data['search'].'%'); // Search in title
                }

                // Apply active status filter if provided
                if (isset($data['is_active'])) {
                    $query->where('is_active', (bool) $data['is_active']); // Filter by active status
                }

                // Apply sorting
                $sortBy = isset($data['sort_by']) ? $data['sort_by'] : 'created_at'; // Default sort by created_at
                $sortOrder = isset($data['sort_order']) ? $data['sort_order'] : 'desc'; // Default descending
                $query->orderBy($sortBy, $sortOrder); // Apply sorting

                // Get total count before pagination
                $totalRecords = $query->count(); // Total matching records

                // Apply pagination
                $cmsPages = $query->skip(($page - 1) * $perPage)
                    ->take($perPage)
                    ->get(); // Get paginated results

                // Format CMS pages for response
                $cmsPagesArray = [];
                foreach ($cmsPages as $cmsPage) {
                    $cmsPageData = [
                        'cms_page_id' => (int) $cmsPage->cms_page_id,
                        'title' => $cmsPage->title,
                        'slug' => $cmsPage->slug,
                        'content' => $cmsPage->content, // Rich text HTML content
                        'is_active' => (bool) $cmsPage->is_active,
                    ];
                    $cmsPagesArray[] = $cmsPageData;
                }

                // Calculate pagination metadata
                $totalPages = $totalRecords > 0 ? (int) ceil($totalRecords / $perPage) : 0; // Total pages
                $nextPage = $page < $totalPages ? $page + 1 : null; // Next page number or null
                $prevPage = $page > 1 ? $page - 1 : null; // Previous page number or null

                // Format pagination data
                $paginationData = [
                    'total_records' => $totalRecords,
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                    'next_page' => $nextPage,
                    'prev_page' => $prevPage,
                ];

                // Return success response with CMS pages list and pagination
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'CMS pages retrieved successfully',
                        'cms_pages' => $cmsPagesArray,
                        'pagination' => $paginationData,
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in SuperAdminController::getCmsPagesList');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving CMS pages',
                    ],
                ];

                // Return 500 Internal Server Error response
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
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get single CMS page details by ID.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCmsPageDetails(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'cms_page_id' => 'required|integer|exists:cms_pages,cms_page_id', // CMS page ID must exist
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize CmsPageModel to perform database operations
                $cmsPageModel = new CmsPageModel;

                // Build query condition to find CMS page
                $queryCondition = [
                    'cms_page_id' => (int) $data['cms_page_id'],
                ];

                // Get CMS page from database
                $cmsPage = $cmsPageModel->get_cms_page($queryCondition);

                // Check if CMS page exists
                if (empty($cmsPage)) {
                    // Return not found error if CMS page doesn't exist
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'CMS page not found',
                        ],
                    ];

                    // Return 404 Not Found response
                    return response()->json($result, 404);
                }

                // Format CMS page data for response
                $cmsPageData = [
                    'cms_page_id' => (int) $cmsPage->cms_page_id,
                    'title' => $cmsPage->title,
                    'slug' => $cmsPage->slug,
                    'content' => $cmsPage->content, // Rich text HTML content
                    'is_active' => (bool) $cmsPage->is_active,
                ];

                // Return success response with CMS page details
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'CMS page retrieved successfully',
                        'cms_page' => $cmsPageData,
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in SuperAdminController::getCmsPageDetails');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while retrieving CMS page',
                    ],
                ];

                // Return 500 Internal Server Error response
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
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Create new CMS page.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function createCmsPage(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'title' => 'required|string|max:255|unique:cms_pages,title', // Title must be unique
            'content' => 'required|string', // Content is required (rich text HTML)
            'is_active' => 'nullable|boolean', // Active status optional, defaults to true
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize CmsPageModel to perform database operations
                $cmsPageModel = new CmsPageModel;

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Auto-generate slug from title if not provided
                    $slug = $cmsPageModel->generateSlug($data['title']);

                    // Prepare CMS page data for creation
                    $cmsPageData = [
                        'title' => $data['title'],
                        'slug' => $slug, // Auto-generated unique slug
                        'content' => $data['content'], // Rich text HTML content
                        'is_active' => isset($data['is_active']) ? (bool) $data['is_active'] : true, // Default to active
                    ];

                    // Create CMS page record in the database
                    $cmsPage = $cmsPageModel->create_cms_page($cmsPageData);

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Format created CMS page data for response
                $cmsPageResponse = [
                    'cms_page_id' => (int) $cmsPage->cms_page_id,
                    'title' => $cmsPage->title,
                    'slug' => $cmsPage->slug,
                    'content' => $cmsPage->content,
                    'is_active' => (bool) $cmsPage->is_active,
                ];

                // Return success response with created CMS page data
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'CMS page created successfully',
                        'cms_page' => $cmsPageResponse,
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in SuperAdminController::createCmsPage');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while creating CMS page',
                    ],
                ];

                // Return 500 Internal Server Error response
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
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Update existing CMS page.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateCmsPage(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'cms_page_id' => 'required|integer|exists:cms_pages,cms_page_id', // CMS page ID must exist
            'title' => 'nullable|string|max:255|unique:cms_pages,title,'.(isset($data['cms_page_id']) ? $data['cms_page_id'] : 'NULL').',cms_page_id', // Title unique except current page
            'slug' => 'nullable|string|max:255|unique:cms_pages,slug,'.(isset($data['cms_page_id']) ? $data['cms_page_id'] : 'NULL').',cms_page_id', // Slug unique except current page
            'content' => 'nullable|string', // Content optional for partial updates
            'is_active' => 'nullable|boolean', // Active status optional
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize CmsPageModel to perform database operations
                $cmsPageModel = new CmsPageModel;

                // Build query condition to find CMS page
                $queryCondition = [
                    'cms_page_id' => (int) $data['cms_page_id'],
                ];

                // Check if CMS page exists
                $existingPage = $cmsPageModel->get_cms_page($queryCondition);
                if (empty($existingPage)) {
                    // Return not found error if CMS page doesn't exist
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'CMS page not found',
                        ],
                    ];

                    // Return 404 Not Found response
                    return response()->json($result, 404);
                }

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Prepare update data array
                    $updateData = [];

                    // Update title if provided
                    if (isset($data['title'])) {
                        $updateData['title'] = $data['title'];
                    }

                    // Handle slug generation: if title is updated, regenerate slug (unless slug is explicitly provided)
                    if (isset($data['title']) && ! isset($data['slug'])) {
                        // Regenerate slug from new title
                        $updateData['slug'] = $cmsPageModel->generateSlug($data['title'], (int) $data['cms_page_id']);
                    } elseif (isset($data['slug'])) {
                        // Use provided slug
                        $updateData['slug'] = $data['slug'];
                    }

                    // Update content if provided
                    if (isset($data['content'])) {
                        $updateData['content'] = $data['content'];
                    }

                    // Update active status if provided
                    if (isset($data['is_active'])) {
                        $updateData['is_active'] = (bool) $data['is_active'];
                    }

                    // Update CMS page record in the database
                    if (! empty($updateData)) {
                        $cmsPageModel->update_cms_page($queryCondition, $updateData);
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Get updated CMS page from database
                $updatedPage = $cmsPageModel->get_cms_page($queryCondition);

                // Format updated CMS page data for response
                $cmsPageResponse = [
                    'cms_page_id' => (int) $updatedPage->cms_page_id,
                    'title' => $updatedPage->title,
                    'slug' => $updatedPage->slug,
                    'content' => $updatedPage->content,
                    'is_active' => (bool) $updatedPage->is_active,
                ];

                // Return success response with updated CMS page data
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'CMS page updated successfully',
                        'cms_page' => $cmsPageResponse,
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in SuperAdminController::updateCmsPage');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while updating CMS page',
                    ],
                ];

                // Return 500 Internal Server Error response
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
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Delete CMS page by ID.
     *
     * @param  int  $cms_page_id
     * @return \Illuminate\Http\JsonResponse
     */
    public function deleteCmsPage(Request $request, $cms_page_id)
    {
        // Initialize result array to store response data
        $result = [];

        // Define validation rules for the route parameter
        $rules = [
            'cms_page_id' => 'required|integer|exists:cms_pages,cms_page_id', // CMS page ID must exist
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make(['cms_page_id' => $cms_page_id], $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize CmsPageModel to perform database operations
                $cmsPageModel = new CmsPageModel;

                // Build query condition to find CMS page
                $queryCondition = [
                    'cms_page_id' => (int) $cms_page_id,
                ];

                // Check if CMS page exists
                $existingPage = $cmsPageModel->get_cms_page($queryCondition);
                if (empty($existingPage)) {
                    // Return not found error if CMS page doesn't exist
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E404',
                            'error_message' => 'CMS page not found',
                        ],
                    ];

                    // Return 404 Not Found response
                    return response()->json($result, 404);
                }

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Delete CMS page record from the database (hard delete)
                    $cmsPageModel->delete_cms_page($queryCondition);

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Return success response
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'CMS page deleted successfully',
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in SuperAdminController::deleteCmsPage');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while deleting CMS page',
                    ],
                ];

                // Return 500 Internal Server Error response
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
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }
}
