// Import useQuery for data fetching with caching.
import { useQuery } from "@tanstack/react-query";
// Import typed ApiError for consistent error contracts.
import { ApiError } from "../errors";
// Import auth storage helper to gate requests without token.
import { authStorage } from "../storage";
// Import service function plus response type definition.
import {
  getEventSettlementSummary,
  type EventSettlementSummaryResponse,
} from "../services/settlementService";
// Import type for query parameters.
import type { GetEventSettlementSummaryParams } from "../types/settlement";

/**
 * React Query hook to fetch the event settlement summary.
 * Retrieves paginated list of events with their settlement information.
 * 
 * @param params - Optional query parameters for filtering and pagination.
 * @param params.event_id - Optional event identifier to filter results to a specific event.
 * @param params.page - Optional page number for pagination (defaults to 1).
 * @param params.per_page - Optional number of records per page (defaults to backend default).
 * @param params.settlement_status - Optional settlement status filter (settled or pending).
 * @returns React Query result object with data, loading, error states.
 */
export const useEventSettlementSummary = (
  params?: GetEventSettlementSummaryParams
) => {
  // Look up the stored token so we only run when authenticated.
  const token = authStorage.getToken();
  
  // Configure the query instance specific to the provided params.
  return useQuery<EventSettlementSummaryResponse, ApiError>({
    // Include all params in the cache key to maintain separate caches for each tab.
    queryKey: ["eventSettlementSummary", params?.event_id, params?.page, params?.per_page, params?.settlement_status],
    // Call the API service with the provided params.
    queryFn: () => getEventSettlementSummary(params),
    // Disable the query when token is missing to prevent 401s.
    enabled: Boolean(token),
    // Keep previous page data while fetching the next to avoid flicker.
    keepPreviousData: true,
    // Cache data briefly to minimize repeated calls when navigating pages.
    staleTime: 30 * 1000,
  });
};


