// Import useQuery to fetch dashboard data with caching support.
import { useQuery } from "@tanstack/react-query";
// Import ApiError class to keep error handling strongly typed.
import { ApiError } from "../errors";
// Import auth storage helper to determine if a token is available.
import { authStorage } from "../storage";
// Import service helper and response type definitions for the dashboard endpoint.
import {
  getSuperAdminDashboard,
  type SuperAdminDashboardResponse,
} from "../services/dashboardService";

// Custom hook that retrieves the super admin dashboard data.
export const useSuperAdminDashboard = () => {
  // Read the stored token to avoid running the query before authentication.
  const token = authStorage.getToken();
  // Return the useQuery instance configured for dashboard data retrieval.
  return useQuery<SuperAdminDashboardResponse, ApiError>({
    // Provide a stable cache key so React Query can cache the response.
    queryKey: ["superAdminDashboard"],
    // Define the query function that calls the API service.
    queryFn: () => getSuperAdminDashboard(),
    // Only enable the query when a token exists to prevent unauthorized calls.
    enabled: Boolean(token),
    // Keep the cached data fresh for a minute to limit refetching.
    staleTime: 60 * 1000,
  });
};


