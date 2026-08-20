// Import useQuery for data fetching with caching.
import { useQuery } from "@tanstack/react-query";
// Import typed ApiError for consistent error contracts.
import { ApiError } from "../errors";
// Import auth storage helper to gate requests without token.
import { authStorage } from "../storage";
// Import service function plus response type definition.
import {
  getGlobalPlatformFee,
  type GlobalPlatformFeeResponse,
} from "../services/platformFeeService";

/**
 * React Query hook to fetch the global platform fee configuration.
 * Retrieves the default platform fee that applies to all hosts unless overridden.
 * 
 * @returns React Query result object with data, loading, error states.
 */
export const useGlobalPlatformFee = () => {
  // Look up the stored token so we only run when authenticated.
  const token = authStorage.getToken();
  
  // Configure the query instance.
  return useQuery<GlobalPlatformFeeResponse, ApiError>({
    // Cache key for the global platform fee query.
    queryKey: ["globalPlatformFee"],
    // Call the API service to fetch global platform fee.
    queryFn: () => getGlobalPlatformFee(),
    // Disable the query when token is missing to prevent 401s.
    enabled: Boolean(token),
    // Cache data for 5 minutes to minimize repeated calls.
    staleTime: 5 * 60 * 1000,
    // Prevent refetch on window focus to avoid unnecessary requests.
    refetchOnWindowFocus: false,
  });
};

