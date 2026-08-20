// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import service along with request and response typings.
import {
  toggleEventHideStatus,
  type ToggleEventHideStatusRequest,
  type ToggleEventHideStatusResponse,
} from "../services/eventsService";

/**
 * Custom hook that handles event hide/unhide status toggle workflow.
 * Invalidates the events list queries to refresh the UI after successful mutation.
 */
export const useToggleEventHideStatus = () => {
  // Initialize the query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the toggle hide status endpoint.
  return useMutation<
    ToggleEventHideStatusResponse,
    ApiError,
    ToggleEventHideStatusRequest
  >({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["toggleEventHideStatus"],
    // Define the function that executes the API request.
    mutationFn: (payload) => toggleEventHideStatus(payload),
    // Handle successful responses by invalidating cached queries.
    onSuccess: () => {
      // Invalidate all events list queries to trigger refetch.
      // This ensures the UI reflects the updated hide status immediately.
      queryClient.invalidateQueries({ queryKey: ["superAdminEvents"] });
    },
  });
};

