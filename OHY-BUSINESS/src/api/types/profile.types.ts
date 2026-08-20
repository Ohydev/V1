/**
 * Profile-related TypeScript type definitions
 * These types match the Laravel API response structure
 */

// Import user and business info types from auth types
import { UserInfo, BusinessInfo } from "./auth.types";

/**
 * Update personal profile request structure
 * Matches API endpoint: POST /api/v1/update_host_user_profile
 */
export interface UpdateProfileRequest {
  // First name (required)
  first_name: string;
  // Last name (required)
  last_name: string;
  // Phone number (optional)
  phone_number?: string | null;
  // Website URL (optional)
  website?: string | null;
  // City (required in UI, optional in API payload)
  city?: string | null;
  // State / region (required in UI, optional in API payload)
  state?: string | null;
  // State ID (foreign key to states table, optional in API payload)
  state_id?: number | null;
  // Country name (required in UI, optional in API payload)
  country?: string | null;
  // Zipcode (optional)
  zipcode?: string | null;
  // Gender (optional)
  gender?: string | null;
  // Profile image file (optional, multipart/form-data)
  profile_image?: File | null;
}

/**
 * Update profile response structure
 */
export interface UpdateProfileResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Updated user information
    user_info: UserInfo;
  };
}

/**
 * Update business info request structure
 * Matches API endpoint: POST /api/v1/update_host_user_business_info
 */
export interface UpdateBusinessInfoRequest {
  // Account type: "business" or "personal" (optional, for update)
  account_type?: "business" | "personal" | null;
  // Business name (required)
  business_name: string;
  // Business type (optional, free text)
  business_type?: string | null;
  // Industry (optional, free text)
  industry?: string | null;
  // Company size (optional, free text)
  company_size?: string | null;
  // Tax ID (EIN) - MANDATORY
  tax_id: string;
  // Business street address (required)
  business_street_address: string;
  // Business city (required)
  business_city: string;
  // Business state (required)
  business_state: string;
  // Business postal code (required)
  business_postal_code: string;
  // Business country ID (optional, foreign key to countries table)
  business_country_id?: number | null;
  // Business intersection ID (for business account type)
  business_intersection_id?: number | null;
  // Other business intersection (required when business_intersection_id is "Others" / 6)
  other_business_intersection?: string | null;
}

/**
 * Update business info response structure
 */
export interface UpdateBusinessInfoResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Updated business information
    business_info: BusinessInfo;
  };
}

/**
 * Update password request structure
 * Matches API endpoint: POST /api/v1/update_host_user_password
 */
export interface UpdatePasswordRequest {
  // Current password (required)
  current_password: string;
  // New password (required)
  new_password: string;
  // Confirm password (required)
  confirm_password: string;
}

/**
 * Update password response structure
 */
export interface UpdatePasswordResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
  };
}

/**
 * Update banking details request structure
 * Matches API endpoint: POST /api/v1/update_host_user_banking_details
 */
export interface UpdateBankingDetailsRequest {
  // Account holder name (required)
  account_holder_name: string;
  // Bank name (required)
  bank_name: string;
  // Account number (optional, will be encrypted on backend)
  account_number?: string | null;
  // Routing number (optional)
  routing_number?: string | null;
  // PayPal email (optional)
  paypal_email?: string | null;
}

/**
 * Update banking details response structure
 * Note: account_number is NOT included in banking_info for security reasons
 */
export interface UpdateBankingDetailsResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Banking information (account_number excluded for security)
    banking_info?: {
      // Account holder name
      account_holder_name: string | null;
      // Bank name
      bank_name: string | null;
      // Routing number
      routing_number: string | null;
      // PayPal email
      paypal_email: string | null;
    };
  };
}

/**
 * Personal information structure from get profile API
 */
export interface PersonalInfo {
  // First name
  first_name: string;
  // Last name
  last_name: string;
  // Email address
  email: string;
  // Profile image path (relative path)
  profile_image: string | null;
  // Phone number (optional)
  phone_number: string | null;
  // Website URL (optional)
  website: string | null;
  // City (optional)
  city: string | null;
  // State / region (optional)
  state: string | null;
  // Country name (optional)
  country: string | null;
  // State ID (optional, foreign key to states table)
  state_id: number | null;
  // Zipcode (optional)
  zipcode: string | null;
  // Gender (optional)
  gender: string | null;
}

/**
 * Business intersection object from get profile API (nested under business)
 */
export interface BusinessIntersectionFromAPI {
  id: number;
  name: string;
}

/**
 * Business information structure from get profile API
 */
export interface BusinessInfoFromAPI {
  // Business ID
  business_id: number;
  // Business name
  business_name: string;
  // Account type
  account_type: string;
  // Business type (optional, free text)
  business_type: string | null;
  // Industry (optional, free text)
  industry: string | null;
  // Company size (optional, free text)
  company_size: string | null;
  // Tax ID (EIN)
  tax_id: string | null;
  // Business street address
  business_street_address: string | null;
  // Business city
  business_city: string | null;
  // Business state
  business_state: string | null;
  // Business ZIP code (API returns as business_zip_code)
  business_zip_code: string | null;
  // Business country ID (foreign key)
  business_country_id: number | null;
  // Business intersection ID (for business account type)
  business_intersection_id: number | null;
  // Other business intersection (when business_intersection_id is "Others" / 6)
  other_business_intersection: string | null;
  // Country object with country details
  country: {
    // Country ID
    country_id: number;
    // Country name
    name: string;
  } | null;
  // Business intersection object (id, name)
  business_intersection: BusinessIntersectionFromAPI | null;
}

/**
 * Banking information structure from get profile API
 * All fields can be null when not set
 */
export interface BankingInfo {
  // Account holder name
  account_holder_name: string | null;
  // Bank name
  bank_name: string | null;
  // Routing number (optional)
  routing_number: string | null;
  // PayPal email (optional)
  paypal_email: string | null;
  // Account number (encrypted, may be masked)
  account_number: string | null;
}

/**
 * Get host user profile response structure
 * Matches API endpoint: GET /api/v1/get_host_user_profile
 */
export interface GetProfileResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Personal information
    personal: PersonalInfo;
    // Business information (optional, only if user has business)
    business: BusinessInfoFromAPI | null;
    // Banking information (optional)
    banking: BankingInfo | null;
  };
}

/**
 * State information structure from get states API
 * Matches API endpoint: GET /api/v1/get_states
 */
export interface State {
  // State ID (primary key)
  state_id: number;
  // State name
  name: string;
}

/**
 * Get states response structure
 * Matches API endpoint: GET /api/v1/get_states
 */
export interface GetStatesResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Array of states
    states: State[];
  };
}

/**
 * Country information structure from get countries API
 * Matches API endpoint: GET /api/v1/get_countries
 */
export interface Country {
  // Country ID (primary key)
  country_id: number;
  // ISO code (2 letters)
  iso: string;
  // Country name (uppercase)
  name: string;
  // Country nice name (formatted)
  nicename: string;
  // Flag icon filename
  flag_icon: string;
  // ISO3 code (3 letters)
  iso3: string;
  // Numeric code
  numcode: number;
  // Phone code
  phonecode: number;
}

/**
 * Get countries response structure
 * Matches API endpoint: GET /api/v1/get_countries
 */
export interface GetCountriesResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Array of countries
    countries: Country[];
  };
}

