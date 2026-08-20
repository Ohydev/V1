/**
 * Authentication Service
 * Handles all authentication-related API calls
 * Endpoints: Registration, Login, etc.
 */

import { makeRequest } from "./apiClient";
import { RegisterRequest, RegisterResponse, LoginRequest, LoginResponse, ApiErrorResponse, OtpRequestRequest, OtpRequestResponse, ForgotPasswordOtpRequest, ForgotPasswordOtpResponse, VerifyForgotPasswordOtpRequest, VerifyForgotPasswordOtpResponse, ResetPasswordRequest, ResetPasswordResponse, SwitchProfileRequest, SwitchProfileResponse, GetBusinessIntersectionsResponse } from "../types/auth.types";

/**
 * Register a new host user (business or personal account)
 * API Endpoint: POST /api/v1/host_user_register
 * 
 * @param data - Registration data including account_type, first_name, last_name, email, password, confirm_password, and business_name (for business accounts)
 * @returns Promise with registration response
 * @throws AxiosError if request fails
 */
export const registerHostUser = async (data: RegisterRequest): Promise<RegisterResponse> => {
  // Make POST request to registration endpoint
  const response = await makeRequest<RegisterResponse>(
    "/host_user_register",
    "POST",
    data
  );
  // Return response data
  return response.data;
};

/**
 * Get business intersections for registration (business account type)
 * API Endpoint: GET /api/v1/get_business_intersections
 *
 * @returns Promise with list of business intersections
 * @throws AxiosError if request fails
 */
export const getBusinessIntersections = async (): Promise<GetBusinessIntersectionsResponse> => {
  const response = await makeRequest<GetBusinessIntersectionsResponse>(
    "/get_business_intersections",
    "GET"
  );
  return response.data;
};

/**
 * Request OTP for host user registration
 * API Endpoint: POST /api/v1/host_registration_otp_request
 * 
 * @param data - OTP request data including email
 * @returns Promise with OTP request response
 * @throws AxiosError if request fails
 */
export const requestHostRegistrationOtp = async (data: OtpRequestRequest): Promise<OtpRequestResponse> => {
  // Make POST request to OTP request endpoint
  const response = await makeRequest<OtpRequestResponse>(
    "/host_registration_otp_request",
    "POST",
    data
  );
  // Return response data
  return response.data;
};

/**
 * Login host user
 * API Endpoint: POST /api/v1/host_user_login
 * 
 * @param data - Login credentials including email, password, and remember_me flag
 * @returns Promise with login response containing token, user_info, and optional business_info
 * @throws AxiosError if request fails
 */
export const loginHostUser = async (data: LoginRequest): Promise<LoginResponse> => {
  // Make POST request to login endpoint
  const response = await makeRequest<LoginResponse>(
    "/host_user_login",
    "POST",
    data
  );
  // Return response data
  return response.data;
};

/**
 * Request OTP for forgot password
 * API Endpoint: POST /api/v1/host_forgot_password_request
 * 
 * @param data - Forgot password OTP request data including email
 * @returns Promise with OTP request response
 * @throws AxiosError if request fails
 */
export const requestForgotPasswordOtp = async (data: ForgotPasswordOtpRequest): Promise<ForgotPasswordOtpResponse> => {
  // Make POST request to forgot password OTP request endpoint
  const response = await makeRequest<ForgotPasswordOtpResponse>(
    "/host_forgot_password_request",
    "POST",
    data
  );
  // Return response data
  return response.data;
};

/**
 * Verify OTP for forgot password
 * API Endpoint: POST /api/v1/host_verify_forgot_password_otp
 * 
 * @param data - Verify OTP request data including email and otp
 * @returns Promise with verify OTP response
 * @throws AxiosError if request fails
 */
export const verifyForgotPasswordOtp = async (data: VerifyForgotPasswordOtpRequest): Promise<VerifyForgotPasswordOtpResponse> => {
  // Make POST request to verify forgot password OTP endpoint
  const response = await makeRequest<VerifyForgotPasswordOtpResponse>(
    "/host_verify_forgot_password_otp",
    "POST",
    data
  );
  // Return response data
  return response.data;
};

/**
 * Reset password
 * API Endpoint: POST /api/v1/host_reset_password
 * 
 * @param data - Reset password request data including email, otp, new_password, and confirm_password
 * @returns Promise with reset password response
 * @throws AxiosError if request fails
 */
export const resetPassword = async (data: ResetPasswordRequest): Promise<ResetPasswordResponse> => {
  // Make POST request to reset password endpoint
  const response = await makeRequest<ResetPasswordResponse>(
    "/host_reset_password",
    "POST",
    data
  );
  // Return response data
  return response.data;
};

/**
 * Switch profile mode (e.g., switch to user mode)
 * API Endpoint: POST /api/v1/switch_profile
 * 
 * @param data - Switch profile request data including mode (e.g., "user")
 * @returns Promise with switch profile response containing new token and user info
 * @throws AxiosError if request fails
 */
export const switchProfile = async (data: SwitchProfileRequest): Promise<SwitchProfileResponse> => {
  // Make POST request to switch profile endpoint
  const response = await makeRequest<SwitchProfileResponse>(
    "/switch_profile",
    "POST",
    data
  );
  // Return response data
  return response.data;
};

