<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\HostUserModel;
use App\Models\UserModel;
use App\Services\BrevoEmailService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class UserController extends Controller
{
    /**
     * User registration - allows new users to create End User accounts
     *
     * This method handles user registration by validating input, checking email uniqueness,
     * hashing password, and creating user account in the users table.
     * No authentication required - this is a public endpoint.
     * No auto-login after registration - user must login separately.
     *
     * @return string JSON encoded response
     */
    public function userRegister(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'first_name' => 'required|string|max:255', // First name is required, must be string, max 255 characters
            'last_name' => 'nullable|string|max:255', // Last name is optional, must be string, max 255 characters
            'email' => 'required|email', // Email is required, must be valid email format (uniqueness checked manually to exclude pending registrations)
            'password' => 'required|string|min:8|regex:/^(?=.*[A-Za-z])(?=.*\d)/', // Password is required, minimum 8 characters, must contain both letters and numbers
            'confirm_password' => 'required|same:password', // Confirm password is required, must match password field
            'otp' => 'required|string|size:6', // OTP is required, must be string, exactly 6 characters
            'city' => 'nullable|string|max:255', // City is optional
            'state_id' => 'nullable|integer|exists:states,id', // State ID is optional, must reference states table when provided
            'state' => 'nullable|string|max:255', // State/region is optional (kept for backward compatibility and zipcode validation)
            'country' => 'nullable|string|max:255', // Country is optional
            'zipcode' => 'nullable|string|max:20', // Zipcode is optional
            'gender' => 'nullable|in:Male,Female,Other,Prefer Not to say', // Gender is optional, must be one of the enum values
            'dob' => 'nullable|date', // Date of birth is optional, must be valid date
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize UserModel to perform database operations
                $userModel = new UserModel;

                // Prepare query condition to find user by email
                $queryCondition = ['email' => $data['email']];

                // Get user record from database by email (could be temporary registration record)
                $existingUser = $userModel->get_user($queryCondition);

                // Check if user exists and email verification is complete
                if ($existingUser && $existingUser->is_email_verification_complete) {
                    // Email already exists as a fully registered user, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Email already registered',
                        ],
                    ];

                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }

                // Check if OTP process was initiated
                if (! $existingUser || ! $existingUser->is_registration_otp_initiated || empty($existingUser->registration_otp)) {
                    // OTP process not initiated, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'OTP verification not initiated. Please request a registration OTP first.',
                        ],
                    ];

                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }

                // Check OTP expiration (10 minutes) using updated_at timestamp
                $otpExpirationTime = $existingUser->updated_at->copy()->addMinutes(10);
                $currentTime = Carbon::now();

                if ($currentTime->gt($otpExpirationTime)) {
                    // OTP has expired, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'OTP has expired. Please request a new registration OTP.',
                        ],
                    ];

                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }

                // Verify OTP using Hash::check()
                if (! Hash::check($data['otp'], $existingUser->registration_otp)) {
                    // OTP is incorrect, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Invalid OTP code',
                        ],
                    ];

                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }

                // OTP is valid, proceed with user registration

                // Hash password using Laravel Hash facade before storing
                $hashedPassword = Hash::make($data['password']);

                // Prepare user data array for database update/insertion
                $userData = [
                    'first_name' => $data['first_name'], // User's first name
                    'last_name' => isset($data['last_name']) ? $data['last_name'] : null, // User's last name (optional)
                    'email' => $data['email'], // User's email address (login credential)
                    'password' => $hashedPassword, // Hashed password
                    'city' => $data['city'] ?? null, // City - optional
                    'state_id' => $data['state_id'] ?? null, // State ID - optional (normalized reference)
                    'state' => $data['state'] ?? null, // State/region - optional (denormalized)
                    'country' => $data['country'] ?? null, // Country - optional
                    'zipcode' => isset($data['zipcode']) ? $data['zipcode'] : null, // Zipcode - optional
                    'gender' => isset($data['gender']) ? $data['gender'] : 'Prefer Not to say', // Gender - optional, default to 'Prefer Not to say'
                    'dob' => isset($data['dob']) ? $data['dob'] : null, // Date of birth - optional
                    'is_registration_otp_initiated' => false, // Clear OTP flag
                    'registration_otp' => null, // Clear OTP code
                ];

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    if ($existingUser && ! $existingUser->is_email_verification_complete) {
                        // Pending registration user exists, update with full registration data
                        $updateCondition = ['user_id' => $existingUser->user_id];
                        $userData['is_email_verification_complete'] = true; // Mark email verification as complete
                        $userModel->update_user_data($updateCondition, $userData);
                    } else {
                        // No pending user exists, create new user record
                        $userData['is_email_verification_complete'] = true; // Mark email verification as complete
                        $user = $userModel->create_user($userData);
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Return success response (no auto-login, no token)
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'User registered successfully',
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserController::userRegister');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while registering the user',
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

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * User login - authenticates End Users and generates access token
     *
     * This method handles user authentication by validating credentials,
     * authenticating user, and generating Laravel Sanctum token for session management.
     * No authentication required - this is a public endpoint.
     *
     * @return string JSON encoded response
     */
    public function userLogin(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'email' => 'required|email', // Email is required, must be valid email format
            'password' => 'required', // Password is required
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize UserModel to perform database operations
                $userModel = new UserModel;

                // Prepare query condition to find user by email
                $queryCondition = ['email' => $data['email']]; // Query condition for email lookup

                // Get user record from database by email
                $user = $userModel->get_user($queryCondition);

                // Check if user exists and password is correct
                if ($user && Hash::check($data['password'], $user->password)) {
                    // User credentials are valid, proceed with authentication

                    // Generate Laravel Sanctum token for authenticated user
                    $token = $user->createToken('auth-token')->plainTextToken;

                    // Prepare user information for response (exclude sensitive fields)
                    $userInfo = [
                        'user_id' => $user->user_id, // User ID
                        'first_name' => $user->first_name, // User's first name
                        'last_name' => $user->last_name, // User's last name
                        'email' => $user->email, // User's email address
                        'contact_number' => $user->contact_number, // Contact number (if available)
                        'city' => $user->city, // City (if available)
                        'state' => $user->state, // State/region (if available)
                        'country' => $user->country, // Country (if available)
                        'zipcode' => $user->zipcode, // Zipcode (if available)
                        'gender' => $user->gender, // Gender (if available)
                        'dob' => $user->dob, // Date of birth (if available)
                        'profile_image' => $user->profile_image, // Profile image path (if available)
                    ];

                    // Return success response with user info and token
                    $result = [
                        'success' => true,
                        'data' => [
                            'message' => 'Logged In Successfully',
                            'user_info' => $userInfo, // User information
                            'token' => $token, // Laravel Sanctum token
                        ],
                    ];
                } else {
                    // Invalid credentials (user not found or password incorrect)
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or password',
                        ],
                    ];

                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserController::userLogin');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your login request',
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

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Get user profile - retrieves authenticated user's profile information
     *
     * This method retrieves the profile information for the authenticated user,
     * including full name, email, contact number, and profile image.
     * Protected route - requires authentication.
     *
     * @return string JSON encoded response
     */
    public function getUserProfile(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        try {
            // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
            $user = $request->user();

            // Prepare user profile data for response (exclude sensitive fields)
            $userProfile = [
                'user_id' => $user->user_id, // User ID
                'first_name' => $user->first_name, // User's first name
                'last_name' => $user->last_name, // User's last name
                'email' => $user->email, // User's email address (read-only, login credential)
                'contact_number' => $user->contact_number, // Contact number (if available)
                'city' => $user->city, // City (if available)
                'state_id' => $user->state_id, // State ID (if available)
                'state' => $user->state, // State/region (if available, denormalized)
                'country' => $user->country, // Country (if available)
                'zipcode' => $user->zipcode, // Zipcode (if available)
                'gender' => $user->gender, // Gender (if available)
                'dob' => $user->dob, // Date of birth (if available)
                'profile_image' => $user->profile_image, // Profile image path (if available)
            ];

            // Return success response with user profile
            $result = [
                'success' => true,
                'data' => [
                    'message' => 'User profile retrieved successfully',
                    'user_profile' => $userProfile, // User profile information
                ],
            ];
        } catch (\Exception $e) {
            // Log exception details for debugging purposes
            Log::info('Exception in UserController::getUserProfile');
            Log::info($e->getMessage());
            Log::info($e);

            // Return error response to the client
            $result = [
                'success' => false,
                'error' => [
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while retrieving user profile',
                ],
            ];
        }

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Update user profile - allows End Users to update their profile information
     *
     * This method handles updating user profile fields (full_name, contact_number)
     * and optionally uploading a new profile image. Profile image is stored in
     * storage/public/users/{user_id}/ directory. Protected route - requires authentication.
     *
     * @return string JSON encoded response
     */
    public function updateUserProfile(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'first_name' => 'required|string|max:255', // First name is required, must be string, maximum 255 characters
            'last_name' => 'nullable|string|max:255', // Last name is optional, must be string if provided, maximum 255 characters
            'contact_number' => 'nullable|string|max:255', // Contact number is optional, must be string if provided, maximum 255 characters
            'city' => 'nullable|string|max:255', // City is optional
            'state_id' => 'nullable|integer|exists:states,id', // State ID is optional, must reference states table when provided
            'state' => 'nullable|string|max:255', // State/region is optional (kept for backward compatibility and zipcode validation)
            'country' => 'nullable|string|max:255', // Country is optional
            'zipcode' => 'nullable|string|max:20', // Zipcode is optional
            'gender' => 'nullable|in:Male,Female,Other,Prefer Not to say', // Gender is optional, must be one of the enum values
            'dob' => 'nullable|date', // Date of birth is optional, must be valid date
            'profile_image' => 'nullable|image|mimes:jpeg,jpg,gif,png|max:2048', // Profile image is optional, must be image, supported formats: jpeg, jpg, gif, png, maximum 2MB (2048 KB)
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // If both state and zipcode are provided, validate state and city against zipcode via Zippopotam API
                if (! empty($data['state']) && ! empty($data['zipcode'])) {
                    $zipcode = trim($data['zipcode']);
                    $userState = trim($data['state']);
                    $userCity = isset($data['city']) ? trim($data['city']) : '';

                    $zippopotamUrl = 'https://api.zippopotam.us/us/'.$zipcode;

                    try {
                        // Disable SSL verification to avoid local certificate issues when calling external API
                        $response = Http::withoutVerifying()->timeout(10)->get($zippopotamUrl);
                    } catch (\Exception $e) {
                        Log::warning('Zippopotam lookup failed in updateUserProfile', [
                            'zipcode' => $zipcode,
                            'error' => $e->getMessage(),
                        ]);

                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ],
                        ];

                        return response()->json($result, 400);
                    }

                    if ($response->failed()) {
                        Log::warning('Zippopotam returned non-success status in updateUserProfile', [
                            'zipcode' => $zipcode,
                            'status' => $response->status(),
                            'body' => $response->body(),
                        ]);

                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ],
                        ];

                        return response()->json($result, 400);
                    }

                    $payload = $response->json();

                    if (
                        empty($payload) ||
                        ! isset($payload['places']) ||
                        empty($payload['places']) ||
                        ! isset($payload['places'][0]['state']) ||
                        ! isset($payload['places'][0]['place name'])
                    ) {
                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ],
                        ];

                        return response()->json($result, 400);
                    }

                    // Require city when validating zipcode/state
                    if ($userCity === '') {
                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ],
                        ];

                        return response()->json($result, 400);
                    }

                    $apiState = trim($payload['places'][0]['state']);
                    $apiCity = trim($payload['places'][0]['place name']);

                    if (
                        strcasecmp($userState, $apiState) !== 0 ||
                        strcasecmp($userCity, $apiCity) !== 0
                    ) {
                        $result = [
                            'success' => false,
                            'error' => [
                                'error_code' => 'E001',
                                'error_message' => 'Invalid zipcode, state, or city does not match zipcode',
                            ],
                        ];

                        return response()->json($result, 400);
                    }
                }

                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();

                // Initialize UserModel to perform database operations
                $userModel = new UserModel;

                // Prepare update data array with profile fields
                $updateData = [
                    'first_name' => $data['first_name'], // Update first name
                    'last_name' => isset($data['last_name']) ? $data['last_name'] : null, // Update last name (null if not provided)
                    'contact_number' => isset($data['contact_number']) ? $data['contact_number'] : null, // Update contact number (null if not provided)
                    'city' => $data['city'] ?? null, // Update city (null if not provided)
                    'state_id' => $data['state_id'] ?? null, // Update state ID (null if not provided)
                    'state' => $data['state'] ?? null, // Update state/region (null if not provided)
                    'country' => $data['country'] ?? null, // Update country (null if not provided)
                    'zipcode' => isset($data['zipcode']) ? $data['zipcode'] : null, // Update zipcode (null if not provided)
                    'gender' => isset($data['gender']) ? $data['gender'] : null, // Update gender (null if not provided)
                    'dob' => isset($data['dob']) ? $data['dob'] : null, // Update date of birth (null if not provided)
                ];

                // Check if profile image is provided in request
                if ($request->hasFile('profile_image')) {
                    // Profile image is provided, handle file upload

                    // Get uploaded file from request
                    $profileImage = $request->file('profile_image');

                    // Get user ID for directory path
                    $userId = $user->user_id;

                    // Get original file extension
                    $extension = $profileImage->getClientOriginalExtension();

                    // Generate unique filename: profile_image_{timestamp}.{extension}
                    $filename = 'profile_image_'.time().'.'.$extension;

                    // Define directory path for user profile images
                    $directoryPath = 'users/'.$userId;

                    // Create user directory if it doesn't exist
                    if (! Storage::disk('public')->exists($directoryPath)) {
                        // Create directory for user profile images
                        Storage::disk('public')->makeDirectory($directoryPath);
                    }

                    // Get old profile image path if exists
                    $oldProfileImage = $user->profile_image;

                    // Store new profile image file in storage/public/users/{user_id}/ directory
                    $profileImage->storeAs($directoryPath, $filename, 'public');

                    // Store relative file path in database (format: users/{user_id}/profile_image_{timestamp}.{ext})
                    $updateData['profile_image'] = $directoryPath.'/'.$filename;

                    // Delete old profile image file if exists
                    if ($oldProfileImage && Storage::disk('public')->exists($oldProfileImage)) {
                        // Delete old profile image from storage
                        Storage::disk('public')->delete($oldProfileImage);
                    }
                }

                // Prepare query condition to find user by user_id
                $queryCondition = ['user_id' => $user->user_id];

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();
                try {
                    // Update user profile data in the database
                    $userModel->update_user_data($queryCondition, $updateData);

                    // If the same email also exists for a host user, keep basic profile fields (and profile image) in sync
                    $hostUserModel = new HostUserModel;
                    $hostLookupCondition = ['email' => $user->email];

                    $hostUser = $hostUserModel->get_host_user($hostLookupCondition);
                    if ($hostUser) {
                        $hostUpdateData = [
                            'first_name' => $updateData['first_name'],
                            'last_name' => $updateData['last_name'],
                            'phone_number' => $updateData['contact_number'],
                            'city' => $updateData['city'],
                            'state_id' => $updateData['state_id'],
                            'state' => $updateData['state'],
                            'country' => $updateData['country'],
                            'zipcode' => $updateData['zipcode'],
                            'gender' => $updateData['gender'],
                            'dob' => $updateData['dob'],
                        ];

                        // If user profile image was updated, copy it to host storage and sync path
                        if (isset($updateData['profile_image'])) {
                            $sourcePath = $updateData['profile_image'];
                            $hostDirectory = 'host_users/'.$hostUser->host_user_id;

                            if (! Storage::disk('public')->exists($hostDirectory)) {
                                Storage::disk('public')->makeDirectory($hostDirectory);
                            }

                            $filename = basename($sourcePath);
                            $hostImagePath = $hostDirectory.'/'.$filename;

                            // Delete old host profile image if it exists
                            $oldHostProfileImage = $hostUser->profile_image;
                            if (! empty($oldHostProfileImage) && Storage::disk('public')->exists($oldHostProfileImage)) {
                                Storage::disk('public')->delete($oldHostProfileImage);
                            }

                            // Copy user profile image file to host directory
                            if (Storage::disk('public')->exists($sourcePath)) {
                                Storage::disk('public')->copy($sourcePath, $hostImagePath);
                                $hostUpdateData['profile_image'] = $hostImagePath;
                            }
                        }

                        $hostUserModel->update_host_user_data($hostLookupCondition, $hostUpdateData);
                    }

                    // Commit transaction if all operations succeed
                    DB::commit();
                } catch (\Exception $e) {
                    // Rollback transaction on any error to maintain data integrity
                    DB::rollBack();
                    throw $e; // Re-throw exception to outer catch block
                }

                // Refresh user model to get updated data
                $user->refresh();

                // Prepare updated user profile data for response
                $userProfile = [
                    'user_id' => $user->user_id, // User ID
                    'first_name' => $user->first_name, // Updated first name
                    'last_name' => $user->last_name, // Updated last name
                    'email' => $user->email, // Email address (read-only, login credential)
                    'contact_number' => $user->contact_number, // Updated contact number
                    'city' => $user->city, // Updated city
                    'state_id' => $user->state_id, // Updated state ID
                    'state' => $user->state, // Updated state/region
                    'country' => $user->country, // Updated country
                    'zipcode' => $user->zipcode, // Updated zipcode
                    'gender' => $user->gender, // Updated gender
                    'dob' => $user->dob, // Updated date of birth
                    'profile_image' => $user->profile_image, // Updated profile image path
                ];

                // Return success response with updated user profile
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'Profile updated successfully',
                        'user_profile' => $userProfile, // Updated user profile information
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserController::updateUserProfile');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while updating user profile',
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

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Update user password - allows End Users to change their password
     *
     * This method handles password update by validating current password,
     * validating new password requirements, and hashing the new password before storing.
     * Protected route - requires authentication.
     *
     * @return string JSON encoded response
     */
    public function updateUserPassword(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'current_password' => 'required', // Current password is required
            'new_password' => 'required|string|min:8|regex:/^(?=.*[A-Za-z])(?=.*\d)/', // New password is required, minimum 8 characters, must contain both letters and numbers
            'confirm_password' => 'required|same:new_password', // Confirm password is required, must match new_password field
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken and AuthenticateUser middleware)
                $user = $request->user();

                // Verify current password using Hash::check()
                if (! Hash::check($data['current_password'], $user->password)) {
                    // Current password is incorrect, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Current password is incorrect',
                        ],
                    ];

                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }

                // Current password is correct, proceed with password update and sync to host (if exists)

                // Initialize models to perform database operations
                $userModel = new UserModel;
                $hostUserModel = new HostUserModel;

                // Hash new password using Laravel Hash facade before storing
                $hashedPassword = Hash::make($data['new_password']);

                // Prepare update data array with hashed password
                $updateData = [
                    'password' => $hashedPassword, // Hashed new password
                ];

                // Prepare query condition to find user by user_id
                $queryCondition = ['user_id' => $user->user_id];

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Update user password in the database
                    $userModel->update_user_data($queryCondition, $updateData);

                    // If a host user exists with the same email, sync the hashed password
                    $hostLookupCondition = ['email' => $user->email];
                    if ($hostUserModel->check_host_user_exists($hostLookupCondition)) {
                        $hostUserModel->update_host_user_data($hostLookupCondition, $updateData);
                    }

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
                        'message' => 'Password updated successfully',
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserController::updateUserPassword');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while updating password',
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

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Request forgot password - initiates OTP process for password reset
     *
     * This method validates email, generates 6-digit OTP, hashes and stores it,
     * sets is_forgot_password_otp_initiated flag, and sends OTP email via BrevoEmailService.
     * No authentication required - this is a public endpoint.
     *
     * @return string JSON encoded response
     */
    public function requestForgotPassword(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'email' => 'required|email', // Email is required, must be valid email format
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize UserModel to perform database operations
                $userModel = new UserModel;

                // Prepare query condition to find user by email
                $queryCondition = ['email' => $data['email']];

                // Get user record from database by email
                $user = $userModel->get_user($queryCondition);

                // Always return success response to prevent email enumeration
                // Only proceed with OTP generation if user exists
                if ($user) {
                    // User exists, proceed with OTP generation

                    // Generate 6-digit OTP using secure random number generation
                    $otpCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

                    // Hash OTP before storing in database
                    $hashedOtp = Hash::make($otpCode);

                    // Prepare update data array with OTP information
                    $updateData = [
                        'forgot_password_otp' => $hashedOtp, // Hashed OTP code
                        'is_forgot_password_otp_initiated' => true, // Set flag to true
                    ];

                    // Prepare query condition to find user by user_id
                    $queryCondition = ['user_id' => $user->user_id];

                    // Begin database transaction to ensure data consistency
                    DB::beginTransaction();

                    try {
                        // Update user record with OTP information
                        $userModel->update_user_data($queryCondition, $updateData);

                        // Commit transaction if all operations succeed
                        DB::commit();

                        // Initialize BrevoEmailService to send OTP email
                        $brevoEmailService = new BrevoEmailService;

                        // Send OTP email via BrevoEmailService
                        $emailResult = $brevoEmailService->sendOtpEmail($user->email, $otpCode, 'user');

                        // Check if email was sent successfully
                        if (! $emailResult['success']) {
                            // Email sending failed, log error but don't fail the request
                            Log::error('BrevoEmailService: Failed to send OTP email', [
                                'email' => $user->email,
                                'error' => $emailResult['error'] ?? 'Unknown error',
                            ]);
                        }
                    } catch (\Exception $e) {
                        // Rollback transaction on any error to maintain data integrity
                        DB::rollBack();
                        throw $e; // Re-throw exception to outer catch block
                    }
                }

                // Always return success response (even if user doesn't exist) to prevent email enumeration
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'An OTP has been sent to your email address',
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserController::requestForgotPassword');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request',
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

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Verify forgot password OTP - validates OTP code for password reset
     *
     * This method validates that OTP process was initiated, verifies OTP code,
     * and checks OTP expiration (10 minutes). No authentication required - this is a public endpoint.
     *
     * @return string JSON encoded response
     */
    public function verifyForgotPasswordOtp(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'email' => 'required|email', // Email is required, must be valid email format
            'otp' => 'required|string|size:6', // OTP is required, must be string, exactly 6 characters
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize UserModel to perform database operations
                $userModel = new UserModel;

                // Prepare query condition to find user by email
                $queryCondition = ['email' => $data['email']];

                // Get user record from database by email
                $user = $userModel->get_user($queryCondition);

                // Check if user exists
                if (! $user) {
                    // User not found, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or OTP',
                        ],
                    ];

                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }

                // Check if OTP process was initiated
                if (! $user->is_forgot_password_otp_initiated || empty($user->forgot_password_otp)) {
                    // OTP process not initiated, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'OTP verification not initiated. Please request a new OTP.',
                        ],
                    ];

                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }

                // Check OTP expiration (10 minutes) using updated_at timestamp
                $otpExpirationTime = $user->updated_at->copy()->addMinutes(10);
                $currentTime = Carbon::now();

                if ($currentTime->gt($otpExpirationTime)) {
                    // OTP has expired, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'OTP has expired. Please request a new OTP.',
                        ],
                    ];

                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }

                // Verify OTP using Hash::check()
                if (! Hash::check($data['otp'], $user->forgot_password_otp)) {
                    // OTP is incorrect, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or OTP',
                        ],
                    ];

                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }

                // OTP is valid, return success response
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'OTP verified successfully',
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserController::verifyForgotPasswordOtp');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while verifying OTP',
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

        // Return JSON encoded response to the client
        return response()->json($result);
    }

    /**
     * Reset password - resets password after OTP verification
     *
     * This method validates that OTP process was initiated, verifies OTP again,
     * updates password, and clears OTP fields. No authentication required - this is a public endpoint.
     *
     * @return string JSON encoded response
     */
    public function resetPassword(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'email' => 'required|email', // Email is required, must be valid email format
            'otp' => 'required|string|size:6', // OTP is required, must be string, exactly 6 characters
            'new_password' => 'required|string|min:8|regex:/^(?=.*[A-Za-z])(?=.*\d)/', // New password is required, minimum 8 characters, must contain both letters and numbers
            'confirm_password' => 'required|same:new_password', // Confirm password is required, must match new_password field
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Initialize models to perform database operations
                $userModel = new UserModel;
                $hostUserModel = new HostUserModel;

                // Prepare query condition to find user by email
                $queryCondition = ['email' => $data['email']];

                // Get user record from database by email
                $user = $userModel->get_user($queryCondition);

                // Check if user exists
                if (! $user) {
                    // User not found, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or OTP',
                        ],
                    ];

                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }

                // Check if OTP process was initiated
                if (! $user->is_forgot_password_otp_initiated || empty($user->forgot_password_otp)) {
                    // OTP process not initiated, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'OTP verification not initiated. Please request a new OTP.',
                        ],
                    ];

                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }

                // Check OTP expiration (10 minutes) using updated_at timestamp
                $otpExpirationTime = $user->updated_at->copy()->addMinutes(10);
                $currentTime = Carbon::now();

                if ($currentTime->gt($otpExpirationTime)) {
                    // OTP has expired, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'OTP has expired. Please request a new OTP.',
                        ],
                    ];

                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }

                // Verify OTP using Hash::check()
                if (! Hash::check($data['otp'], $user->forgot_password_otp)) {
                    // OTP is incorrect, return error response
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E003',
                            'error_message' => 'Invalid email or OTP',
                        ],
                    ];

                    // Return JSON encoded error response with 401 status code
                    return response()->json($result, 401);
                }

                // OTP is valid, proceed with password reset

                // Hash new password using Laravel Hash facade before storing
                $hashedPassword = Hash::make($data['new_password']);

                // Prepare update data array with new password and clear OTP fields
                $updateData = [
                    'password' => $hashedPassword, // Hashed new password
                    'is_forgot_password_otp_initiated' => false, // Clear OTP flag
                    'forgot_password_otp' => null, // Clear OTP code
                ];

                // Prepare query condition to find user by user_id
                $queryCondition = ['user_id' => $user->user_id];

                // Begin database transaction to ensure data consistency
                DB::beginTransaction();

                try {
                    // Update user password and clear OTP fields
                    $userModel->update_user_data($queryCondition, $updateData);

                    // If a host user exists with the same email, sync the hashed password
                    $hostLookupCondition = ['email' => $user->email];
                    if ($hostUserModel->check_host_user_exists($hostLookupCondition)) {
                        $hostUserModel->update_host_user_data($hostLookupCondition, [
                            'password' => $hashedPassword,
                        ]);
                    }

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
                        'message' => 'Password reset successfully',
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserController::resetPassword');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while resetting password',
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
     * @return string JSON encoded response
     */
    public function requestRegistrationOtp(Request $request)
    {
        // Initialize result array to store response data
        $result = [];

        // Get all request data from the incoming request
        $data = $request->all();

        // Define validation rules for the request fields
        $rules = [
            'email' => 'required|email', // Email is required, must be valid email format
            'state' => 'required|string|max:255', // State/region is required for zipcode validation
            'zipcode' => 'required|string|max:20', // Zipcode is required for state validation
        ];

        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);

        // Check if validation passes, proceed only if validation is successful
        if (! $validation->fails()) {
            try {
                // Validate state and zipcode combination via Zippopotam API before any DB operations
                $zipcode = trim($data['zipcode']);
                $userState = trim($data['state']);

                $zippopotamUrl = 'https://api.zippopotam.us/us/'.$zipcode;

                try {
                    // Disable SSL verification to avoid local certificate issues when calling external API
                    $response = Http::withoutVerifying()->timeout(10)->get($zippopotamUrl);
                } catch (\Exception $e) {
                    Log::warning('Zippopotam lookup failed', [
                        'zipcode' => $zipcode,
                        'error' => $e->getMessage(),
                    ]);

                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E001',
                            'error_message' => 'Invalid zipcode or state does not match zipcode',
                        ],
                    ];

                    return response()->json($result, 400);
                }

                if ($response->failed()) {
                    Log::warning('Zippopotam returned non-success status', [
                        'zipcode' => $zipcode,
                        'status' => $response->status(),
                        'body' => $response->body(),
                    ]);

                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E001',
                            'error_message' => 'Invalid zipcode or state does not match zipcode',
                        ],
                    ];

                    return response()->json($result, 400);
                }

                $payload = $response->json();

                if (
                    empty($payload) ||
                    ! isset($payload['places']) ||
                    empty($payload['places']) ||
                    ! isset($payload['places'][0]['state']) ||
                    ! isset($payload['places'][0]['place name'])
                ) {
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E001',
                            'error_message' => 'Invalid zipcode or state does not match zipcode',
                        ],
                    ];

                    return response()->json($result, 400);
                }

                $apiState = trim($payload['places'][0]['state']);

                if (
                    strcasecmp($userState, $apiState) !== 0
                ) {
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E001',
                            'error_message' => 'Invalid zipcode or state does not match zipcode',
                        ],
                    ];

                    return response()->json($result, 400);
                }

                // Initialize UserModel to perform database operations
                $userModel = new UserModel;

                // Prepare query condition to find user by email
                $queryCondition = ['email' => $data['email']];

                // Check if email already exists in users table
                $existingUser = $userModel->get_user($queryCondition);

                // Check if email verification is already complete (email already registered)
                if ($existingUser && $existingUser->is_email_verification_complete) {
                    // Email already exists and is verified, return error
                    $result = [
                        'success' => false,
                        'error' => [
                            'error_code' => 'E004',
                            'error_message' => 'Email already exists',
                        ],
                    ];

                    // Return JSON encoded error response with 400 status code
                    return response()->json($result, 400);
                }

                // Email does not exist or is a pending registration, proceed with OTP generation
                if (! $existingUser || ($existingUser && ! $existingUser->is_email_verification_complete)) {
                    // Email does not exist or is a pending registration record, proceed with OTP generation

                    // Generate 6-digit OTP using secure random number generation
                    $otpCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

                    // Hash OTP before storing in database
                    $hashedOtp = Hash::make($otpCode);

                    // Begin database transaction to ensure data consistency
                    DB::beginTransaction();

                    try {
                        if ($existingUser && ! $existingUser->is_email_verification_complete) {
                            // Pending registration user exists, update OTP information
                            $updateCondition = ['user_id' => $existingUser->user_id];
                            $userModel->update_user_data($updateCondition, [
                                'registration_otp' => $hashedOtp,
                                'is_registration_otp_initiated' => true,
                            ]);
                        } else {
                            // Create temporary user record with OTP information
                            $tempPassword = Hash::make(Str::random(32)); // Temporary password

                            $tempUserData = [
                                'first_name' => 'Temp', // Temporary placeholder first name, will be updated during registration
                                'last_name' => null, // Temporary placeholder last name, will be updated during registration
                                'email' => $data['email'], // Email address
                                'password' => $tempPassword, // Temporary password
                                'registration_otp' => $hashedOtp, // Hashed OTP code
                                'is_registration_otp_initiated' => true, // Set flag to true
                                'is_email_verification_complete' => false, // Email verification not complete yet
                            ];

                            // Create temporary user record with OTP information
                            $tempUser = $userModel->create_user($tempUserData);
                        }

                        // Commit transaction if all operations succeed
                        DB::commit();

                        // Initialize BrevoEmailService to send registration OTP email
                        $brevoEmailService = new BrevoEmailService;

                        // Send registration OTP email via BrevoEmailService
                        $emailResult = $brevoEmailService->sendRegistrationOtpEmail($data['email'], $otpCode, 'user');

                        // Check if email was sent successfully
                        if (! $emailResult['success']) {
                            // Email sending failed, log error but don't fail the request
                            Log::error('BrevoEmailService: Failed to send registration OTP email', [
                                'email' => $data['email'],
                                'error' => $emailResult['error'] ?? 'Unknown error',
                            ]);
                        }
                    } catch (\Exception $e) {
                        // Rollback transaction on any error to maintain data integrity
                        DB::rollBack();
                        throw $e; // Re-throw exception to outer catch block
                    }
                }

                // Return success response - OTP has been sent
                $result = [
                    'success' => true,
                    'data' => [
                        'message' => 'OTP has been sent to your email address',
                    ],
                ];
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in UserController::requestRegistrationOtp');
                Log::info($e->getMessage());
                Log::info($e);

                // Return error response to the client
                $result = [
                    'success' => false,
                    'error' => [
                        'error_code' => 'E002',
                        'error_message' => 'An error occurred while processing your request',
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

        // Return JSON encoded response to the client
        return response()->json($result);
    }
}
