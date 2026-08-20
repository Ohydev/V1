// Import useQuery for data fetching with caching.
import { useQuery } from "@tanstack/react-query";
// Import typed ApiError for consistent error contracts.
import { ApiError } from "../errors";
// Import auth storage helper to gate requests without token.
import { authStorage } from "../storage";
// Import service function and response type definition.
import {
  getSuperAdminVenueCities,
  type GetSuperAdminVenueCitiesResponse,
} from "../services/venueLocationsService";

/**
 * React Query hook to fetch venue cities and states for super admin events filters.
 */
export const useSuperAdminVenueCities = () => {
  const token = authStorage.getToken();
  return useQuery<GetSuperAdminVenueCitiesResponse, ApiError>({
    queryKey: ["superAdminVenueCities"],
    queryFn: () => getSuperAdminVenueCities(),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
};

