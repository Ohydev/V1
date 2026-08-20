/**
 * Profile Service
 * Handles all profile-related API calls
 * Endpoints: Get Profile, Update Profile, Update Business Info, Update Password, Update Banking Details
 */

import { makeRequest } from "./apiClient";
import {
  UpdateProfileRequest,
  UpdateProfileResponse,
  UpdateBusinessInfoRequest,
  UpdateBusinessInfoResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  UpdateBankingDetailsRequest,
  UpdateBankingDetailsResponse,
  GetProfileResponse,
  GetCountriesResponse,
  GetStatesResponse,
} from "../types/profile.types";

/**
 * Get host user profile information
 * API Endpoint: GET /api/v1/get_host_user_profile
 * 
 * @returns Promise with user profile and optional business info
 * @throws AxiosError if request fails
 */
export const getHostUserProfile = async (): Promise<GetProfileResponse> => {
  // Make GET request to profile endpoint
  const response = await makeRequest<GetProfileResponse>(
    "/get_host_user_profile",
    "GET"
  );
  // Return response data
  return response.data;
};

/**
 * Update host user personal profile
 * API Endpoint: POST /api/v1/update_host_user_profile
 * Request Type: multipart/form-data (for file upload)
 * 
 * @param data - Profile update data including optional profile_image file
 * @returns Promise with updated user information
 * @throws AxiosError if request fails
 */
export const updateHostUserProfile = async (
  data: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  // Create FormData object for multipart/form-data request
  const formData = new FormData();
  // Append first name to form data
  formData.append("first_name", data.first_name);
  // Append last name to form data
  formData.append("last_name", data.last_name);
  // Append phone number if provided
  if (data.phone_number) {
    formData.append("phone_number", data.phone_number);
  }
  // Append website if provided
  if (data.website) {
    formData.append("website", data.website);
  }
  // Append city if provided
  if (data.city) {
    formData.append("city", data.city);
  }
  // Append state if provided
  if (data.state) {
    formData.append("state", data.state);
  }
  // Append state_id if provided
  if (data.state_id != null) {
    formData.append("state_id", String(data.state_id));
  }
  // Append country if provided
  if (data.country) {
    formData.append("country", data.country);
  }
  // Append zipcode if provided
  if (data.zipcode) {
    formData.append("zipcode", data.zipcode);
  }
  // Append gender if provided
  if (data.gender) {
    formData.append("gender", data.gender);
  }
  // Append profile image file if provided
  if (data.profile_image) {
    formData.append("profile_image", data.profile_image);
  }

  // Make POST request with multipart/form-data for file uploads
  const response = await makeRequest<UpdateProfileResponse>(
    "/update_host_user_profile",
    "POST",
    formData,
    {
      // Set content type for file uploads (browser will set boundary automatically)
      "Content-Type": "multipart/form-data",
    }
  );
  // Return response data
  return response.data;
};

/**
 * Update host user business information
 * API Endpoint: POST /api/v1/update_host_user_business_info
 * 
 * @param data - Business information update data (Tax ID is mandatory)
 * @returns Promise with updated business information
 * @throws AxiosError if request fails
 */
export const updateHostUserBusinessInfo = async (
  data: UpdateBusinessInfoRequest
): Promise<UpdateBusinessInfoResponse> => {
  // For personal accounts, backend still requires a business_name.
  // Send only the minimal payload to avoid triggering validation on business-only fields.
  if (data.account_type === "personal") {
    const response = await makeRequest<UpdateBusinessInfoResponse>(
      "/update_host_user_business_info",
      "POST",
      {
        account_type: "personal",
        business_name: data.business_name,
      }
    );
    return response.data;
  }

  // Map form field names to API field names
  // Form uses business_postal_code, API expects business_zip_code
  const apiData = {
    ...(data.account_type != null && { account_type: data.account_type }),
    business_name: data.business_name,
    business_type: data.business_type || null,
    industry: data.industry || null,
    company_size: data.company_size || null,
    tax_id: data.tax_id || null,
    business_street_address: data.business_street_address || null,
    business_city: data.business_city || null,
    business_state: data.business_state || null,
    // Map business_postal_code from form to business_zip_code for API
    business_zip_code: data.business_postal_code || null,
    business_country_id: data.business_country_id || null,
    business_intersection_id: data.business_intersection_id ?? null,
    other_business_intersection: data.business_intersection_id === 6 && data.other_business_intersection?.trim()
      ? data.other_business_intersection.trim()
      : null,
  };

  // Make POST request to business info update endpoint
  const response = await makeRequest<UpdateBusinessInfoResponse>(
    "/update_host_user_business_info",
    "POST",
    apiData
  );
  // Return response data
  return response.data;
};

/**
 * Update host user password
 * API Endpoint: POST /api/v1/update_host_user_password
 * 
 * @param data - Password update data including current_password, new_password, confirm_password
 * @returns Promise with success message
 * @throws AxiosError if request fails
 */
export const updateHostUserPassword = async (
  data: UpdatePasswordRequest
): Promise<UpdatePasswordResponse> => {
  // Map form field names to API field names
  // Form uses confirm_password, API expects confirm_new_password
  const apiData = {
    current_password: data.current_password,
    new_password: data.new_password,
    // Map confirm_password from form to confirm_new_password for API
    confirm_new_password: data.confirm_password,
  };

  // Make POST request to password update endpoint
  const response = await makeRequest<UpdatePasswordResponse>(
    "/update_host_user_password",
    "POST",
    apiData
  );
  // Return response data
  return response.data;
};

/**
 * Update host user banking details
 * API Endpoint: POST /api/v1/update_host_user_banking_details
 * 
 * @param data - Banking details update data (account_number will be encrypted on backend)
 * @returns Promise with success message
 * @throws AxiosError if request fails
 */
export const updateHostUserBankingDetails = async (
  data: UpdateBankingDetailsRequest
): Promise<UpdateBankingDetailsResponse> => {
  // Map form data to API format
  // Convert empty strings to null for optional fields (API requirement)
  const apiData = {
    account_holder_name: data.account_holder_name,
    bank_name: data.bank_name,
    // Convert empty strings to null for optional fields
    // Trim whitespace before checking if empty
    account_number: data.account_number && data.account_number.trim() !== "" ? data.account_number : null,
    routing_number: data.routing_number && data.routing_number.trim() !== "" ? data.routing_number : null,
    // PayPal email is hardcoded to null (field removed from UI)
    paypal_email: null,
  };

  // Make POST request to banking details update endpoint
  const response = await makeRequest<UpdateBankingDetailsResponse>(
    "/update_host_user_banking_details",
    "POST",
    apiData
  );
  // Return response data
  return response.data;
};

/**
 * Get countries list
 * API Endpoint: GET /api/v1/get_countries
 * No authentication required
 * 
 * @returns Promise with countries list
 * @throws AxiosError if request fails
 */
export const getCountries = async (): Promise<GetCountriesResponse> => {
  // Make GET request to countries endpoint
  const response = await makeRequest<GetCountriesResponse>(
    "/get_countries",
    "GET"
  );
  // Return response data
  return response.data;
};

/**
 * Get states list
 * API Endpoint: GET /api/v1/get_states
 *
 * @returns Promise with states list
 * @throws AxiosError if request fails
 */
export const getStates = async (): Promise<GetStatesResponse> => {
  // Make GET request to states endpoint
  const response = await makeRequest<GetStatesResponse>("/get_states", "GET");
  // Return response data
  return response.data;
};

