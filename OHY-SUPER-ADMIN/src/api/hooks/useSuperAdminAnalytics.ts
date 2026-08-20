// Import useQuery to fetch analytics data with caching support.
import { useQuery } from "@tanstack/react-query";
// Import ApiError class to keep error handling strongly typed.
import { ApiError } from "../errors";
// Import auth storage helper to determine if a token is available.
import { authStorage } from "../storage";
// Import service helper and response type definitions for the analytics endpoint.
import {
  getSuperAdminAnalytics,
  type SuperAdminAnalyticsResponse,
  type GetSuperAdminAnalyticsParams,
} from "../services/dashboardService";

// Custom hook that retrieves the super admin analytics data.
export const useSuperAdminAnalytics = (params?: GetSuperAdminAnalyticsParams) => {
  // Read the stored token to avoid running the query before authentication.
  const token = authStorage.getToken();
  // Extract year from params or default to 2026.
  const year = params?.year ?? 2026;
  // Return the useQuery instance configured for analytics data retrieval.
  return useQuery<SuperAdminAnalyticsResponse, ApiError>({
    // Provide a stable cache key including year so React Query can cache responses per year.
    queryKey: ["superAdminAnalytics", year],
    // Define the query function that calls the API service with params.
    queryFn: () => getSuperAdminAnalytics(params),
    // Only enable the query when a token exists to prevent unauthorized calls.
    enabled: Boolean(token),
    // Keep the cached data fresh for a minute to limit refetching.
    staleTime: 60 * 1000,
  });
};

