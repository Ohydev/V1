// Import shared makeRequest helper to ensure consistent API calls.
import { makeRequest } from "../client";
// Import endpoints map to avoid hardcoding strings.
import { endpoints } from "../endpoints";

// Define the payload required by the super admin login endpoint.
export type SuperAdminLoginRequest = {
  // Email address supplied by the administrator.
  email: string;
  // Password string supplied by the administrator.
  password: string;
  // Optional remember flag determining persistence behavior.
  remember_me?: boolean;
};

// Define the structure describing the authenticated super admin.
export type SuperAdminInfo = {
  // Unique identifier for the super admin.
  super_admin_id: number;
  // Email address of the account.
  email: string;
  // First name returned by backend.
  first_name: string;
  // Last name returned by backend.
  last_name: string;
  // Contact phone number string.
  phone_number: string;
  // Nullable profile image URL or path.
  profile_image: string | null;
};

// Define the expected data returned on successful login.
export type SuperAdminLoginResponse = {
  // Backend supplied success message.
  message: string;
  // Object containing the authenticated super admin details.
  super_admin_info: SuperAdminInfo;
  // Token issued by Laravel Sanctum for authenticated calls.
  token: string;
};

// Define the payload accepted by the update profile endpoint.
export type UpdateSuperAdminProfileRequest = {
  // First name string is mandatory.
  first_name: string;
  // Last name string is mandatory.
  last_name: string;
  // Optional phone number string.
  phone_number?: string | null;
  // Optional profile image file reference.
  profile_image?: File | null;
};

// Define response structure for the profile endpoint.
export type SuperAdminProfileResponse = {
  // Backend supplied success message for profile retrieval.
  message: string;
  // Object containing the authenticated super admin details.
  super_admin_info: SuperAdminInfo;
};

// Define the response returned when updating the profile.
export type UpdateSuperAdminProfileResponse = SuperAdminProfileResponse;

// Call the login endpoint and return the parsed response data.
export const superAdminLogin = async (
  payload: SuperAdminLoginRequest
): Promise<SuperAdminLoginResponse> => {
  // Execute the POST request using the shared makeRequest helper.
  return makeRequest<SuperAdminLoginResponse>(
    endpoints.superAdminLogin,
    "POST",
    payload
  );
};

// Fetch the currently authenticated super admin profile.
export const getSuperAdminProfile = async (): Promise<SuperAdminProfileResponse> => {
  // Execute the GET request using the shared makeRequest helper.
  return makeRequest<SuperAdminProfileResponse>(
    endpoints.superAdminProfile,
    "GET"
  );
};

// Update the authenticated super admin profile using multipart form data.
export const updateSuperAdminProfile = async (
  payload: UpdateSuperAdminProfileRequest
): Promise<UpdateSuperAdminProfileResponse> => {
  // Initialize FormData to send both text fields and file uploads.
  const formData = new FormData();
  // Append the first name as required by backend validation rules.
  formData.append("first_name", payload.first_name);
  // Append the last name as required by backend validation rules.
  formData.append("last_name", payload.last_name);
  // Append the optional phone number even when empty string is intentionally supplied.
  if (typeof payload.phone_number === "string") {
    formData.append("phone_number", payload.phone_number);
  }
  // Append the optional profile image when a file is supplied.
  if (payload.profile_image instanceof File) {
    formData.append("profile_image", payload.profile_image);
  }
  // Execute the POST request using the shared makeRequest helper.
  return makeRequest<UpdateSuperAdminProfileResponse>(
    endpoints.updateSuperAdminProfile,
    "POST",
    formData,
    {
      // Ensure multipart content type is explicitly provided.
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

