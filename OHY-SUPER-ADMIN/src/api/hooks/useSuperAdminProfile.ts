// Import useQuery for fetching profile data with caching.
import { useQuery } from "@tanstack/react-query";
// Import ApiError for strongly typed error responses.
import { ApiError } from "../errors";
// Import auth storage helper for syncing profile data locally.
import { authStorage } from "../storage";
// Import service helper and response type for profile endpoint.
import {
  getSuperAdminProfile,
  type SuperAdminProfileResponse,
} from "../services/authService";

// Custom hook that retrieves the authenticated super admin profile.
export const useSuperAdminProfile = () => {
  // Determine whether a token exists before attempting to fetch.
  const token = authStorage.getToken();
  // Return a React Query useQuery instance for profile retrieval.
  return useQuery<SuperAdminProfileResponse, ApiError>({
    // Provide a stable cache key for the profile data.
    queryKey: ["superAdminProfile"],
    // Define the query function that invokes the API service.
    queryFn: () => getSuperAdminProfile(),
    // Only run the query when a token exists to avoid unnecessary calls.
    enabled: Boolean(token),
    // Sync the profile to storage whenever a new response arrives.
    onSuccess: (data) => {
      authStorage.setProfile(data.super_admin_info);
    },
    // Keep cached data fresh briefly to avoid flicker when navigating.
    staleTime: 60 * 1000,
  });
};

