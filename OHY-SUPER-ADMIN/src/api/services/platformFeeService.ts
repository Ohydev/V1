// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import centralized endpoint map to avoid scattering literal strings.
import { endpoints } from "../endpoints";

/**
 * Type definition for global platform fee response data.
 * Represents the default platform fee configuration.
 */
export type GlobalPlatformFeeData = {
  // Fee type can be either flat_rate or percentage.
  fee_type: "flat_rate" | "percentage";
  // Fee value as string (e.g., "5.00" for $5.00 or "10.00" for 10%).
  fee_value: string;
};

/**
 * Type definition for global platform fee API response.
 * Wraps the fee data in the standard API response structure.
 */
export type GlobalPlatformFeeResponse = GlobalPlatformFeeData;

/**
 * Type definition for individual host platform fee record.
 * Represents a host user who has a custom platform fee set.
 */
export type HostPlatformFee = {
  // Unique identifier of the host user.
  host_user_id: number;
  // Full name of the host user.
  host_name: string;
  // Email address of the host user.
  host_email: string;
  // Fee type can be either flat_rate or percentage.
  fee_type: "flat_rate" | "percentage";
  // Fee value as string (e.g., "15.00" for $15.00 or "10.00" for 10%).
  fee_value: string;
  // Timestamp when the fee was last updated (format: "2025-12-31 06:59:21").
  updated_at: string;
};

/**
 * Type definition for pagination metadata in host platform fees response.
 * Provides information about the paginated results.
 */
export type HostPlatformFeesPagination = {
  // Total number of records across all pages.
  total_records: number;
  // Current page number (1-indexed).
  current_page: number;
  // Number of records per page.
  per_page: number;
  // Total number of pages available.
  total_pages: number;
  // Boolean indicating if there is a next page.
  has_next_page: boolean;
  // Boolean indicating if there is a previous page.
  has_previous_page: boolean;
};

/**
 * Type definition for host platform fees API response.
 * Contains the list of hosts with custom fees and pagination metadata.
 */
export type HostPlatformFeesResponse = {
  // Array of host platform fee records.
  hosts: HostPlatformFee[];
  // Pagination metadata for the results.
  pagination: HostPlatformFeesPagination;
};

/**
 * Type definition for query parameters when fetching host platform fees.
 * Allows filtering and pagination of the results.
 */
export type GetAllHostPlatformFeesParams = {
  // Optional page number for pagination (defaults to 1).
  page?: number;
  // Optional number of records per page (defaults to backend default).
  per_page?: number;
};

/**
 * Type definition for update global platform fee request.
 * Contains the fee type and value to update.
 */
export type UpdateGlobalPlatformFeeRequest = {
  // Fee type can be either flat_rate or percentage.
  fee_type: "flat_rate" | "percentage";
  // Fee value as number (e.g., 5 for $5.00 or 10 for 10%).
  fee_value: number;
};

/**
 * Type definition for update global platform fee response data.
 * Contains success message and updated fee details.
 */
export type UpdateGlobalPlatformFeeResponseData = {
  // Success message from backend.
  message: string;
  // Updated fee type.
  fee_type: "flat_rate" | "percentage";
  // Updated fee value as string (e.g., "5.00").
  fee_value: string;
};

/**
 * Type definition for update global platform fee API response.
 * Wraps the response data in the standard API response structure.
 */
export type UpdateGlobalPlatformFeeResponse = UpdateGlobalPlatformFeeResponseData;

/**
 * Fetch global platform fee configuration from the backend API.
 * Retrieves the default platform fee that applies to all hosts unless overridden.
 * 
 * @returns Promise resolving to the global platform fee response with fee_type and fee_value.
 */
export const getGlobalPlatformFee = async (): Promise<GlobalPlatformFeeResponse> => {
  // Execute GET request through makeRequest helper.
  return makeRequest<GlobalPlatformFeeResponse>(endpoints.getGlobalPlatformFee, "GET");
};

/**
 * Fetch paginated list of hosts with custom platform fees from the backend API.
 * Retrieves hosts who have been assigned custom platform fees that differ from the global default.
 * 
 * @param params - Optional query parameters for pagination.
 * @param params.page - Optional page number for pagination (defaults to 1).
 * @param params.per_page - Optional number of records per page (defaults to backend default).
 * @returns Promise resolving to the host platform fees response with hosts array and pagination.
 */
export const getAllHostPlatformFees = async (
  params?: GetAllHostPlatformFeesParams
): Promise<HostPlatformFeesResponse> => {
  // Build query parameters object from provided params.
  const queryParams: Record<string, string> = {};
  
  // Add page parameter when provided (defaults to 1 if not specified).
  const page = params?.page ?? 1;
  if (page > 1) {
    queryParams.page = String(page);
  }
  
  // Add per_page parameter when provided.
  if (params?.per_page) {
    queryParams.per_page = String(params.per_page);
  }
  
  // Build query string from params object.
  const queryString = new URLSearchParams(queryParams).toString();
  // Append query string to endpoint when params exist.
  const endpoint = queryString
    ? `${endpoints.getAllHostPlatformFees}?${queryString}`
    : endpoints.getAllHostPlatformFees;
  
  // Execute GET request through makeRequest helper.
  return makeRequest<HostPlatformFeesResponse>(endpoint, "GET");
};

/**
 * Update global platform fee configuration in the backend API.
 * Modifies the default platform fee that applies to all hosts unless overridden.
 * 
 * @param request - Request payload containing fee_type and fee_value to update.
 * @param request.fee_type - Fee type (flat_rate or percentage).
 * @param request.fee_value - Fee value as number (e.g., 5 for $5.00 or 10 for 10%).
 * @returns Promise resolving to the update response with success message and updated fee details.
 */
export const updateGlobalPlatformFee = async (
  request: UpdateGlobalPlatformFeeRequest
): Promise<UpdateGlobalPlatformFeeResponse> => {
  // Execute POST request through makeRequest helper with fee data in request body.
  return makeRequest<UpdateGlobalPlatformFeeResponse>(
    endpoints.updateGlobalPlatformFee,
    "POST",
    request
  );
};

/**
 * Type definition for update host platform fee request.
 * Contains the host identifier, fee type, and value to update.
 */
export type UpdateHostPlatformFeeRequest = {
  // Unique identifier of the host user.
  host_user_id: number;
  // Fee type can be either flat_rate or percentage.
  fee_type: "flat_rate" | "percentage";
  // Fee value as number (e.g., 10 for $10.00 or 10 for 10%).
  fee_value: number;
};

/**
 * Type definition for update host platform fee response data.
 * Contains success message and updated fee details.
 */
export type UpdateHostPlatformFeeResponseData = {
  // Success message from backend.
  message: string;
  // Updated fee type.
  fee_type: "flat_rate" | "percentage";
  // Updated fee value as string (e.g., "10.00").
  fee_value: string;
};

/**
 * Type definition for update host platform fee API response.
 * Wraps the response data in the standard API response structure.
 */
export type UpdateHostPlatformFeeResponse = UpdateHostPlatformFeeResponseData;

/**
 * Type definition for remove host platform fee request.
 * Contains the host identifier to reset custom fee.
 */
export type RemoveHostPlatformFeeRequest = {
  // Unique identifier of the host user.
  host_user_id: number;
};

/**
 * Type definition for remove host platform fee response data.
 * Contains success message.
 */
export type RemoveHostPlatformFeeResponseData = {
  // Success message from backend.
  message: string;
};

/**
 * Type definition for remove host platform fee API response.
 * Wraps the response data in the standard API response structure.
 */
export type RemoveHostPlatformFeeResponse = RemoveHostPlatformFeeResponseData;

/**
 * Update host custom platform fee in the backend API.
 * Modifies the custom platform fee for a specific host user.
 * 
 * @param request - Request payload containing host_user_id, fee_type, and fee_value to update.
 * @param request.host_user_id - Unique identifier of the host user.
 * @param request.fee_type - Fee type (flat_rate or percentage).
 * @param request.fee_value - Fee value as number (e.g., 10 for $10.00 or 10 for 10%).
 * @returns Promise resolving to the update response with success message and updated fee details.
 */
export const updateHostPlatformFee = async (
  request: UpdateHostPlatformFeeRequest
): Promise<UpdateHostPlatformFeeResponse> => {
  // Execute POST request through makeRequest helper with fee data in request body.
  return makeRequest<UpdateHostPlatformFeeResponse>(
    endpoints.updateHostPlatformFee,
    "POST",
    request
  );
};

/**
 * Remove host custom platform fee in the backend API.
 * Resets the host's custom fee to use the global platform fee instead.
 * 
 * @param request - Request payload containing host_user_id to reset.
 * @param request.host_user_id - Unique identifier of the host user.
 * @returns Promise resolving to the remove response with success message.
 */
export const removeHostPlatformFee = async (
  request: RemoveHostPlatformFeeRequest
): Promise<RemoveHostPlatformFeeResponse> => {
  // Execute POST request through makeRequest helper with host_user_id in request body.
  return makeRequest<RemoveHostPlatformFeeResponse>(
    endpoints.removeHostPlatformFee,
    "DELETE",
    request
  );
};

/**
 * Type definition for get host platform fee request.
 * Contains the host identifier to fetch fee information.
 */
export type GetHostPlatformFeeRequest = {
  // Unique identifier of the host user.
  host_user_id: number;
};

/**
 * Type definition for host platform fee response data.
 * Contains information about whether the host has a custom fee and the fee details.
 */
export type HostPlatformFeeData = {
  // Boolean indicating if host has a custom platform fee (false means using global fee).
  is_custom: boolean;
  // Fee type can be either flat_rate or percentage.
  fee_type: "flat_rate" | "percentage";
  // Fee value as string (e.g., "5.00" for $5.00 or "10.00" for 10%).
  fee_value: string;
};

/**
 * Type definition for get host platform fee API response.
 * Wraps the fee data in the standard API response structure.
 */
export type GetHostPlatformFeeResponse = HostPlatformFeeData;

/**
 * Fetch platform fee for a specific host from the backend API.
 * Retrieves the platform fee configuration for a host (custom or global).
 * 
 * @param request - Request payload containing host_user_id to fetch fee for.
 * @param request.host_user_id - Unique identifier of the host user.
 * @returns Promise resolving to the host platform fee response with is_custom, fee_type, and fee_value.
 */
export const getHostPlatformFee = async (
  request: GetHostPlatformFeeRequest
): Promise<GetHostPlatformFeeResponse> => {
  // Build query parameters object with host_user_id.
  const queryParams: Record<string, string> = {
    host_user_id: String(request.host_user_id),
  };
  
  // Build query string from params object.
  const queryString = new URLSearchParams(queryParams).toString();
  // Append query string to endpoint.
  const endpoint = `${endpoints.getHostPlatformFee}?${queryString}`;
  
  // Execute GET request through makeRequest helper with host_user_id as query parameter.
  return makeRequest<GetHostPlatformFeeResponse>(endpoint, "GET");
};

