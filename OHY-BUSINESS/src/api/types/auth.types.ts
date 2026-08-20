/**
 * Authentication-related TypeScript type definitions
 * These types match the Laravel API response structure
 */

/**
 * Business intersection item from get_business_intersections API
 */
export interface BusinessIntersection {
  id: number;
  name: string;
}

/**
 * Response from GET /api/v1/get_business_intersections
 */
export interface GetBusinessIntersectionsResponse {
  success: true;
  data: {
    message: string;
    business_intersections: BusinessIntersection[];
  };
}

/**
 * Register request payload structure
 * Matches API endpoint: POST /api/v1/host_user_register
 */
export interface RegisterRequest {
  // First name of the user (required)
  first_name: string;
  // Last name of the user (required)
  last_name: string;
  // Email address (required, must be unique)
  email: string;
  // Location (required)
  location: string;
  // Zipcode (required)
  zipcode: string;
  // Gender (required): "Male", "Female", "Other", "Prefer not to say"
  gender: string;
  // Date of birth (required, yyyy-MM-dd)
  dob: string;
  // Password (required, min 8 chars, must contain uppercase, lowercase, number, special char)
  password: string;
  // Confirm password (required, must match password)
  confirm_password: string;
  // OTP code (required for registration after OTP request)
  otp?: string;
}

/**
 * OTP request payload structure
 * Matches API endpoint: POST /api/v1/host_registration_otp_request
 */
export interface OtpRequestRequest {
  // Email address (required)
  email: string;
}

/**
 * OTP request response structure from API
 */
export interface OtpRequestResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
  };
}

/**
 * User information structure from API response
 */
export interface UserInfo {
  // Host user ID
  host_user_id: number;
  // First name
  first_name: string;
  // Last name
  last_name: string;
  // Email address
  email: string;
  // Profile image path (optional)
  profile_image?: string | null;
  // Phone number (optional)
  phone_number?: string | null;
  // Website URL (optional)
  website?: string | null;
  // Location (optional)
  location?: string | null;
  // Zipcode (optional)
  zipcode?: string | null;
  // Gender (optional)
  gender?: string | null;
  // Business ID (optional, from login response)
  business_id?: number | null;
  // Is primary user flag (optional, from login response)
  is_primary?: boolean | null;
  // Business information nested in user_info (optional, from login response)
  business?: {
    // Business name
    business_name: string;
    // Account type
    account_type: "business" | "personal";
  } | null;
}

/**
 * Business information structure from API response
 */
export interface BusinessInfo {
  // Business ID
  business_id: number;
  // Business name
  business_name: string;
  // Account type
  account_type: "business" | "personal";
  // Business type (optional, free text)
  business_type?: string | null;
  // Industry (optional, free text)
  industry?: string | null;
  // Company size (optional, free text)
  company_size?: string | null;
  // Tax ID (EIN) (optional)
  tax_id?: string | null;
  // Business intersection ID (for business account type)
  business_intersection_id?: number | null;
  // Other business intersection (when business_intersection_id is "Others" / 6)
  other_business_intersection?: string | null;
}

/**
 * Register response structure from API
 */
export interface RegisterResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
  };
}

/**
 * Standard API error response structure
 */
export interface ApiErrorResponse {
  // Success flag (always false for errors)
  success: false;
  // Error details
  error: {
    // Error code (e.g., "E001", "E002", "E003")
    error_code: string;
    // Error message (can be string or object for validation errors)
    error_message: string | Record<string, string[]>;
  };
}

/**
 * Login request payload structure
 * Matches API endpoint: POST /api/v1/host_user_login
 */
export interface LoginRequest {
  // Email address (required, must be valid email format)
  email: string;
  // Password (required)
  password: string;
  // Remember me flag - extends token expiration to 30 days if true, 1 hour if false
  remember_me: boolean;
}

/**
 * Login response structure from API
 */
export interface LoginResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Authentication token (Laravel Sanctum token)
    token: string;
    // User information
    user_info: UserInfo;
    // Business information (optional, only if user has business linked)
    business_info?: BusinessInfo;
  };
}

/**
 * Standard API success response structure
 */
export interface ApiSuccessResponse<T> {
  // Success flag (always true)
  success: true;
  // Response data
  data: T;
}

/**
 * Forgot password OTP request payload structure
 * Matches API endpoint: POST /api/v1/host_forgot_password_request
 */
export interface ForgotPasswordOtpRequest {
  // Email address (required)
  email: string;
}

/**
 * Forgot password OTP request response structure from API
 */
export interface ForgotPasswordOtpResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
  };
}

/**
 * Verify forgot password OTP request payload structure
 * Matches API endpoint: POST /api/v1/host_verify_forgot_password_otp
 */
export interface VerifyForgotPasswordOtpRequest {
  // Email address (required)
  email: string;
  // OTP code (required)
  otp: string;
}

/**
 * Verify forgot password OTP response structure from API
 */
export interface VerifyForgotPasswordOtpResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
  };
}

/**
 * Reset password request payload structure
 * Matches API endpoint: POST /api/v1/host_reset_password
 */
export interface ResetPasswordRequest {
  // Email address (required)
  email: string;
  // OTP code (required)
  otp: string;
  // New password (required, min 8 chars, must contain uppercase, lowercase, number, special char)
  new_password: string;
  // Confirm password (required, must match new_password)
  confirm_password: string;
}

/**
 * Reset password response structure from API
 */
export interface ResetPasswordResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
  };
}

/**
 * Switch profile request payload structure
 * Matches API endpoint: POST /api/v1/switch_profile
 */
export interface SwitchProfileRequest {
  // Mode to switch to (e.g., "user")
  mode: string;
}

/**
 * User information structure from switch profile API response
 */
export interface SwitchProfileUserInfo {
  // User ID
  user_id: number;
  // First name
  first_name: string;
  // Last name
  last_name: string;
  // Email address
  email: string;
  // Contact number (optional)
  contact_number: string | null;
  // Location (optional)
  location: string | null;
  // Zipcode (optional)
  zipcode: string | null;
  // Gender (optional)
  gender: string | null;
  // Date of birth (optional)
  dob: string | null;
  // Profile image path (optional)
  profile_image: string | null;
}

/**
 * Switch profile response structure from API
 */
export interface SwitchProfileResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Authentication token for the switched profile
    token: string;
    // User information
    user_info: SwitchProfileUserInfo;
  };
}

