<?php

namespace App\Http\Controllers\Host;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;
use App\Models\HostUserModel;
use App\Models\UserModel;
use App\Models\BusinessModel;
use App\Models\EventModel;
use App\Models\TicketModel;
use App\Models\OrderModel;
use App\Services\StripeService;
use App\Services\PlatformFeeService;
use App\Services\BrevoEmailService;

class HostUserController extends Controller
{
    /**
     * Host User Registration
     * 
     * Creates a new Host User account (Business or Personal account type).
     * For Business accounts, creates business record immediately.
     * For Personal accounts, business record is created later in profile.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function hostUserRegister(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = array(
            'first_name' => 'required',
            'last_name' => 'required',
            'email' => 'required|email',
            'password' => array(
                'required',
                'min:8',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/',
            ),
            'confirm_password' => 'required|same:password',
            'otp' => 'required|string|size:6',
            'state' => 'nullable|string|max:255',
            'zipcode' => 'nullable|string|max:20',
            'gender' => 'nullable|in:Male,Female,Other,Prefer Not to say',
            'dob' => 'nullable|date',
        );

        // Define custom validation error messages
        $messages = array(
            'password.regex' => 'The password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&), and be at least 8 characters long.',
        );

        // Perform validation using Laravel Validator with custom messages
        $validation = Validator::make($data, $rules, $messages);

        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize model to perform database operations
                $hostUserModel = new HostUserModel();

                // Prepare query condition to find host user by email
                $queryCondition = array('email' => $data['email']);
                
                // Get host user record from database by email (could be temporary registration record)
                $existingHostUser = $hostUserModel->get_host_user($queryCondition);
                
                // Check if host user exists and email verification is complete
                if ($existingHostUser && $existingHostUser->is_email_verification_complete) {
                    // Email already exists as a fully registered host user, return error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Email already registered'
                        )
                    );
                    
                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }
                
                // Check if OTP process was initiated
                if (!$existingHostUser || !$existingHostUser->is_registration_otp_initiated || empty($existingHostUser->registration_otp)) {
                    // OTP process not initiated, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'OTP verification not initiated. Please request a registration OTP first.'
                        )
                    );
                    
                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }
                
                // Check OTP expiration (10 minutes) using updated_at timestamp
                $otpExpirationTime = $existingHostUser->updated_at->copy()->addMinutes(10);
                $currentTime = Carbon::now();
                
                if ($currentTime->gt($otpExpirationTime)) {
                    // OTP has expired, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'OTP has expired. Please request a new registration OTP.'
                        )
                    );
                    
                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }
                
                // Verify OTP using Hash::check()
                if (!Hash::check($data['otp'], $existingHostUser->registration_otp)) {
                    // OTP is incorrect, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Invalid OTP code'
                        )
                    );
                    
                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }
                
                // OTP is valid, proceed with host user registration

                // Hash password using Laravel Hash facade before storing
                // IMPORTANT: Must hash manually because update_host_user_data() uses Model::where()->update()
                // which bypasses model casts. Even for create_host_user(), we hash explicitly for consistency.
                $hashedPassword = Hash::make($data['password']);

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Prepare host user data (no business at registration)
                    $hostUserData = array(
                        'first_name' => $data['first_name'],
                        'last_name' => $data['last_name'],
                        'email' => $data['email'],
                        'password' => $hashedPassword,
                        'state' => $data['state'] ?? null,
                        'zipcode' => $data['zipcode'] ?? null,
                        'gender' => $data['gender'] ?? 'Prefer Not to say',
                        'dob' => $data['dob'] ?? null,
                        'business_id' => null,
                        'is_primary' => false,
                        'is_registration_otp_initiated' => false,
                        'registration_otp' => null,
                    );

                    if ($existingHostUser && !$existingHostUser->is_email_verification_complete) {
                        // Pending registration host user exists, update with full registration data
                        $updateCondition = array('host_user_id' => $existingHostUser->host_user_id);
                        $hostUserData['is_email_verification_complete'] = true; // Mark email verification as complete
                        $hostUserModel->update_host_user_data($updateCondition, $hostUserData);
                    } else {
                        $hostUserData['is_email_verification_complete'] = true;
                        $hostUser = $hostUserModel->create_host_user($hostUserData);
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Return success response with created account confirmation
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Account created successfully',
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::hostUserRegister');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client with 500 Internal Server Error status code
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request'
                    )
                );

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors with 400 status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Host User Login
     * 
     * Authenticates Host User using email and password, generates Laravel Sanctum token,
     * and returns user information. Supports Remember Me functionality for extended sessions.
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function hostUserLogin(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = array(
            'email' => 'required|email', // Email is mandatory and must be valid email format
            'password' => 'required', // Password is mandatory
            'remember_me' => 'nullable', // Remember Me is optional field (can be boolean, string "true", or string "1")
        );

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize models to perform database operations
                $hostUserModel = new HostUserModel();
                $businessModel = new BusinessModel();

                // Query host_users table by email to find user
                $queryCondition = array(
                    'email' => $data['email'], // Find user by email address
                );

                // Get host user record from database
                $hostUser = $hostUserModel->get_host_user($queryCondition);

                // Check if user exists, if not return authentication error
                if (empty($hostUser) || $hostUser == null) {
                    // User not found, return authentication error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or password'
                        )
                    );

                    // Return JSON response with 401 Unauthorized status code
                    return response()->json($result, 401);
                }

                // Verify password using Hash::check() against stored password hash
                $passwordValid = Hash::check($data['password'], $hostUser->password);

                // Check if password is correct, if not return authentication error
                if (!$passwordValid) {
                    // Password is incorrect, return authentication error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or password'
                        )
                    );

                    // Return JSON response with 401 Unauthorized status code
                    return response()->json($result, 401);
                }

                // Prevent blocked hosts from logging in and return specific reason if available
                if ($hostUser->is_blocked) {
                    // Determine block message: prioritized stored reason or default notice
                    $blockMessage = !empty($hostUser->blocked_reason) ? $hostUser->blocked_reason : 'You are blocked by the admin. Please contact support.';

                    // Return block response with authorization error code
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004', // Business logic violation
                            'error_message' => $blockMessage, // Detailed reason for block
                        )
                    );

                    // Respond with 403 Forbidden since access is explicitly denied
                    return response()->json($result, 403);
                }

                // Determine token expiration based on remember_me option
                // Handle flexible remember_me values: boolean true, string "true", or string "1"
                $rememberMe = false; // Initialize remember_me flag as false
                if (isset($data['remember_me'])) {
                    // Check if remember_me is boolean true, string "true", or string "1"
                    $rememberMe = ($data['remember_me'] === true || $data['remember_me'] === 'true' || $data['remember_me'] === '1' || $data['remember_me'] === 1);
                }

                // Generate Laravel Sanctum token with appropriate expiration
                if ($rememberMe) {
                    // If remember_me is true, token expires in 30 days (for extended sessions)
                    $token = $hostUser->createToken('host-user-token', ['*'], now()->addDays(30))->plainTextToken;
                } else {
                    // If remember_me is false or not set, token expires in 1 hour (for regular sessions)
                    $token = $hostUser->createToken('host-user-token', ['*'], now()->addHour())->plainTextToken;
                }

                // Prepare user information array for response
                $userInfo = array(
                    'host_user_id' => $hostUser->host_user_id, // User ID
                    'first_name' => $hostUser->first_name, // First name
                    'last_name' => $hostUser->last_name, // Last name
                    'email' => $hostUser->email, // Email address
                    'profile_image' => $hostUser->profile_image, // Profile image path (if exists)
                    'phone_number' => $hostUser->phone_number, // Phone number (if exists)
                    'website' => $hostUser->website, // Website (if exists)
                    'city' => $hostUser->city, // City (if exists)
                    'state' => $hostUser->state, // State (if exists)
                    'country' => $hostUser->country, // Country (if exists)
                    'zipcode' => $hostUser->zipcode, // Zipcode (if exists)
                    'business_id' => $hostUser->business_id, // Business ID (if linked to business)
                    'is_primary' => $hostUser->is_primary, // Is primary business owner flag
                );

                // Check if user is linked to a business, include business information
                if (!empty($hostUser->business_id) && $hostUser->business_id != null) {
                    // Query business record to get business information
                    $businessQueryCondition = array(
                        'business_id' => $hostUser->business_id, // Find business by business ID
                    );

                    // Get business record from database
                    $business = $businessModel->get_business($businessQueryCondition);

                    // Check if business exists, add business information to user info
                    if (!empty($business) && $business != null) {
                        if (!empty($business->business_intersection_id)) {
                            $business->load('businessIntersection');
                        }
                        $userInfo['business'] = array(
                            'business_name' => $business->business_name, // Business name
                            'account_type' => $business->account_type, // Account type (business or personal)
                            'business_intersection_id' => $business->business_intersection_id,
                            'other_business_intersection' => $business->other_business_intersection,
                        );
                        if (!empty($business->businessIntersection)) {
                            $userInfo['business']['business_intersection'] = array(
                                'id' => $business->businessIntersection->id,
                                'name' => $business->businessIntersection->name,
                            );
                        }
                    }
                }

                // Return success response with token and user information
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Logged In Successfully',
                        'user_info' => $userInfo,
                        'token' => $token,
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::hostUserLogin');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client with 500 Internal Server Error status code
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request'
                    )
                );

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors with 400 status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Update Host User Profile
     * 
     * Updates personal information for authenticated Host User including profile image,
     * name, phone number, website, and location fields (city/state/country). Email address is readonly and cannot be updated.
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function updateHostUserProfile(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                )
            );

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get authenticated user's host_user_id
        $hostUserId = $authenticatedUser->host_user_id;

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        // Note: Email is readonly and not included in validation/update
        $rules = array(
            'first_name' => 'required|string|max:255', // First name is mandatory, string, max 255 characters
            'last_name' => 'required|string|max:255', // Last name is mandatory, string, max 255 characters
            'phone_number' => 'nullable|string|max:255', // Phone number is optional, string, max 255 characters
            'website' => 'nullable|url|max:255', // Website is optional, must be valid URL, max 255 characters
            'city' => 'nullable|string|max:255', // City is optional, string, max 255 characters
            'state_id' => 'nullable|integer|exists:states,id', // State ID is optional, must reference states table when provided
            'state' => 'nullable|string|max:255', // State is optional (kept for backward compatibility and zipcode validation)
            'country' => 'nullable|string|max:255', // Country is optional
            'zipcode' => 'nullable|string|max:20', // Zipcode is optional
            'gender' => 'nullable|in:Male,Female,Other,Prefer Not to say', // Gender is optional, must be one of the enum values
            'dob' => 'nullable|date', // Date of birth is optional, must be valid date
            'profile_image' => 'nullable|image|mimes:jpeg,jpg,gif,png|max:2048', // Profile image is optional, must be image, formats: jpeg/jpg/gif/png, max 2MB (2048 KB)
        );

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // If both state and zipcode are provided, validate state and city against zipcode via Zippopotam API
                if (!empty($data['state']) && !empty($data['zipcode'])) {
                    $zipcode = trim($data['zipcode']);
                    $userState = trim($data['state']);
                    $userCity = isset($data['city']) ? trim($data['city']) : '';

                    $zippopotamUrl = 'https://api.zippopotam.us/us/' . $zipcode;

                    try {
                        // Disable SSL verification to avoid local certificate issues when calling external API
                        $response = Http::withoutVerifying()->timeout(10)->get($zippopotamUrl);
                    } catch (\Exception $e) {
                        Log::warning('Zippopotam lookup failed in updateHostUserProfile', array(
                            'zipcode' => $zipcode,
                            'error' => $e->getMessage(),
                        ));

                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ),
                        );

                        return response()->json($result, 400);
                    }

                    if ($response->failed()) {
                        Log::warning('Zippopotam returned non-success status in updateHostUserProfile', array(
                            'zipcode' => $zipcode,
                            'status' => $response->status(),
                            'body' => $response->body(),
                        ));

                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ),
                        );

                        return response()->json($result, 400);
                    }

                    $payload = $response->json();

                    if (
                        empty($payload) ||
                        !isset($payload['places']) ||
                        empty($payload['places']) ||
                        !isset($payload['places'][0]['state']) ||
                        !isset($payload['places'][0]['place name'])
                    ) {
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ),
                        );

                        return response()->json($result, 400);
                    }

                    // Require city when validating zipcode/state
                    if ($userCity === '') {
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ),
                        );

                        return response()->json($result, 400);
                    }

                    $apiState = trim($payload['places'][0]['state']);
                    $apiCity = trim($payload['places'][0]['place name']);

                    if (
                        strcasecmp($userState, $apiState) !== 0 ||
                        strcasecmp($userCity, $apiCity) !== 0
                    ) {
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ),
                        );

                        return response()->json($result, 400);
                    }
                }

                // Initialize model to perform database operations
                $hostUserModel = new HostUserModel();
                $userModel = new UserModel();

                // Use authenticated user directly instead of querying database again
                // This eliminates redundant database query and improves performance
                $currentHostUser = $authenticatedUser;

                // Query condition for host update operation
                $queryCondition = array(
                    'host_user_id' => $hostUserId, // Find user by host_user_id
                );

                // Initialize update data array to store fields to update
                $updateData = array();

                // Add text fields to update data array
                $updateData['first_name'] = $data['first_name']; // First name
                $updateData['last_name'] = $data['last_name']; // Last name

                // Add optional fields to update data array if provided
                if (isset($data['phone_number'])) {
                    $updateData['phone_number'] = $data['phone_number']; // Phone number (can be null)
                }

                if (isset($data['website'])) {
                    $updateData['website'] = $data['website']; // Website (can be null)
                }

                if (isset($data['city'])) {
                    $updateData['city'] = $data['city']; // City (can be null)
                }

                if (isset($data['state_id'])) {
                    $updateData['state_id'] = $data['state_id']; // State ID (can be null)
                }

                if (isset($data['state'])) {
                    $updateData['state'] = $data['state']; // State (can be null)
                }

                if (isset($data['country'])) {
                    $updateData['country'] = $data['country']; // Country (can be null)
                }

                if (isset($data['zipcode'])) {
                    $updateData['zipcode'] = $data['zipcode']; // Zipcode (can be null)
                }

                if (isset($data['gender'])) {
                    $updateData['gender'] = $data['gender']; // Gender (can be null)
                }

                if (isset($data['dob'])) {
                    $updateData['dob'] = $data['dob']; // Date of birth (can be null)
                }

                // Handle profile image upload if provided
                if ($request->hasFile('profile_image')) {
                    // Get uploaded file
                    $file = $request->file('profile_image');

                    // Delete old profile image if exists (use authenticated user's current profile image)
                    $oldProfileImage = $currentHostUser->profile_image;
                    if (!empty($oldProfileImage) && Storage::disk('public')->exists($oldProfileImage)) {
                        // Delete old profile image from storage
                        Storage::disk('public')->delete($oldProfileImage);
                    }

                    // Generate directory path for storing profile image
                    $directory = "host_users/{$hostUserId}";

                    // Generate filename with timestamp to ensure uniqueness
                    $timestamp = time(); // Current timestamp
                    $extension = $file->getClientOriginalExtension(); // Get original file extension
                    $filename = "profile_image_{$timestamp}.{$extension}"; // Format: profile_image_1234567890.jpg

                    // Store file in public disk under host_users/{host_user_id}/ directory
                    $filePath = $file->storeAs($directory, $filename, 'public');

                    // Add file path to update data array
                    $updateData['profile_image'] = $filePath;
                }
                
                // Begin transaction to keep host and user (if exists) in sync
                DB::beginTransaction();

                try {
                    // Update host user record in database using model method
                    $updateResult = $hostUserModel->update_host_user_data($queryCondition, $updateData);

                    // If a matching end user exists with the same email, sync basic profile fields (and profile image)
                    $hostEmail = $currentHostUser->email;
                    $userLookupCondition = array('email' => $hostEmail);

                    $user = $userModel->get_user($userLookupCondition);
                    if ($user) {
                        $userUpdateData = array(
                            'first_name'      => $updateData['first_name'],
                            'last_name'       => $updateData['last_name'],
                            'contact_number'  => $updateData['phone_number'] ?? null,
                            'city'            => $updateData['city'] ?? null,
                            'state_id'        => $updateData['state_id'] ?? null,
                            'state'           => $updateData['state'] ?? null,
                            'country'         => $updateData['country'] ?? null,
                            'zipcode'         => $updateData['zipcode'] ?? null,
                            'gender'          => $updateData['gender'] ?? null,
                            'dob'             => $updateData['dob'] ?? null,
                        );

                        // If host profile image was updated, copy it to user storage and sync path
                        if (isset($updateData['profile_image'])) {
                            $sourcePath = $updateData['profile_image'];
                            $userDirectory = 'users/' . $user->user_id;

                            if (!Storage::disk('public')->exists($userDirectory)) {
                                Storage::disk('public')->makeDirectory($userDirectory);
                            }

                            $filename = basename($sourcePath);
                            $userImagePath = $userDirectory . '/' . $filename;

                            // Delete old user profile image if it exists
                            $oldUserProfileImage = $user->profile_image;
                            if (!empty($oldUserProfileImage) && Storage::disk('public')->exists($oldUserProfileImage)) {
                                Storage::disk('public')->delete($oldUserProfileImage);
                            }

                            // Copy host profile image file to user directory
                            if (Storage::disk('public')->exists($sourcePath)) {
                                Storage::disk('public')->copy($sourcePath, $userImagePath);
                                $userUpdateData['profile_image'] = $userImagePath;
                            }
                        }

                        $userModel->update_user_data($userLookupCondition, $userUpdateData);
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }

                // Check if host update was successful (at least one row affected)
                if ($updateResult > 0) {
                    // Refresh authenticated user model to get fresh data from database after update
                    // This is more efficient than querying the database again
                    $authenticatedUser->refresh();
                    $updatedHostUser = $authenticatedUser;

                    // Prepare user information array for response
                    $userInfo = array(
                        'host_user_id' => $updatedHostUser->host_user_id, // User ID
                        'first_name' => $updatedHostUser->first_name, // First name
                        'last_name' => $updatedHostUser->last_name, // Last name
                        'email' => $updatedHostUser->email, // Email address (readonly, not updated)
                        'profile_image' => $updatedHostUser->profile_image, // Profile image path (if exists)
                        'phone_number' => $updatedHostUser->phone_number, // Phone number (if exists)
                        'website' => $updatedHostUser->website, // Website (if exists)
                        'city' => $updatedHostUser->city, // City (if exists)
                        'state_id' => $updatedHostUser->state_id, // State ID (if exists)
                        'state' => $updatedHostUser->state, // State (if exists)
                        'country' => $updatedHostUser->country, // Country (if exists)
                        'zipcode' => $updatedHostUser->zipcode, // Zipcode (if exists)
                        'gender' => $updatedHostUser->gender, // Gender (if exists)
                        'dob' => $updatedHostUser->dob, // Date of birth (if exists)
                    );

                    // Return success response with updated user information
                    $result = array(
                        'success' => true,
                        'data' => array(
                            'message' => 'Profile updated successfully',
                            'user_info' => $userInfo,
                        )
                    );
                } else {
                    // Update failed (no rows affected), return error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E002',
                            'error_message' => 'Failed to update profile'
                        )
                    );

                    // Return JSON response with 500 Internal Server Error status code
                    return response()->json($result, 500);
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::updateHostUserProfile');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client with 500 Internal Server Error status code
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while updating your profile'
                    )
                );

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors with 400 status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Update Host User Business Information
     * 
     * Creates or updates business information for authenticated Host User.
     * For Personal accounts without business info: Creates new business record with account_type = 'personal'.
     * For accounts with existing business info: Updates existing business record (preserves account_type).
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function updateHostUserBusinessInfo(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                )
            );

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get authenticated user's host_user_id
        $hostUserId = $authenticatedUser->host_user_id;

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = array(
            'business_name' => 'required|string|max:255', // Business name is mandatory, string, max 255 characters
            'account_type' => 'nullable|in:business,personal', // Account type optional, business or personal
            'business_type' => 'nullable|string|max:255', // Business type is optional, string, max 255 characters
            'industry' => 'nullable|string|max:255', // Industry is optional, string, max 255 characters
            'company_size' => 'nullable|string|max:255', // Company size is optional, string, max 255 characters
            'tax_id' => 'nullable|string|max:255', // Tax ID is optional, string, max 255 characters
            'business_street_address' => 'nullable|string|max:255', // Street address is optional, string, max 255 characters
            'business_city' => 'nullable|string|max:255', // City is optional, string, max 255 characters
            'business_state' => 'nullable|string|max:255', // State is optional, string, max 255 characters
            'business_zip_code' => 'nullable|string|max:255', // ZIP code is optional, string, max 255 characters
            'business_country_id' => 'nullable|integer|exists:countries,country_id', // Country ID is optional, must exist in countries table
            'business_intersection_id' => 'nullable|integer|exists:business_intersections,id', // Optional intersection type
            'other_business_intersection' => 'nullable|string|max:255', // Custom community name when "Others" is selected
        );

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize models to perform database operations
                $hostUserModel = new HostUserModel();
                $businessModel = new BusinessModel();

                // Use authenticated user directly instead of querying database again
                // This eliminates redundant database query and improves performance
                $currentHostUser = $authenticatedUser;

                // Query condition for update operation
                $queryCondition = array(
                    'host_user_id' => $hostUserId, // Find user by host_user_id
                );

                // Prepare business data array with fields from request
                $businessData = array(
                    'business_name' => $data['business_name'], // Business name (required)
                );

                // Add optional fields to business data array if provided
                if (array_key_exists('account_type', $data) && in_array($data['account_type'], ['business', 'personal'], true)) {
                    $businessData['account_type'] = $data['account_type'];
                }

                if (isset($data['business_type']) && !empty($data['business_type'])) {
                    $businessData['business_type'] = $data['business_type']; // Business type
                }

                if (isset($data['industry']) && !empty($data['industry'])) {
                    $businessData['industry'] = $data['industry']; // Industry
                }

                if (isset($data['company_size']) && !empty($data['company_size'])) {
                    $businessData['company_size'] = $data['company_size']; // Company size
                }

                if (isset($data['tax_id']) && !empty($data['tax_id'])) {
                    $businessData['tax_id'] = $data['tax_id']; // Tax ID
                }

                if (isset($data['business_street_address']) && !empty($data['business_street_address'])) {
                    $businessData['business_street_address'] = $data['business_street_address']; // Street address
                }

                if (isset($data['business_city']) && !empty($data['business_city'])) {
                    $businessData['business_city'] = $data['business_city']; // City
                }

                if (isset($data['business_state']) && !empty($data['business_state'])) {
                    $businessData['business_state'] = $data['business_state']; // State
                }

                if (isset($data['business_zip_code']) && !empty($data['business_zip_code'])) {
                    $businessData['business_zip_code'] = $data['business_zip_code']; // ZIP code
                }

                if (isset($data['business_country_id']) && !empty($data['business_country_id'])) {
                    $businessData['business_country_id'] = $data['business_country_id']; // Country ID
                }

                if (array_key_exists('business_intersection_id', $data)) {
                    $businessData['business_intersection_id'] = $data['business_intersection_id'];
                }
                if (array_key_exists('other_business_intersection', $data)) {
                    $businessData['other_business_intersection'] = $data['other_business_intersection'];
                }

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Check if business exists (user has business_id)
                    if (!empty($currentHostUser->business_id) && $currentHostUser->business_id != null) {
                        // Business exists - UPDATE existing business record
                        // Get existing business to preserve account_type
                        $businessQueryCondition = array(
                            'business_id' => $currentHostUser->business_id, // Find business by business_id
                        );

                        // Get existing business record from database
                        $existingBusiness = $businessModel->get_business($businessQueryCondition);

                        // Check if business exists, if not return error
                        if (empty($existingBusiness) || $existingBusiness == null) {
                            // Business not found, return error
                            $result = array(
                                'success' => false,
                                'error' => array(
                                    'error_code' => 'E404',
                                    'error_message' => 'Business not found'
                                )
                            );

                            // Rollback transaction on error
                            DB::rollBack();

                            // Return JSON response with 404 Not Found status code
                            return response()->json($result, 404);
                        }

                        // Update business record with new data (account_type updated if provided in request)
                        $updateResult = $businessModel->update_business_data($businessQueryCondition, $businessData);

                        // Check if update was successful (at least one row affected)
                        if ($updateResult > 0) {
                            // Get updated business record from database to return fresh data
                            $updatedBusiness = $businessModel->get_business($businessQueryCondition);

                            // Load country relationship if business_country_id exists
                            if (!empty($updatedBusiness->business_country_id) && $updatedBusiness->business_country_id != null) {
                                // Load country relationship using Eloquent
                                $updatedBusiness->load('country');
                            }
                            if (!empty($updatedBusiness->business_intersection_id)) {
                                $updatedBusiness->load('businessIntersection');
                            }

                            // Commit transaction if all operations succeed
                            DB::commit();

                            // Prepare business information array for response
                            $businessInfo = array(
                                'business_id' => $updatedBusiness->business_id, // Business ID
                                'business_name' => $updatedBusiness->business_name, // Business name
                                'account_type' => $updatedBusiness->account_type, // Account type (preserved)
                                'business_type' => $updatedBusiness->business_type, // Business type
                                'industry' => $updatedBusiness->industry, // Industry
                                'company_size' => $updatedBusiness->company_size, // Company size
                                'tax_id' => $updatedBusiness->tax_id, // Tax ID
                                'business_street_address' => $updatedBusiness->business_street_address, // Street address
                                'business_city' => $updatedBusiness->business_city, // City
                                'business_state' => $updatedBusiness->business_state, // State
                                'business_zip_code' => $updatedBusiness->business_zip_code, // ZIP code
                                'business_country_id' => $updatedBusiness->business_country_id, // Country ID
                                'business_intersection_id' => $updatedBusiness->business_intersection_id,
                                'other_business_intersection' => $updatedBusiness->other_business_intersection,
                            );

                            // Add country information if relationship is loaded
                            if (!empty($updatedBusiness->country)) {
                                $businessInfo['country'] = array(
                                    'country_id' => $updatedBusiness->country->country_id, // Country ID
                                    'name' => $updatedBusiness->country->name, // Country name
                                );
                            }
                            if (!empty($updatedBusiness->businessIntersection)) {
                                $businessInfo['business_intersection'] = array(
                                    'id' => $updatedBusiness->businessIntersection->id,
                                    'name' => $updatedBusiness->businessIntersection->name,
                                );
                            }

                            // Return success response with updated business information
                            $result = array(
                                'success' => true,
                                'data' => array(
                                    'message' => 'Business information updated successfully',
                                    'business_info' => $businessInfo,
                                )
                            );
                        } else {
                            // Update failed (no rows affected), return error
                            $result = array(
                                'success' => false,
                                'error' => array(
                                    'error_code' => 'E002',
                                    'error_message' => 'Failed to update business information'
                                )
                            );

                            // Rollback transaction on error
                            DB::rollBack();

                            // Return JSON response with 500 Internal Server Error status code
                            return response()->json($result, 500);
                        }
                    } else {
                        // Business doesn't exist - CREATE new business record
                        $accountType = (isset($data['account_type']) && in_array($data['account_type'], ['business', 'personal'], true))
                            ? $data['account_type']
                            : 'personal';
                        $businessData['account_type'] = $accountType;

                        // Create business record in the database
                        $newBusiness = $businessModel->create_business($businessData);

                        // Update host user record to link with business
                        $hostUserUpdateCondition = array(
                            'host_user_id' => $hostUserId, // Find user by host_user_id
                        );

                        // Prepare update data to link business and set as primary
                        $hostUserUpdateData = array(
                            'business_id' => $newBusiness->business_id, // Link to created business
                            'is_primary' => true, // Set as business owner
                        );

                        // Update host user record with business link
                        $hostUserUpdateResult = $hostUserModel->update_host_user_data($hostUserUpdateCondition, $hostUserUpdateData);

                        // Check if update was successful (at least one row affected)
                        if ($hostUserUpdateResult > 0) {
                            // Get created business record from database to return fresh data
                            $businessQueryCondition = array(
                                'business_id' => $newBusiness->business_id, // Find business by business_id
                            );

                            // Get business record from database
                            $createdBusiness = $businessModel->get_business($businessQueryCondition);

                            // Load country relationship if business_country_id exists
                            if (!empty($createdBusiness->business_country_id) && $createdBusiness->business_country_id != null) {
                                // Load country relationship using Eloquent
                                $createdBusiness->load('country');
                            }
                            if (!empty($createdBusiness->business_intersection_id)) {
                                $createdBusiness->load('businessIntersection');
                            }

                            // Commit transaction if all operations succeed
                            DB::commit();

                            // Prepare business information array for response
                            $businessInfo = array(
                                'business_id' => $createdBusiness->business_id, // Business ID
                                'business_name' => $createdBusiness->business_name, // Business name
                                'account_type' => $createdBusiness->account_type, // Account type (personal)
                                'business_type' => $createdBusiness->business_type, // Business type
                                'industry' => $createdBusiness->industry, // Industry
                                'company_size' => $createdBusiness->company_size, // Company size
                                'tax_id' => $createdBusiness->tax_id, // Tax ID
                                'business_street_address' => $createdBusiness->business_street_address, // Street address
                                'business_city' => $createdBusiness->business_city, // City
                                'business_state' => $createdBusiness->business_state, // State
                                'business_zip_code' => $createdBusiness->business_zip_code, // ZIP code
                                'business_country_id' => $createdBusiness->business_country_id, // Country ID
                                'business_intersection_id' => $createdBusiness->business_intersection_id,
                                'other_business_intersection' => $createdBusiness->other_business_intersection,
                            );

                            // Add country information if relationship is loaded
                            if (!empty($createdBusiness->country)) {
                                $businessInfo['country'] = array(
                                    'country_id' => $createdBusiness->country->country_id, // Country ID
                                    'name' => $createdBusiness->country->name, // Country name
                                );
                            }
                            if (!empty($createdBusiness->businessIntersection)) {
                                $businessInfo['business_intersection'] = array(
                                    'id' => $createdBusiness->businessIntersection->id,
                                    'name' => $createdBusiness->businessIntersection->name,
                                );
                            }

                            // Return success response with created business information
                            $result = array(
                                'success' => true,
                                'data' => array(
                                    'message' => 'Business information updated successfully',
                                    'business_info' => $businessInfo,
                                )
                            );
                        } else {
                            // Update failed (no rows affected), return error
                            $result = array(
                                'success' => false,
                                'error' => array(
                                    'error_code' => 'E002',
                                    'error_message' => 'Failed to link business to user'
                                )
                            );

                            // Rollback transaction on error
                            DB::rollBack();

                            // Return JSON response with 500 Internal Server Error status code
                            return response()->json($result, 500);
                        }
                    }
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::updateHostUserBusinessInfo');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client with 500 Internal Server Error status code
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request'
                    )
                );

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors with 400 status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Update Host User Password
     * 
     * Updates password for authenticated Host User. Validates current password,
     * enforces password requirements (minimum 8 characters with letters and numbers),
     * and updates password in database. Password is automatically hashed by model's cast.
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function updateHostUserPassword(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                )
            );

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get authenticated user's host_user_id
        $hostUserId = $authenticatedUser->host_user_id;

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = array(
            'current_password' => 'required', // Current password is mandatory
            'new_password' => array(
                'required', // New password is mandatory
                'min:8', // New password must be at least 8 characters
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/', // Password must contain: 1 uppercase, 1 lowercase, 1 number, 1 special symbol
            ),
            'confirm_new_password' => 'required|same:new_password', // Confirm new password must match new password
        );

        // Define custom validation error messages
        $messages = array(
            'new_password.regex' => 'The new password must be at least 8 characters long and contain both letters and numbers.',
        );

        // Perform validation using Laravel Validator with custom messages
        $validation = Validator::make($data, $rules, $messages);

        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize models to perform database operations
                $hostUserModel = new HostUserModel();
                $userModel = new UserModel();

                // Use authenticated user directly instead of querying database again
                // This eliminates redundant database query and improves performance
                $currentHostUser = $authenticatedUser;

                // Query condition for update operation
                $queryCondition = array(
                    'host_user_id' => $hostUserId, // Find user by host_user_id
                );

                // Verify current password using Hash::check() against stored password hash
                // Use same approach as login method - access password attribute directly
                // Hash::check() expects: (plain_password, hashed_password)
                // Note: Password is already loaded in authenticated user from token
                $currentPasswordValid = Hash::check($data['current_password'], $currentHostUser->password);

                // Check if current password is correct, if not return authentication error
                if (!$currentPasswordValid) {
                    // Current password is incorrect, return authentication error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Current password is incorrect'
                        )
                    );

                    // Return JSON response with 401 Unauthorized status code
                    return response()->json($result, 401);
                }

                // Prepare update data array with new password
                // IMPORTANT: Since update_host_user_data() uses Model::where()->update() which bypasses model casts,
                // we must manually hash the password using Hash::make() before updating
                // The 'hashed' cast only works with create() or save() on model instances, not with query builder update()
                $updateData = array(
                    'password' => Hash::make($data['new_password']), // Hash the new password manually before updating
                );

                // Begin transaction so host and user (if exists) stay in sync
                DB::beginTransaction();

                try {
                    // Update host user record in database using model method
                    $updateResult = $hostUserModel->update_host_user_data($queryCondition, $updateData);

                    // If an end user exists with the same email, sync the hashed password
                    $hostEmail = $currentHostUser->email;
                    $userLookupCondition = array('email' => $hostEmail);
                    if ($userModel->check_user_exists($userLookupCondition)) {
                        $userModel->update_user_data($userLookupCondition, $updateData);
                    }

                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }

                // Check if update was successful (at least one row affected)
                if ($updateResult > 0) {
                    // Return success response with confirmation message
                    $result = array(
                        'success' => true,
                        'data' => array(
                            'message' => 'Password updated successfully',
                        )
                    );
                } else {
                    // Update failed (no rows affected), return error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E002',
                            'error_message' => 'Failed to update password'
                        )
                    );

                    // Return JSON response with 500 Internal Server Error status code
                    return response()->json($result, 500);
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::updateHostUserPassword');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client with 500 Internal Server Error status code
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while updating your password'
                    )
                );

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors with 400 status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Update Host User Banking Details
     * 
     * Updates banking information for authenticated Host User including account holder name,
     * bank name, account number (encrypted), routing number, and PayPal email.
     * Account number is encrypted using Laravel's Crypt::encryptString() for secure storage
     * and can be decrypted when needed for payment processing.
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function updateHostUserBankingDetails(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                )
            );

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get authenticated user's host_user_id
        $hostUserId = $authenticatedUser->host_user_id;

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        // All fields are optional (nullable) - user can update any combination of fields
        $rules = array(
            'account_holder_name' => 'nullable|string|max:255', // Account holder name is optional, string, max 255 characters
            'bank_name' => 'nullable|string|max:255', // Bank name is optional, string, max 255 characters
            'account_number' => 'nullable|string|max:255', // Account number is optional, string, max 255 characters (will be encrypted before storage)
            'routing_number' => 'nullable|string|max:255', // Routing number is optional, string, max 255 characters
            'paypal_email' => 'nullable|email|max:255', // PayPal email is optional, must be valid email format if provided, max 255 characters
        );

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize model to perform database operations
                $hostUserModel = new HostUserModel();

                // Use authenticated user directly instead of querying database again
                // This eliminates redundant database query and improves performance
                $currentHostUser = $authenticatedUser;

                // Query condition for update operation
                $queryCondition = array(
                    'host_user_id' => $hostUserId, // Find user by host_user_id
                );

                // Initialize update data array to store fields to update
                $updateData = array();

                // Add optional fields to update data array if provided
                // Only update fields that are provided in the request
                if (isset($data['account_holder_name'])) {
                    $updateData['account_holder_name'] = $data['account_holder_name']; // Account holder name (can be null to clear field)
                }

                if (isset($data['bank_name'])) {
                    $updateData['bank_name'] = $data['bank_name']; // Bank name (can be null to clear field)
                }

                // Handle account number encryption if provided
                // Account number must be encrypted using Crypt::encryptString() before storage
                // This is reversible encryption (unlike password hashing) so it can be decrypted for payment processing
                if (isset($data['account_number'])) {
                    // Check if account number is not empty (user wants to update it)
                    if (!empty($data['account_number'])) {
                        // Encrypt account number using Laravel's Crypt::encryptString() for secure storage
                        // This encryption is reversible and can be decrypted using Crypt::decryptString() when needed
                        $updateData['account_number'] = Crypt::encryptString($data['account_number']);
                    } else {
                        // If account number is empty string, set to null to clear the field
                        $updateData['account_number'] = null;
                    }
                }

                if (isset($data['routing_number'])) {
                    $updateData['routing_number'] = $data['routing_number']; // Routing number (can be null to clear field)
                }

                if (isset($data['paypal_email'])) {
                    $updateData['paypal_email'] = $data['paypal_email']; // PayPal email (can be null to clear field)
                }

                // Check if there are any fields to update
                if (!empty($updateData)) {
                    // Update host user record in database using model method
                    $updateResult = $hostUserModel->update_host_user_data($queryCondition, $updateData);

                    // Check if update was successful (at least one row affected)
                    if ($updateResult > 0) {
                        // Refresh authenticated user model to get fresh data from database after update
                        // This is more efficient than querying the database again
                        $authenticatedUser->refresh();
                        $updatedHostUser = $authenticatedUser;

                        // Prepare banking information array for response
                        // Note: account_number is NOT included as it's in model's hidden array for security
                        $bankingInfo = array(
                            'account_holder_name' => $updatedHostUser->account_holder_name, // Account holder name (if exists)
                            'bank_name' => $updatedHostUser->bank_name, // Bank name (if exists)
                            'routing_number' => $updatedHostUser->routing_number, // Routing number (if exists)
                            'paypal_email' => $updatedHostUser->paypal_email, // PayPal email (if exists)
                            // account_number is intentionally excluded - it's in model's hidden array
                        );

                        // Return success response with updated banking information
                        $result = array(
                            'success' => true,
                            'data' => array(
                                'message' => 'Banking details updated successfully',
                                'banking_info' => $bankingInfo,
                            )
                        );
                    } else {
                        // Update failed (no rows affected), return error
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E002',
                                'error_message' => 'Failed to update banking details'
                            )
                        );

                        // Return JSON response with 500 Internal Server Error status code
                        return response()->json($result, 500);
                    }
                } else {
                    // No fields provided to update, return error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E001',
                            'error_message' => 'No banking details provided to update'
                        )
                    );

                    // Return JSON response with 400 Bad Request status code
                    return response()->json($result, 400);
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::updateHostUserBankingDetails');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client with 500 Internal Server Error status code
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while updating your banking details'
                    )
                );

                // Return JSON response with 500 Internal Server Error status code
                return response()->json($result, 500);
            }
        } else {
            // Validation failed, return validation errors with 400 status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E001',
                    'error_message' => $validation->errors()
                )
            );

            // Return JSON response with 400 Bad Request status code
            return response()->json($result, 400);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Host User Profile
     * 
     * Retrieves all profile information for authenticated Host User including personal information,
     * business information (if exists), and banking details. Returns structured response with
     * separate objects for each section to allow frontend to prefill all form fields with one API call.
     * Account number is decrypted and returned for prefilling purposes.
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getHostUserProfile(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                )
            );

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get authenticated user's host_user_id
        $hostUserId = $authenticatedUser->host_user_id;

        try {
            // Initialize model to perform database operations (only for business queries if needed)
            $businessModel = new BusinessModel();

            // Use authenticated user directly instead of querying database again
            // This eliminates redundant database query and improves performance
            $hostUser = $authenticatedUser;

            // Eager load business relationship if not already loaded to avoid N+1 query problem
            // Use load() to load relationship on existing model instance
            if (!$hostUser->relationLoaded('business')) {
                $hostUser->load('business');
            }

            // Build Personal Information Object
            // Extract all personal information fields from host_users table
            $personalInfo = array(
                'first_name' => $hostUser->first_name, // First name (from signup, can be updated)
                'last_name' => $hostUser->last_name, // Last name (from signup, can be updated)
                'email' => $hostUser->email, // Email address (login credential, can be updated)
                'profile_image' => $hostUser->profile_image, // Profile image path (if exists)
                'phone_number' => $hostUser->phone_number, // Phone number (if exists)
                'website' => $hostUser->website, // Website URL (if exists)
                'city' => $hostUser->city, // City information (if exists)
                'state_id' => $hostUser->state_id, // State ID (if exists)
                'state' => $hostUser->state, // State information (if exists, denormalized)
                'country' => $hostUser->country, // Country information (if exists)
                'zipcode' => $hostUser->zipcode, // Zipcode (if exists)
                'gender' => $hostUser->gender, // Gender (if exists)
            );

            // Build Business Information Object
            // Check if user has business_id and business record exists
            $businessInfo = null; // Initialize as null (will be set if business exists)

            if (!empty($hostUser->business_id) && $hostUser->business_id != null) {
                // Use business relationship if already loaded, otherwise query
                $business = $hostUser->business;
                
                // If business relationship is not loaded, query it
                if (empty($business)) {
                    $businessQueryCondition = array(
                        'business_id' => $hostUser->business_id, // Find business by business_id
                    );
                    // Get business record from database
                    $business = $businessModel->get_business($businessQueryCondition);
                }

                // Check if business exists
                if (!empty($business) && $business != null) {
                    // Load country relationship if business_country_id exists
                    if (!empty($business->business_country_id) && $business->business_country_id != null) {
                        // Load country relationship using Eloquent to avoid N+1 query
                        $business->load('country');
                    }
                    if (!empty($business->business_intersection_id)) {
                        $business->load('businessIntersection');
                    }

                    // Prepare business information array for response
                    $businessInfo = array(
                        'business_id' => $business->business_id, // Business ID
                        'business_name' => $business->business_name, // Business name
                        'account_type' => $business->account_type, // Account type (business or personal)
                        'business_type' => $business->business_type, // Business type (if exists)
                        'industry' => $business->industry, // Industry (if exists)
                        'company_size' => $business->company_size, // Company size (if exists)
                        'tax_id' => $business->tax_id, // Tax ID (if exists)
                        'business_street_address' => $business->business_street_address, // Street address (if exists)
                        'business_city' => $business->business_city, // City (if exists)
                        'business_state' => $business->business_state, // State (if exists)
                        'business_zip_code' => $business->business_zip_code, // ZIP code (if exists)
                        'business_country_id' => $business->business_country_id, // Country ID (if exists)
                        'business_intersection_id' => $business->business_intersection_id,
                        'other_business_intersection' => $business->other_business_intersection,
                    );

                    // Add country information if relationship is loaded
                    if (!empty($business->country)) {
                        $businessInfo['country'] = array(
                            'country_id' => $business->country->country_id, // Country ID
                            'name' => $business->country->name, // Country name
                        );
                    } else {
                        // Country relationship not loaded (business_country_id is null or country doesn't exist)
                        $businessInfo['country'] = null; // Set country as null
                    }
                    if (!empty($business->businessIntersection)) {
                        $businessInfo['business_intersection'] = array(
                            'id' => $business->businessIntersection->id,
                            'name' => $business->businessIntersection->name,
                        );
                    } else {
                        $businessInfo['business_intersection'] = null;
                    }
                } else {
                    // Business ID exists but business record not found, set business info as null
                    $businessInfo = null;
                }
            } else {
                // User has no business_id, set business info as null
                $businessInfo = null;
            }

            // Build Banking Information Object
            // Extract all banking information fields from host_users table
            // Account number is in model's hidden array, so we need to make it visible or use getRawOriginal
            $bankingInfo = array(
                'account_holder_name' => $hostUser->account_holder_name, // Account holder name (if exists)
                'bank_name' => $hostUser->bank_name, // Bank name (if exists)
                'routing_number' => $hostUser->routing_number, // Routing number (if exists)
                'paypal_email' => $hostUser->paypal_email, // PayPal email (if exists)
            );

            // Handle account number decryption
            // Account number is encrypted in database and in model's hidden array
            // We need to access the raw value and decrypt it for prefilling
            try {
                // Get raw account number from database (bypassing hidden array)
                // Use getRawOriginal() to get the actual database value without model casts/hidden
                $encryptedAccountNumber = $hostUser->getRawOriginal('account_number');

                // Check if account number exists and is not empty
                if (!empty($encryptedAccountNumber) && $encryptedAccountNumber != null) {
                    // Decrypt account number using Crypt::decryptString() for prefilling
                    // This is reversible encryption, so we can decrypt it when needed
                    $decryptedAccountNumber = Crypt::decryptString($encryptedAccountNumber);

                    // Add decrypted account number to banking info
                    $bankingInfo['account_number'] = $decryptedAccountNumber;
                } else {
                    // Account number is null or empty, set as null in response
                    $bankingInfo['account_number'] = null;
                }
            } catch (\Exception $decryptException) {
                // Log decryption error for debugging purposes
                Log::warning('Failed to decrypt account number in HostUserController::getHostUserProfile');
                Log::warning('Host User ID: ' . $hostUserId);
                Log::warning('Decryption Error: ' . $decryptException->getMessage());

                // Set account number as null if decryption fails (don't fail entire request)
                $bankingInfo['account_number'] = null;
            }

            // Combine all three objects into structured response
            // Return success response with all profile information
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Profile information retrieved successfully',
                    'personal' => $personalInfo, // Personal information object
                    'business' => $businessInfo, // Business information object (null if no business)
                    'banking' => $bankingInfo, // Banking information object
                )
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in HostUserController::getHostUserProfile');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response to the client with 500 Internal Server Error status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving your profile information'
                )
            );

            // Return JSON response with 500 Internal Server Error status code
            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }
    
    /**
     * Get Host User Dashboard
     * 
     * Retrieves dashboard summary data for the authenticated Event Host including:
     * - Active Events count
     * - Completed Events count
     * - Total Revenue
     * - Recent Events list (3 most recent)
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function getHostUserDashboard(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();
        
        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                )
            );
            
            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }
        
        // Get host_user_id from authenticated user for filtering events by owner
        $hostUserId = $authenticatedUser->host_user_id;
        
        try {
            // Compute is_host_business_setup_complete: true if account_type is personal; true if account_type is business and has company name, business type, industry, company size, tax id, business intersection, and business address; else false
            $isHostBusinessSetupComplete = false;
            $hostUser = $authenticatedUser;
            if (!$hostUser->relationLoaded('business')) {
                $hostUser->load('business');
            }
            $business = $hostUser->business;
            if (!empty($business) && !empty($business->account_type)) {
                if ($business->account_type === 'personal') {
                    $isHostBusinessSetupComplete = true;
                } elseif ($business->account_type === 'business') {
                    $hasCompanyName = !empty($business->business_name);
                    $hasBusinessType = !empty($business->business_type);
                    $hasIndustry = !empty($business->industry);
                    $hasCompanySize = !empty($business->company_size);
                    $hasTaxId = isset($business->tax_id) && $business->tax_id !== null && $business->tax_id !== '';
                    $hasBusinessIntersection = !empty($business->business_intersection_id) || !empty($business->other_business_intersection);
                    $hasBusinessAddress = !empty($business->business_street_address);
                    $isHostBusinessSetupComplete = $hasCompanyName && $hasBusinessType && $hasIndustry && $hasCompanySize && $hasTaxId && $hasBusinessIntersection && $hasBusinessAddress;
                }
            }

            // Initialize models to perform database operations
            $eventModel = new EventModel();
            $ticketModel = new TicketModel();
            
            // Get active events count from EventModel
            $activeEventsCount = $eventModel->get_active_events_count($hostUserId);
            
            // Get completed events count from EventModel
            $completedEventsCount = $eventModel->get_completed_events_count($hostUserId);
            
            // Get total revenue from TicketModel
            $totalRevenue = $ticketModel->get_total_revenue_by_host($hostUserId);
            
            // Calculate platform fee deducted and total profit from settled orders
            // Get all settled orders for this host's events
            $settledOrders = OrderModel::with(['orderTickets.ticket.event'])
                ->where('order_status', 'settled')
                ->whereHas('orderTickets.ticket.event', function($query) use ($hostUserId) {
                    $query->where('host_user_id', $hostUserId);
                })
                ->get();
            
            $totalPlatformFeesDeducted = 0;
            $totalProfit = 0;
            $totalStripeChargesDeducted = 0;
            $stripeService = new StripeService();
            
            // Loop through settled orders to calculate platform fees and host payouts
            foreach ($settledOrders as $order) {
                // Get customer paid amount
                $customerPaid = (float)$order->total_amount;
                
                // Get Stripe fee (retrieve from API if missing)
                $stripeFee = (float)($order->stripe_fee ?? 0);
                
                // If Stripe fee is missing, try to retrieve from Stripe API
                if ($stripeFee == 0 && !empty($order->stripe_payment_intent_id)) {
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
                
                // Accumulate total Stripe charges deducted
                $totalStripeChargesDeducted += $stripeFee;
                
                // Calculate net amount after Stripe fee
                $netAfterStripe = $customerPaid - $stripeFee;
                
                // Get platform fee settings for host
                $feeSettings = PlatformFeeService::getFeeForHost($hostUserId);
                
                // Get total ticket quantity for this order
                $ticketCount = $order->orderTickets->sum('quantity');
                
                // Calculate platform fee on net amount (after Stripe fees)
                $platformFee = PlatformFeeService::calculateFee($feeSettings, $netAfterStripe, $ticketCount);
                $totalPlatformFeesDeducted += $platformFee;
                
                // Calculate host payout (net amount minus platform fee) - this is the profit
                $hostPayout = $netAfterStripe - $platformFee;
                $totalProfit += $hostPayout;
            }
            
            // Get recent events (limit 3) from EventModel with relationships loaded
            $recentEvents = $eventModel->get_recent_events($hostUserId, 3);
            
            // Initialize array to store formatted recent events data
            $recentEventsArray = array();
            
            // Process each recent event to calculate additional data and format response
            foreach ($recentEvents as $event) {
                // Calculate event status based on dates and flags
                $eventStatus = 'draft'; // Default status
                if (!$event->is_draft && $event->is_published) {
                    // Event is published, check date-based status using Carbon for reliable date/time comparisons
                    // Get current date and time using Carbon
                    $currentDateTime = Carbon::now(); // Get current date and time
                    
                    // Parse start date and time using Carbon
                    // start_date is cast as 'date' (Y-m-d format), start_time is cast as 'datetime' (Y-m-d H:i:s format)
                    // We need to extract just the time portion from start_time and combine with start_date
                    $startDate = Carbon::parse($event->start_date)->format('Y-m-d'); // Format start date as Y-m-d string
                    $startTime = !empty($event->start_time) ? Carbon::parse($event->start_time)->format('H:i:s') : '00:00:00'; // Extract time portion from start_time
                    $startDateTime = Carbon::parse($startDate . ' ' . $startTime); // Combine start date and time
                    
                    // Parse end date and time using Carbon
                    // end_date is cast as 'date' (Y-m-d format), end_time is cast as 'datetime' (Y-m-d H:i:s format)
                    // Handle NULL end_time by defaulting to end of day (23:59:59) for proper comparison
                    $endDate = Carbon::parse($event->end_date)->format('Y-m-d'); // Format end date as Y-m-d string
                    $endTime = !empty($event->end_time) ? Carbon::parse($event->end_time)->format('H:i:s') : '23:59:59'; // Extract time portion from end_time or default to end of day
                    $endDateTime = Carbon::parse($endDate . ' ' . $endTime); // Combine end date and time
                    
                    // Calculate status with proper Carbon date/time comparisons
                    // This ensures consistent status calculation matching event listing logic
                    if ($currentDateTime >= $startDateTime && $currentDateTime <= $endDateTime) {
                        // Current time is between start and end (inclusive) - event is live/active
                        $eventStatus = 'live';
                    } elseif ($currentDateTime < $startDateTime) {
                        // Current time is before start - event is upcoming
                        $eventStatus = 'upcoming';
                    } elseif ($currentDateTime > $endDateTime) {
                        // Current time is after end - event is completed
                        $eventStatus = 'completed';
                    }
                } else {
                    // Event is draft (is_draft = true OR is_published = false)
                    $eventStatus = 'draft';
                }
                
                // Calculate attendees count: Sum of sold_quantity from tickets
                $attendeesCount = 0; // Initialize attendees count
                if (!empty($event->tickets) && $event->tickets->count() > 0) {
                    $attendeesCount = $event->tickets->sum('sold_quantity'); // Sum sold quantities from tickets collection
                }
                
                // Calculate revenue for this event: Sum of (sold_quantity × price) from tickets
                $eventRevenue = 0; // Initialize event revenue
                if (!empty($event->tickets) && $event->tickets->count() > 0) {
                    $eventRevenue = $event->tickets->sum(function($ticket) {
                        return $ticket->sold_quantity * $ticket->price; // Calculate revenue per ticket type
                    });
                }
                
                // Get venue name from venue relationship
                $venueName = null; // Initialize venue name
                if (!empty($event->venue)) {
                    $venueName = $event->venue->venue_name; // Get venue name
                }
                
                // Get thumbnail from media relationship (first thumbnail media)
                $thumbnailPath = null; // Initialize thumbnail path
                if (!empty($event->media) && $event->media->count() > 0) {
                    // Filter media to find first thumbnail
                    $thumbnail = $event->media->firstWhere('media_type', 'thumbnail');
                    if (!empty($thumbnail)) {
                        $thumbnailPath = $thumbnail->file_path; // Get thumbnail file path
                    }
                }
                
                // Format recent event data for response
                $recentEventData = array(
                    'event_id' => (int)$event->event_id, // Event ID as integer
                    'event_title' => $event->event_title, // Event title
                    'status' => $eventStatus, // Calculated status (live, upcoming, completed, draft)
                    'date' => date('d-m-Y', strtotime($event->start_date)), // Start date formatted as d-m-Y
                    'time' => date('H:i', strtotime($event->start_time)), // Start time formatted as H:i
                    'attendees' => (int)$attendeesCount, // Total sold tickets count as integer
                    'venue_name' => $venueName, // Venue name or null
                    'revenue' => (float)$eventRevenue, // Total revenue for this event as float
                    'thumbnail' => $thumbnailPath, // Thumbnail file path or null
                );
                
                // Add formatted recent event data to array
                $recentEventsArray[] = $recentEventData;
            }
            
            // Format summary data for response
            $summaryData = array(
                'active_events' => (int)$activeEventsCount, // Active events count as integer
                'completed_events' => (int)$completedEventsCount, // Completed events count as integer
                'total_revenue' => (float)$totalRevenue, // Total revenue as float
                'total_stripe_charges_deducted' => round($totalStripeChargesDeducted, 2), // Total Stripe charges deducted from settled orders
                'platform_fee_deducted' => round($totalPlatformFeesDeducted, 2), // Total platform fees deducted from settled orders
                'total_profit' => round($totalProfit, 2), // Total profit (host payout after Stripe and platform fees)
            );
            
            // Return success response with dashboard data
            $result = array(
                'success' => true,
                'data' => array(
                    'message' => 'Dashboard data retrieved successfully',
                    'summary' => $summaryData, // Summary metrics (active events, completed events, total revenue)
                    'recent_events' => $recentEventsArray, // Array of formatted recent events data
                    'is_host_business_setup_complete' => $isHostBusinessSetupComplete, // true if personal account or business account with full business info; else false
                )
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in HostUserController::getHostUserDashboard');
            Log::info($e->getMessage());
            Log::info($e);
            
            // Return error response to the client
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving dashboard data'
                )
            );
        }
        
        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Create Host Stripe Account
     * 
     * Creates a Stripe Express Connected Account for the authenticated host user on-demand.
     * If account already exists, checks KYC status and returns onboarding link if needed.
     * Stores stripe_account_id in host_users table for future reference.
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function createHostStripeAccount(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                )
            );

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get authenticated user's host_user_id
        $hostUserId = $authenticatedUser->host_user_id;

        try {
            // Initialize models and services
            $hostUserModel = new HostUserModel();
            $businessModel = new BusinessModel();
            $stripeService = new StripeService();

            // Refresh user to get latest data including stripe_account_id
            $authenticatedUser->refresh();
            $hostUser = $authenticatedUser;

            // Check if host already has stripe_account_id
            $stripeAccountId = $hostUser->stripe_account_id;
            $kycCompleted = false;
            $onboardingUrl = null;
            $message = '';

            if (!empty($stripeAccountId)) {
                // Account already exists, check KYC status
                try {
                    $kycCompleted = $stripeService->isKycCompleted($stripeAccountId);

                    if (!$kycCompleted) {
                        // KYC not completed, generate onboarding link
                        $frontendUrl = config('constants.host_frontend_url');
                        
                        // Check if return_url is provided in request, otherwise use profile page
                        $returnUrl = $request->input('return_url');
                        if (empty($returnUrl)) {
                            $returnUrl = $frontendUrl . 'dashboard/profile';
                        }
                        $refreshUrl = $returnUrl;

                        $accountLink = $stripeService->createAccountLink($stripeAccountId, $returnUrl, $refreshUrl);
                        $onboardingUrl = $accountLink->url;
                        $message = 'Stripe account already exists. KYC verification required.';
                    } else {
                        $message = 'Stripe account is ready for payouts.';
                    }
                } catch (\Exception $e) {
                    Log::error('Error checking KYC status in createHostStripeAccount', [
                        'host_user_id' => $hostUserId,
                        'stripe_account_id' => $stripeAccountId,
                        'error' => $e->getMessage(),
                    ]);
                    throw $e;
                }
            } else {
                // Account doesn't exist, create new Stripe Express account
                try {
                    // Prepare host user data for Stripe
                    $hostUserData = array(
                        'email' => $hostUser->email,
                        'first_name' => $hostUser->first_name,
                        'last_name' => $hostUser->last_name,
                        'host_user_id' => $hostUserId,
                    );

                    // Add business name if available
                    if (!empty($hostUser->business_id)) {
                        $businessQueryCondition = array(
                            'business_id' => $hostUser->business_id,
                        );
                        $business = $businessModel->get_business($businessQueryCondition);
                        if (!empty($business) && !empty($business->business_name)) {
                            $hostUserData['business_name'] = $business->business_name;
                        }
                    }

                    // Create Stripe Express Connected Account
                    $stripeAccount = $stripeService->createConnectedAccount($hostUserData);
                    $stripeAccountId = $stripeAccount->id;

                    // Store stripe_account_id in database
                    $queryCondition = array(
                        'host_user_id' => $hostUserId,
                    );
                    $updateData = array(
                        'stripe_account_id' => $stripeAccountId,
                    );

                    $updateResult = $hostUserModel->update_host_user_data($queryCondition, $updateData);

                    if ($updateResult <= 0) {
                        // Database update failed
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E002',
                                'error_message' => 'Failed to save Stripe account ID'
                            )
                        );

                        // Return JSON response with 500 Internal Server Error status code
                        return response()->json($result, 500);
                    }

                    // Generate onboarding link
                    $frontendUrl = config('constants.host_frontend_url');

                    // Check if return_url is provided in request, otherwise use profile page
                    $returnUrl = $request->input('return_url');
                    if (empty($returnUrl)) {
                        $returnUrl = $frontendUrl . '/dashboard/profile';
                    }
                    $refreshUrl = $returnUrl;

                    $accountLink = $stripeService->createAccountLink($stripeAccountId, $returnUrl, $refreshUrl);
                    $onboardingUrl = $accountLink->url;

                    // Check KYC completion status (will be false for new account)
                    $kycCompleted = $stripeService->isKycCompleted($stripeAccountId);
                    $message = 'Stripe account created successfully. Please complete onboarding.';
                } catch (\Stripe\Exception\ApiErrorException $e) {
                    Log::error('Stripe API Error in createHostStripeAccount', [
                        'host_user_id' => $hostUserId,
                        'error' => $e->getMessage(),
                    ]);

                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E002',
                            'error_message' => 'Failed to create Stripe account: ' . $e->getMessage()
                        )
                    );

                    // Return JSON response with 500 Internal Server Error status code
                    return response()->json($result, 500);
                }
            }

            // Return success response
            $result = array(
                'success' => true,
                'data' => array(
                    'stripe_account_id' => $stripeAccountId,
                    'onboarding_url' => $onboardingUrl,
                    'kyc_completed' => $kycCompleted,
                    'message' => $message,
                )
            );
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in HostUserController::createHostStripeAccount');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response to the client with 500 Internal Server Error status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while processing your request'
                )
            );

            // Return JSON response with 500 Internal Server Error status code
            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Get Host Stripe Onboarding Link
     * 
     * Generates a new Stripe onboarding link for the authenticated host user.
     * Requires that the host already has a Stripe account created.
     * 
     * @param Request $request
     * @return string|json JSON encoded response or JSON response with status code
     */
    public function getHostStripeOnboardingLink(Request $request)
    {
        // Initialize result array to store response data
        $result = array();

        // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateHostUser middleware)
        // Middleware ensures user is authenticated and is a Host User instance
        $authenticatedUser = $request->user();

        // Check if user is authenticated, return error if not
        if (empty($authenticatedUser) || $authenticatedUser == null) {
            // User not authenticated, return authentication error
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E003',
                    'error_message' => 'Authentication required'
                )
            );

            // Return JSON response with 401 Unauthorized status code
            return response()->json($result, 401);
        }

        // Get authenticated user's host_user_id
        $hostUserId = $authenticatedUser->host_user_id;

        try {
            // Refresh user to get latest data including stripe_account_id
            $authenticatedUser->refresh();
            $hostUser = $authenticatedUser;

            // Check if host has stripe_account_id
            $stripeAccountId = $hostUser->stripe_account_id;

            if (empty($stripeAccountId)) {
                // No Stripe account exists, return error
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E004',
                        'error_message' => 'You must create a Stripe account first. Please create your Stripe account.',
                        'action_required' => 'create_stripe_account'
                    )
                );

                // Return JSON response with 400 Bad Request status code
                return response()->json($result, 400);
            }

            // Initialize Stripe service
            $stripeService = new StripeService();

            // Generate new onboarding link
            $frontendUrl = config('constants.host_frontend_url');
            
            // Check if return_url is provided in request, otherwise use profile page
            $returnUrl = $request->input('return_url');
            if (empty($returnUrl)) {
                $returnUrl = $frontendUrl . '/dashboard/profile';
            }
            $refreshUrl = $returnUrl;

            $accountLink = $stripeService->createAccountLink($stripeAccountId, $returnUrl, $refreshUrl);
            $onboardingUrl = $accountLink->url;

            // Return success response
            $result = array(
                'success' => true,
                'data' => array(
                    'onboarding_url' => $onboardingUrl,
                    'message' => 'Onboarding link generated successfully',
                )
            );
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe API Error in getHostStripeOnboardingLink', [
                'host_user_id' => $hostUserId,
                'stripe_account_id' => $stripeAccountId ?? null,
                'error' => $e->getMessage(),
            ]);

            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'Failed to generate onboarding link: ' . $e->getMessage()
                )
            );

            // Return JSON response with 500 Internal Server Error status code
            return response()->json($result, 500);
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in HostUserController::getHostStripeOnboardingLink');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response to the client with 500 Internal Server Error status code
            $result = array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while processing your request'
                )
            );

            // Return JSON response with 500 Internal Server Error status code
            return response()->json($result, 500);
        }

        // Return JSON encoded response to the client (200 OK by default)
        return response()->json($result);
    }

    /**
     * Request forgot password - initiates OTP process for password reset
     * 
     * This method validates email, checks if host is blocked, generates 6-digit OTP,
     * hashes and stores it, sets is_forgot_password_otp_initiated flag, and sends OTP email via BrevoEmailService.
     * No authentication required - this is a public endpoint.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function requestForgotPassword(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'email' => 'required|email', // Email is required, must be valid email format
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize HostUserModel to perform database operations
                $hostUserModel = new HostUserModel();
                
                // Prepare query condition to find host user by email
                $queryCondition = array('email' => $data['email']);
                
                // Get host user record from database by email
                $hostUser = $hostUserModel->get_host_user($queryCondition);
                
                // Always return success response to prevent email enumeration
                // Only proceed with OTP generation if host user exists and is not blocked
                if ($hostUser) {
                    // Check if host is blocked
                    if ($hostUser->is_blocked) {
                        // Host is blocked, return error response
                        $blockMessage = !empty($hostUser->blocked_reason) ? $hostUser->blocked_reason : 'You are blocked by the admin. Please contact support.';
                        
                        $result = array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E004',
                                'error_message' => $blockMessage
                            )
                        );
                        
                        // Return JSON encoded error response with 403 status code
                        return response()->json($result, 403);
                    }
                    
                    // Host user exists and is not blocked, proceed with OTP generation
                    
                    // Generate 6-digit OTP using secure random number generation
                    $otpCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
                    
                    // Hash OTP before storing in database
                    $hashedOtp = Hash::make($otpCode);
                    
                    // Prepare update data array with OTP information
                    $updateData = array(
                        'forgot_password_otp' => $hashedOtp, // Hashed OTP code
                        'is_forgot_password_otp_initiated' => true, // Set flag to true
                    );
                    
                    // Prepare query condition to find host user by host_user_id
                    $queryCondition = array('host_user_id' => $hostUser->host_user_id);
                    
                    // Begin database transaction to ensure data consistency
                    DB::beginTransaction();
                    
                    try {
                        // Update host user record with OTP information
                        $hostUserModel->update_host_user_data($queryCondition, $updateData);
                        
                        // Commit transaction if all operations succeed
                        DB::commit();
                        
                        // Initialize BrevoEmailService to send OTP email
                        $brevoEmailService = new BrevoEmailService();
                        
                        // Send OTP email via BrevoEmailService
                        $emailResult = $brevoEmailService->sendOtpEmail($hostUser->email, $otpCode, 'host');
                        
                        // Check if email was sent successfully
                        if (!$emailResult['success']) {
                            // Email sending failed, log error but don't fail the request
                            Log::error('BrevoEmailService: Failed to send OTP email', array(
                                'email' => $hostUser->email,
                                'error' => $emailResult['error'] ?? 'Unknown error'
                            ));
                        }
                    } catch (\Exception $e) {
                        // Rollback transaction on any error to maintain data integrity
                        DB::rollBack();
                        throw $e; // Re-throw exception to outer catch block
                    }
                }
                
                // Always return success response (even if host user doesn't exist) to prevent email enumeration
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'An OTP has been sent to your email address'
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::requestForgotPassword');
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
     * Verify forgot password OTP - validates OTP code for password reset
     * 
     * This method validates that OTP process was initiated, verifies OTP code,
     * and checks OTP expiration (10 minutes). No authentication required - this is a public endpoint.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function verifyForgotPasswordOtp(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'email' => 'required|email', // Email is required, must be valid email format
            'otp' => 'required|string|size:6', // OTP is required, must be string, exactly 6 characters
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize HostUserModel to perform database operations
                $hostUserModel = new HostUserModel();
                
                // Prepare query condition to find host user by email
                $queryCondition = array('email' => $data['email']);
                
                // Get host user record from database by email
                $hostUser = $hostUserModel->get_host_user($queryCondition);
                
                // Check if host user exists
                if (!$hostUser) {
                    // Host user not found, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or OTP'
                        )
                    );
                    
                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }
                
                // Check if OTP process was initiated
                if (!$hostUser->is_forgot_password_otp_initiated || empty($hostUser->forgot_password_otp)) {
                    // OTP process not initiated, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'OTP verification not initiated. Please request a new OTP.'
                        )
                    );
                    
                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }
                
                // Check OTP expiration (10 minutes) using updated_at timestamp
                $otpExpirationTime = $hostUser->updated_at->copy()->addMinutes(10);
                $currentTime = Carbon::now();
                
                if ($currentTime->gt($otpExpirationTime)) {
                    // OTP has expired, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'OTP has expired. Please request a new OTP.'
                        )
                    );
                    
                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }
                
                // Verify OTP using Hash::check()
                if (!Hash::check($data['otp'], $hostUser->forgot_password_otp)) {
                    // OTP is incorrect, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or OTP'
                        )
                    );
                    
                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }
                
                // OTP is valid, return success response
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'OTP verified successfully'
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::verifyForgotPasswordOtp');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while verifying OTP'
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
     * Reset password - resets password after OTP verification
     * 
     * This method validates that OTP process was initiated, verifies OTP again,
     * updates password, and clears OTP fields. No authentication required - this is a public endpoint.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function resetPassword(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'email' => 'required|email', // Email is required, must be valid email format
            'otp' => 'required|string|size:6', // OTP is required, must be string, exactly 6 characters
            'new_password' => array(
                'required', // New password is required
                'min:8', // Password must be at least 8 characters
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/', // Password must contain: 1 uppercase, 1 lowercase, 1 number, 1 special symbol
            ),
            'confirm_password' => 'required|same:new_password', // Confirm password is required, must match new_password field
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize HostUserModel to perform database operations
                $hostUserModel = new HostUserModel();
                
                // Prepare query condition to find host user by email
                $queryCondition = array('email' => $data['email']);
                
                // Get host user record from database by email
                $hostUser = $hostUserModel->get_host_user($queryCondition);
                
                // Check if host user exists
                if (!$hostUser) {
                    // Host user not found, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or OTP'
                        )
                    );
                    
                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }
                
                // Check if OTP process was initiated
                if (!$hostUser->is_forgot_password_otp_initiated || empty($hostUser->forgot_password_otp)) {
                    // OTP process not initiated, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'OTP verification not initiated. Please request a new OTP.'
                        )
                    );
                    
                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }
                
                // Check OTP expiration (10 minutes) using updated_at timestamp
                $otpExpirationTime = $hostUser->updated_at->copy()->addMinutes(10);
                $currentTime = Carbon::now();
                
                if ($currentTime->gt($otpExpirationTime)) {
                    // OTP has expired, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'OTP has expired. Please request a new OTP.'
                        )
                    );
                    
                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }
                
                // Verify OTP using Hash::check()
                if (!Hash::check($data['otp'], $hostUser->forgot_password_otp)) {
                    // OTP is incorrect, return error response
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or OTP'
                        )
                    );
                    
                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }
                
                // OTP is valid, proceed with password reset
                
                // Initialize UserModel to optionally sync password for corresponding end user
                $userModel = new UserModel();

                // Hash new password using Laravel Hash facade before storing
                $hashedPassword = Hash::make($data['new_password']);
                
                // Prepare update data array with new password and clear OTP fields
                $updateData = array(
                    'password' => $hashedPassword, // Hashed new password
                    'is_forgot_password_otp_initiated' => false, // Clear OTP flag
                    'forgot_password_otp' => null, // Clear OTP code
                );
                
                // Prepare query condition to find host user by host_user_id
                $queryCondition = array('host_user_id' => $hostUser->host_user_id);
                
                // Begin database transaction to ensure data consistency
                DB::beginTransaction();
                
                try {
                    // Update host user password and clear OTP fields
                    $hostUserModel->update_host_user_data($queryCondition, $updateData);

                    // If an end user exists with the same email, sync the hashed password
                    $userLookupCondition = array('email' => $hostUser->email);
                    if ($userModel->check_user_exists($userLookupCondition)) {
                        $userModel->update_user_data($userLookupCondition, array(
                            'password' => $hashedPassword,
                        ));
                    }
                    
                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }
                
                // Return success response
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Password reset successfully'
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::resetPassword');
                Log::info($e->getMessage());
                Log::info($e);
                
                // Return error response to the client
                $result = array(
                    'success' => false,
                    'error' => array(
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while resetting password'
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
     * Request registration OTP - initiates OTP process for registration
     * 
     * This method validates email does NOT exist, generates 6-digit OTP,
     * hashes and stores it, sets is_registration_otp_initiated flag, and sends OTP email via BrevoEmailService.
     * No authentication required - this is a public endpoint.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function requestRegistrationOtp(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'email' => 'required|email', // Email is required, must be valid email format
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Initialize HostUserModel to perform database operations
                $hostUserModel = new HostUserModel();
                
                // Prepare query condition to find host user by email
                $queryCondition = array('email' => $data['email']);
                
                // Check if email already exists in host_users table
                $existingHostUser = $hostUserModel->get_host_user($queryCondition);
                
                // Check if email verification is already complete (email already registered)
                if ($existingHostUser && $existingHostUser->is_email_verification_complete) {
                    // Email already exists and is verified, return error
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => 'Email already exists'
                        )
                    );
                    
                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }
                
                // Email does not exist or is a pending registration, proceed with OTP generation
                if (!$existingHostUser || ($existingHostUser && !$existingHostUser->is_email_verification_complete)) {
                    // Email does not exist or is a pending registration record, proceed with OTP generation
                    
                    // Generate 6-digit OTP using secure random number generation
                    $otpCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
                    
                    // Hash OTP before storing in database
                    $hashedOtp = Hash::make($otpCode);
                    
                    // Begin database transaction to ensure data consistency
                    DB::beginTransaction();
                    
                    try {
                        if ($existingHostUser && !$existingHostUser->is_email_verification_complete) {
                            // Pending registration host user exists, update OTP information
                            $updateCondition = array('host_user_id' => $existingHostUser->host_user_id);
                            $hostUserModel->update_host_user_data($updateCondition, array(
                                'registration_otp' => $hashedOtp,
                                'is_registration_otp_initiated' => true,
                            ));
                        } else {
                            // Create temporary host user record with OTP information
                            $tempPassword = Hash::make(Str::random(32)); // Temporary password
                            
                            $tempHostUserData = array(
                                'first_name' => 'Temp', // Temporary placeholder first name, will be updated during registration
                                'last_name' => 'User', // Temporary placeholder last name, will be updated during registration
                                'email' => $data['email'], // Email address
                                'password' => $tempPassword, // Temporary password
                                'registration_otp' => $hashedOtp, // Hashed OTP code
                                'is_registration_otp_initiated' => true, // Set flag to true
                                'is_email_verification_complete' => false, // Email verification not complete yet
                            );
                            
                            // Create temporary host user record with OTP information
                            $tempHostUser = $hostUserModel->create_host_user($tempHostUserData);
                        }
                        
                        // Commit transaction if all operations succeed
                        DB::commit();
                        
                        // Initialize BrevoEmailService to send registration OTP email
                        $brevoEmailService = new BrevoEmailService();
                        
                        // Send registration OTP email via BrevoEmailService
                        $emailResult = $brevoEmailService->sendRegistrationOtpEmail($data['email'], $otpCode, 'host');
                        
                        // Check if email was sent successfully
                        if (!$emailResult['success']) {
                            // Email sending failed, log error but don't fail the request
                            Log::error('BrevoEmailService: Failed to send registration OTP email', array(
                                'email' => $data['email'],
                                'error' => $emailResult['error'] ?? 'Unknown error'
                            ));
                        }
                    } catch (\Exception $e) {
                        // Rollback transaction on any error to maintain data integrity
                        DB::rollBack();
                        throw $e; // Re-throw exception to outer catch block
                    }
                }
                
                // Return success response - OTP has been sent
                $result = array(
                    'success' => true,
                    'data' => array(
                        'message' => 'OTP has been sent to your email address'
                    )
                );
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in HostUserController::requestRegistrationOtp');
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
