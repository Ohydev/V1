// Import useQuery for data fetching with caching.
import { useQuery } from "@tanstack/react-query";
// Import typed ApiError for consistent error contracts.
import { ApiError } from "../errors";
// Import auth storage helper to gate requests without token.
import { authStorage } from "../storage";
// Import service function plus response type definition.
import {
  getEventSettlementBreakdown,
  type GetEventSettlementBreakdownResponse,
} from "../services/settlementService";
// Import type for request parameters.
import type { GetEventSettlementBreakdownRequest } from "../types/settlement";

/**
 * React Query hook to fetch the event settlement breakdown.
 * Retrieves detailed financial breakdown for a specific event including fees and payout calculations.
 * 
 * @param eventId - Unique identifier of the event to get breakdown for.
 * @returns React Query result object with data, loading, error states.
 */
export const useEventSettlementBreakdown = (eventId: number | null) => {
  // Look up the stored token so we only run when authenticated.
  const token = authStorage.getToken();
  
  // Configure the query instance specific to the provided eventId.
  return useQuery<GetEventSettlementBreakdownResponse, ApiError>({
    // Include eventId in the cache key to maintain separate caches per event.
    queryKey: ["eventSettlementBreakdown", eventId],
    // Call the API service with the event_id in request body.
    queryFn: () => {
      // Return early if eventId is not provided.
      if (!eventId) {
        throw new Error("Event ID is required");
      }
      // Call the API service with event_id in request body.
      return getEventSettlementBreakdown({ event_id: eventId });
    },
    // Disable the query when token is missing or eventId is null to prevent 401s.
    enabled: Boolean(token && eventId !== null),
    // Cache data briefly to minimize repeated calls when reopening modal.
    staleTime: 30 * 1000,
  });
};

