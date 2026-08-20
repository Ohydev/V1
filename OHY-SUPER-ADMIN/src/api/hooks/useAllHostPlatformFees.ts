// Import useQuery for data fetching with caching.
import { useQuery } from "@tanstack/react-query";
// Import typed ApiError for consistent error contracts.
import { ApiError } from "../errors";
// Import auth storage helper to gate requests without token.
import { authStorage } from "../storage";
// Import service function plus response type definition.
import {
  getAllHostPlatformFees,
  type HostPlatformFeesResponse,
} from "../services/platformFeeService";
// Import type for query parameters.
import type { GetAllHostPlatformFeesParams } from "../services/platformFeeService";

/**
 * React Query hook to fetch the paginated list of hosts with custom platform fees.
 * Retrieves hosts who have been assigned custom platform fees that differ from the global default.
 * 
 * @param params - Optional query parameters for pagination.
 * @param params.page - Optional page number for pagination (defaults to 1).
 * @param params.per_page - Optional number of records per page (defaults to backend default).
 * @returns React Query result object with data, loading, error states.
 */
export const useAllHostPlatformFees = (
  params?: GetAllHostPlatformFeesParams
) => {
  // Look up the stored token so we only run when authenticated.
  const token = authStorage.getToken();
  
  // Configure the query instance specific to the provided params.
  return useQuery<HostPlatformFeesResponse, ApiError>({
    // Include all params in the cache key to maintain separate caches.
    queryKey: ["allHostPlatformFees", params?.page, params?.per_page],
    // Call the API service with the provided params.
    queryFn: () => getAllHostPlatformFees(params),
    // Disable the query when token is missing to prevent 401s.
    enabled: Boolean(token),
    // Keep previous page data while fetching the next to avoid flicker.
    keepPreviousData: true,
    // Cache data briefly to minimize repeated calls when navigating pages.
    staleTime: 30 * 1000,
  });
};

