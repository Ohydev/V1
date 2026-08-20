<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use App\Models\UserModel;
use App\Models\HostUserModel;
use App\Models\BusinessModel;

class ProfileSwitchController extends Controller
{
    /**
     * Switch Profile Mode
     * 
     * Allows authenticated users to switch between 'user' and 'host' account modes.
     * If the target account exists, generates a new token for it.
     * If the target account doesn't exist, creates a new account with the same email
     * and copies relevant profile information from the source account.
     * 
     * @param Request $request
     * @return string JSON encoded response
     */
    public function switchProfile(Request $request)
    {
        // Initialize result array to store response data
        $result = array();
        
        // Get all request data from the incoming request
        $data = $request->all();
        
        // Define validation rules for the request fields
        $rules = array(
            'mode' => 'required|in:host,user', // Mode is required, must be 'host' or 'user'
        );
        
        // Perform validation using Laravel Validator
        $validation = Validator::make($data, $rules);
        
        // Check if validation passes, proceed only if validation is successful
        if (!$validation->fails()) {
            try {
                // Get authenticated user from request (set by AuthenticateApiToken middleware)
                $currentUser = $request->user();
                
                // Check if user is authenticated, return error if not
                if (empty($currentUser) || $currentUser == null) {
                    // User is missing, return 401 error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Authentication required'
                        )
                    ], 401);
                }
                
                // Determine source account type using instanceof checks
                $isUserModel = $currentUser instanceof UserModel;
                $isHostUserModel = $currentUser instanceof HostUserModel;
                
                // Validate that current user is either UserModel or HostUserModel
                if (!$isUserModel && !$isHostUserModel) {
                    // Invalid user type, return error response
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E003',
                            'error_message' => 'Invalid user type'
                        )
                    ], 403);
                }
                
                // Get target mode from request
                $targetMode = $data['mode'];
                
                // Check if user is trying to switch to the same mode they're already in
                if (($isUserModel && $targetMode == 'user') || ($isHostUserModel && $targetMode == 'host')) {
                    // User is already in the requested mode, return error
                    return response()->json([
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E001',
                            'error_message' => 'You are already in ' . $targetMode . ' mode'
                        )
                    ], 400);
                }
                
                // Initialize models
                $userModel = new UserModel();
                $hostUserModel = new HostUserModel();
                $businessModel = new BusinessModel();
                
                // Handle switching based on current account type and target mode
                if ($isUserModel && $targetMode == 'host') {
                    // Switching from User to Host
                    $result = $this->switchUserToHost($currentUser, $userModel, $hostUserModel, $businessModel);
                } elseif ($isHostUserModel && $targetMode == 'user') {
                    // Switching from Host to User
                    $result = $this->switchHostToUser($currentUser, $userModel, $hostUserModel);
                } else {
                    // Invalid combination (should not reach here due to validation above)
                    $result = array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E001',
                            'error_message' => 'Invalid mode switch combination'
                        )
                    );
                }
            } catch (\Exception $e) {
                // Log exception details for debugging purposes
                Log::info('Exception in ProfileSwitchController::switchProfile');
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
     * Switch from User to Host mode
     * 
     * Checks if host account exists with same email. If exists and not blocked,
     * generates token. If doesn't exist, creates new host account with business record.
     * 
     * @param UserModel $user Current user account
     * @param UserModel $userModel UserModel instance
     * @param HostUserModel $hostUserModel HostUserModel instance
     * @param BusinessModel $businessModel BusinessModel instance
     * @return array Response array
     */
    private function switchUserToHost($user, $userModel, $hostUserModel, $businessModel)
    {
        try {
            // Check if host account exists with the same email
            $queryCondition = array('email' => $user->email);
            $hostUser = $hostUserModel->get_host_user($queryCondition);
            
            if ($hostUser) {
                // Sync basic profile fields from user -> host (keeps host profile current when switching)
                // Re-fetch user from DB to ensure we have all profile columns available
                $userForCopy = $userModel->get_user(['user_id' => $user->user_id]);
                if (!empty($userForCopy)) {
                    $editData = array(
                        'first_name' => !empty($userForCopy->first_name) ? $userForCopy->first_name : ($hostUser->first_name ?? 'User'),
                        'last_name' => $userForCopy->last_name ?? $hostUser->last_name ?? null,
                        'phone_number' => $userForCopy->contact_number ?? $hostUser->phone_number ?? null,
                        'city' => $userForCopy->city ?? $hostUser->city ?? null,
                        'state_id' => $userForCopy->state_id ?? $hostUser->state_id ?? null,
                        'state' => $userForCopy->state ?? $hostUser->state ?? null,
                        'country' => $userForCopy->country ?? $hostUser->country ?? null,
                        'zipcode' => $userForCopy->zipcode ?? $hostUser->zipcode ?? null,
                        'profile_image' => $userForCopy->profile_image ?? $hostUser->profile_image ?? null,
                        'is_email_verification_complete' => $userForCopy->is_email_verification_complete ?? $hostUser->is_email_verification_complete ?? false,
                    );
                    $hostUserModel->update_host_user_data(['host_user_id' => $hostUser->host_user_id], $editData);
                    $hostUser = $hostUserModel->get_host_user(['host_user_id' => $hostUser->host_user_id]);
                }

                // Host account exists, check if blocked
                if ($hostUser->is_blocked) {
                    // Host account is blocked, return error
                    $blockMessage = !empty($hostUser->blocked_reason) ? $hostUser->blocked_reason : 'You are blocked by the admin. Please contact support.';
                    
                    return array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E004',
                            'error_message' => $blockMessage
                        )
                    );
                }
                
                // Host account exists and is not blocked, generate new token
                $token = $hostUser->createToken('host-user-token', ['*'], now()->addHour())->plainTextToken;
                
                // Prepare user information array for response (following hostUserLogin format)
                $userInfo = array(
                    'host_user_id' => $hostUser->host_user_id, // User ID
                    'first_name' => $hostUser->first_name, // First name
                    'last_name' => $hostUser->last_name, // Last name
                    'email' => $hostUser->email, // Email address
                    'profile_image' => $hostUser->profile_image, // Profile image path (if exists)
                    'phone_number' => $hostUser->phone_number, // Phone number (if exists)
                    'website' => $hostUser->website, // Website (if exists)
                    'city' => $hostUser->city, // City (if exists)
                    'state_id' => $hostUser->state_id, // State ID (if exists)
                    'state' => $hostUser->state, // State (if exists)
                    'country' => $hostUser->country, // Country (if exists)
                    'zipcode' => $hostUser->zipcode, // Zipcode (if linked to business)
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
                return array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Switched to host mode successfully',
                        'token' => $token,
                        'user_info' => $userInfo,
                    )
                );
            } else {
                // Host account does NOT exist, create new account
                // Begin database transaction
                DB::beginTransaction();
                
                try {
                    // Re-fetch user from DB to ensure profile columns (zipcode, dob, gender) are present when copying to new host
                    $userForCopy = $userModel->get_user(['user_id' => $user->user_id]);
                    if (empty($userForCopy)) {
                        DB::rollBack();
                        return array(
                            'success' => false,
                            'error' => array(
                                'error_code' => 'E002',
                                'error_message' => 'User account not found'
                            )
                        );
                    }

                    // Create business record for new host (account_type null; business_name = first + last name)
                    $firstName = !empty($userForCopy->first_name) ? trim($userForCopy->first_name) : 'User';
                    $lastName = !empty($userForCopy->last_name) ? trim($userForCopy->last_name) : null;
                    $businessName = $lastName !== null ? trim($firstName . ' ' . $lastName) : $firstName;
                    $businessData = array(
                        'account_type' => null, // Leave account type unset for profile-switch-created host
                        'business_name' => $businessName,
                    );
                    
                    // Create business record in the database
                    $business = $businessModel->create_business($businessData);
                    
                    // Normalize dob with Carbon for host_users date column
                    $dobFormatted = null;
                    if (!empty($userForCopy->dob)) {
                        try {
                            $dobFormatted = Carbon::parse($userForCopy->dob)->format('Y-m-d');
                        } catch (\Exception $e) {
                            $dobFormatted = null;
                        }
                    }

                    // Normalize gender to host_users enum values
                    $allowedGenders = ['Male', 'Female', 'Other', 'Prefer Not to say'];
                    $gender = in_array($userForCopy->gender ?? '', $allowedGenders)
                        ? ($userForCopy->gender ?? 'Prefer Not to say')
                        : 'Prefer Not to say';

                    // Prepare host user data array with mapped fields from user account (use $userForCopy for full profile)
                    // Note: Password is already hashed, Laravel's 'hashed' cast will detect this and not double-hash
                    $hostUserData = array(
                        'email' => $userForCopy->email, // Email address
                        'password' => $userForCopy->password, // Copy hashed password directly
                        'first_name' => !empty($userForCopy->first_name) ? $userForCopy->first_name : 'User', // First name (use default if missing)
                        'last_name' => $userForCopy->last_name ?? null, // Last name (nullable)
                        'phone_number' => $userForCopy->contact_number ?? null, // Phone number (from contact_number)
                        'city' => $userForCopy->city ?? null, // City
                        'state_id' => $userForCopy->state_id ?? null, // State ID (normalized)
                        'state' => $userForCopy->state ?? null, // State/region
                        'country' => $userForCopy->country ?? null, // Country
                        'zipcode' => $userForCopy->zipcode ?? null, // Zipcode
                        'gender' => $gender, // Gender (normalized to host enum)
                        'dob' => $dobFormatted, // Date of birth (Carbon-normalized)
                        'profile_image' => $userForCopy->profile_image ?? null, // Profile image
                        'business_id' => $business->business_id, // Link to created business
                        'is_primary' => true, // Set as business owner
                        'is_registration_otp_initiated' => false, // Clear OTP flag
                        'registration_otp' => null, // Clear OTP code
                        'is_email_verification_complete' => $userForCopy->is_email_verification_complete ?? false, // Copy email verification status
                        // All other fields (website, banking, stripe, etc.) = null by default
                    );
                    
                    // Create host user record in the database
                    $newHostUser = $hostUserModel->create_host_user($hostUserData);
                    
                    // Generate Laravel Sanctum token for newly created host account
                    $token = $newHostUser->createToken('host-user-token', ['*'], now()->addHour())->plainTextToken;
                    
                    // Prepare user information array for response
                    $userInfo = array(
                        'host_user_id' => $newHostUser->host_user_id, // User ID
                        'first_name' => $newHostUser->first_name, // First name
                        'last_name' => $newHostUser->last_name, // Last name
                        'email' => $newHostUser->email, // Email address
                        'profile_image' => $newHostUser->profile_image, // Profile image path (if exists)
                        'phone_number' => $newHostUser->phone_number, // Phone number (if exists)
                        'website' => $newHostUser->website, // Website (if exists)
                        'city' => $newHostUser->city, // City (if exists)
                        'state_id' => $newHostUser->state_id, // State ID (if exists)
                        'state' => $newHostUser->state, // State (if exists)
                        'country' => $newHostUser->country, // Country (if exists)
                        'zipcode' => $newHostUser->zipcode, // Zipcode (if exists)
                        'business_id' => $newHostUser->business_id, // Business ID (linked to business)
                        'is_primary' => $newHostUser->is_primary, // Is primary business owner flag
                    );
                    
                    // Include business information
                    $userInfo['business'] = array(
                        'business_name' => $business->business_name, // Business name
                        'account_type' => $business->account_type, // Account type (personal)
                        'business_intersection_id' => $business->business_intersection_id,
                        'other_business_intersection' => $business->other_business_intersection,
                    );
                    if (!empty($business->business_intersection_id)) {
                        $business->load('businessIntersection');
                        if (!empty($business->businessIntersection)) {
                            $userInfo['business']['business_intersection'] = array(
                                'id' => $business->businessIntersection->id,
                                'name' => $business->businessIntersection->name,
                            );
                        }
                    }
                    
                    // Commit transaction
                    DB::commit();
                    
                    // Return success response with token and user information
                    return array(
                        'success' => true,
                        'data' => array(
                            'message' => 'Switched to host mode successfully',
                            'token' => $token,
                            'user_info' => $userInfo,
                        )
                    );
                } catch (\Exception $e) {
                    // Rollback transaction on error
                    DB::rollBack();
                    
                    // Log exception details
                    Log::info('Exception in ProfileSwitchController::switchUserToHost - Account Creation');
                    Log::info($e->getMessage());
                    Log::info($e);
                    
                    // Return error response
                    return array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E002',
                            'error_message' => 'An error occurred while creating host account'
                        )
                    );
                }
            }
        } catch (\Exception $e) {
            // Log exception details
            Log::info('Exception in ProfileSwitchController::switchUserToHost');
            Log::info($e->getMessage());
            Log::info($e);
            
            // Return error response
            return array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while switching to host mode'
                )
            );
        }
    }
    
    /**
     * Switch from Host to User mode
     * 
     * Checks if user account exists with same email. If exists, generates token.
     * If doesn't exist, creates new user account.
     * 
     * @param HostUserModel $hostUser Current host user account
     * @param UserModel $userModel UserModel instance
     * @param HostUserModel $hostUserModel HostUserModel instance
     * @return array Response array
     */
    private function switchHostToUser($hostUser, $userModel, $hostUserModel)
    {
        try {
            // Check if user account exists with the same email
            $queryCondition = array('email' => $hostUser->email);
            $user = $userModel->get_user($queryCondition);
            
            if ($user) {
                // User account exists: sync profile from host so name, contact, location (city/state/country), zip, gender, email verification are up to date
                $allowedGenders = ['Male', 'Female', 'Other', 'Prefer Not to say'];
                $gender = in_array($hostUser->gender ?? '', $allowedGenders)
                    ? ($hostUser->gender ?? 'Prefer Not to say')
                    : 'Prefer Not to say';
                $editData = array(
                    'first_name' => !empty($hostUser->first_name) ? $hostUser->first_name : 'User',
                    'last_name' => $hostUser->last_name ?? null,
                    'contact_number' => $hostUser->phone_number ?? null,
                    'city' => $hostUser->city ?? null,
                    'state_id' => $hostUser->state_id ?? null,
                    'state' => $hostUser->state ?? null,
                    'country' => $hostUser->country ?? null,
                    'zipcode' => $hostUser->zipcode ?? null,
                    'gender' => $gender,
                    'dob' => $hostUser->dob ?? null,
                    'profile_image' => $hostUser->profile_image ?? null,
                    'is_email_verification_complete' => $hostUser->is_email_verification_complete ?? false,
                );
                $userModel->update_user_data(['user_id' => $user->user_id], $editData);
                $user = $userModel->get_user(['user_id' => $user->user_id]);

                // Generate new token for the user
                $token = $user->createToken('auth-token', ['*'], now()->addHour())->plainTextToken;

                // Prepare user information for response (following userLogin format)
                $userInfo = array(
                    'user_id' => $user->user_id, // User ID
                    'first_name' => $user->first_name, // User's first name
                    'last_name' => $user->last_name, // User's last name
                    'email' => $user->email, // User's email address
                    'contact_number' => $user->contact_number, // Contact number (if available)
                    'city' => $user->city, // City (if available)
                    'state_id' => $user->state_id, // State ID (if available)
                    'state' => $user->state, // State/region (if available)
                    'country' => $user->country, // Country (if available)
                    'zipcode' => $user->zipcode, // Zipcode (if available)
                    'gender' => $user->gender, // Gender (if available)
                    'dob' => $user->dob, // Date of birth (if available)
                    'profile_image' => $user->profile_image, // Profile image path (if available)
                    'email_verified' => ($user->is_email_verification_complete ?? false) ? 1 : 0,
                );

                // Return success response with token and user information
                return array(
                    'success' => true,
                    'data' => array(
                        'message' => 'Switched to user mode successfully',
                        'token' => $token,
                        'user_info' => $userInfo,
                    )
                );
            } else {
                // User account does NOT exist, create new account
                // Begin database transaction
                DB::beginTransaction();
                
                try {
                    // Prepare user data array with mapped fields from host account
                    // Note: Password is already hashed, Laravel's 'hashed' cast will detect this and not double-hash
                    $userData = array(
                        'email' => $hostUser->email, // Email address
                        'password' => $hostUser->password, // Copy hashed password directly
                        'first_name' => !empty($hostUser->first_name) ? $hostUser->first_name : 'User', // First name (use default if missing)
                        'last_name' => $hostUser->last_name ?? null, // Last name (nullable)
                        'contact_number' => $hostUser->phone_number ?? null, // Contact number (from phone_number)
                        'city' => $hostUser->city ?? null, // City
                        'state_id' => $hostUser->state_id ?? null, // State ID
                        'state' => $hostUser->state ?? null, // State/region
                        'country' => $hostUser->country ?? null, // Country
                        'zipcode' => $hostUser->zipcode ?? null, // Zipcode
                        'gender' => $hostUser->gender ?? 'Prefer Not to say', // Gender (default if missing)
                        'dob' => $hostUser->dob ?? null, // Date of birth
                        'profile_image' => $hostUser->profile_image ?? null, // Profile image
                        'is_registration_otp_initiated' => false, // Clear OTP flag
                        'registration_otp' => null, // Clear OTP code
                        'is_email_verification_complete' => $hostUser->is_email_verification_complete ?? false, // Copy email verification status
                        // All other fields = null or defaults
                    );
                    
                    // Create user record in the database
                    $newUser = $userModel->create_user($userData);
                    
                    // Generate Laravel Sanctum token for newly created user account
                    $token = $newUser->createToken('auth-token', ['*'], now()->addHour())->plainTextToken;
                    
                    // Prepare user information for response
                    $userInfo = array(
                        'user_id' => $newUser->user_id, // User ID
                        'first_name' => $newUser->first_name, // User's first name
                        'last_name' => $newUser->last_name, // User's last name
                        'email' => $newUser->email, // User's email address
                        'contact_number' => $newUser->contact_number, // Contact number (if available)
                        'city' => $newUser->city, // City (if available)
                        'state_id' => $newUser->state_id, // State ID (if available)
                        'state' => $newUser->state, // State/region (if available)
                        'country' => $newUser->country, // Country (if available)
                        'zipcode' => $newUser->zipcode, // Zipcode (if available)
                        'gender' => $newUser->gender, // Gender (if available)
                        'dob' => $newUser->dob, // Date of birth (if available)
                        'profile_image' => $newUser->profile_image, // Profile image path (if available)
                        'email_verified' => ($newUser->is_email_verification_complete ?? false) ? 1 : 0,
                    );

                    // Commit transaction
                    DB::commit();
                    
                    // Return success response with token and user information
                    return array(
                        'success' => true,
                        'data' => array(
                            'message' => 'Switched to user mode successfully',
                            'token' => $token,
                            'user_info' => $userInfo,
                        )
                    );
                } catch (\Exception $e) {
                    // Rollback transaction on error
                    DB::rollBack();
                    
                    // Log exception details
                    Log::info('Exception in ProfileSwitchController::switchHostToUser - Account Creation');
                    Log::info($e->getMessage());
                    Log::info($e);
                    
                    // Return error response
                    return array(
                        'success' => false,
                        'error' => array(
                            'error_code' => 'E002',
                            'error_message' => 'An error occurred while creating user account'
                        )
                    );
                }
            }
        } catch (\Exception $e) {
            // Log exception details
            Log::info('Exception in ProfileSwitchController::switchHostToUser');
            Log::info($e->getMessage());
            Log::info($e);
            
            // Return error response
            return array(
                'success' => false,
                'error' => array(
                    'error_code' => 'E002',
                    'error_message' => 'An error occurred while switching to user mode'
                )
            );
        }
    }
}

