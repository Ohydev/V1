// Import useQuery to handle data fetching with caching and dedupe.
import { useQuery } from "@tanstack/react-query";
// Import ApiError for unified error handling.
import { ApiError } from "../errors";
// Import auth storage helper to ensure token availability before calling API.
import { authStorage } from "../storage";
// Import service plus response types for event details.
import {
  getSuperAdminEventDetails,
  type SuperAdminEventDetailsResponse,
} from "../services/eventsService";

/**
 * React Query hook to fetch detailed event data for the super admin.
 * @param eventId - Numeric event identifier extracted from the route.
 */
export const useSuperAdminEventDetails = (eventId?: number) => {
  // Retrieve the stored Sanctum token so we can gate the query when logged out.
  const token = authStorage.getToken();
  // Configure the query instance referencing the event identifier in the key.
  return useQuery<SuperAdminEventDetailsResponse, ApiError>({
    // Include eventId inside the query key for per-event caching.
    queryKey: ["superAdminEventDetails", eventId],
    // Execute the API call via the service helper.
    queryFn: () => {
      // Guard against undefined eventId even though query is disabled in that case.
      if (!eventId) {
        throw new ApiError("Event identifier is required", "E400");
      }
      return getSuperAdminEventDetails(eventId);
    },
    // Enable the query only when both token and eventId exist to avoid bad requests.
    enabled: Boolean(token && eventId),
    // Provide a modest stale time to reduce repeated fetches when revisiting.
    staleTime: 60 * 1000,
  });
};


