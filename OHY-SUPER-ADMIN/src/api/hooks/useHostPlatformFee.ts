// Import useQuery to handle cached API calls.
import { useQuery } from "@tanstack/react-query";
// Import ApiError for consistent error typing.
import { ApiError } from "../errors";
// Import auth storage to gate queries when token missing.
import { authStorage } from "../storage";
// Import service function and types for host platform fee.
import {
  getHostPlatformFee,
  type GetHostPlatformFeeRequest,
  type GetHostPlatformFeeResponse,
} from "../services/platformFeeService";

/**
 * React Query hook to fetch platform fee for a specific host.
 * @param request - Request parameters containing host_user_id.
 * @param enabled - Optional flag to enable/disable the query (defaults to true).
 */
export const useHostPlatformFee = (
  request: GetHostPlatformFeeRequest | null,
  enabled: boolean = true
) => {
  // Retrieve stored token to prevent unauthorized calls.
  const token = authStorage.getToken();
  // Configure React Query consumer.
  return useQuery<GetHostPlatformFeeResponse, ApiError>({
    // Include host_user_id in cache key for scoped caching.
    queryKey: ["hostPlatformFee", request?.host_user_id],
    // Execute the service function when request is available.
    queryFn: () => {
      // Throw error if request is null.
      if (!request) {
        throw new Error("Host user ID is required");
      }
      // Call service function with request data.
      return getHostPlatformFee(request);
    },
    // Disable query execution when token is absent, request is null, or explicitly disabled.
    enabled: Boolean(token) && Boolean(request) && enabled,
    // Cache entries briefly to avoid duplicate requests.
    staleTime: 30 * 1000,
  });
};


