// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import service along with request and response typings.
import {
  settleEventPayout,
  type SettleEventPayoutRequest,
  type SettleEventPayoutResponse,
} from "../services/settlementService";

/**
 * Custom hook that handles event payout settlement workflow.
 * Invalidates the event settlement summary queries to refresh the UI after successful mutation.
 */
export const useSettleEventPayout = () => {
  // Initialize the query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the settle event payout endpoint.
  return useMutation<
    SettleEventPayoutResponse,
    ApiError,
    SettleEventPayoutRequest
  >({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["settleEventPayout"],
    // Define the function that executes the API request.
    mutationFn: (payload) => settleEventPayout(payload),
    // Handle successful responses by invalidating cached queries.
    onSuccess: () => {
      // Invalidate all event settlement summary queries to trigger refetch.
      // This ensures the UI reflects the updated settlement status immediately.
      queryClient.invalidateQueries({ queryKey: ["eventSettlementSummary"] });
    },
  });
};

