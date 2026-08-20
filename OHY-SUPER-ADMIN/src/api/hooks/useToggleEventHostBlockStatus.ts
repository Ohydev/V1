// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import service along with request and response typings.
import {
  toggleEventHostBlockStatus,
  type ToggleEventHostBlockStatusRequest,
  type ToggleEventHostBlockStatusResponse,
} from "../services/eventsService";

/**
 * Custom hook that handles event host block/unblock status toggle workflow.
 * Invalidates the event hosts list queries to refresh the UI after successful mutation.
 */
export const useToggleEventHostBlockStatus = () => {
  // Initialize the query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the toggle block status endpoint.
  return useMutation<
    ToggleEventHostBlockStatusResponse,
    ApiError,
    ToggleEventHostBlockStatusRequest
  >({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["toggleEventHostBlockStatus"],
    // Define the function that executes the API request.
    mutationFn: (payload) => toggleEventHostBlockStatus(payload),
    // Handle successful responses by invalidating cached queries.
    onSuccess: () => {
      // Invalidate all event hosts list queries to trigger refetch.
      // This ensures the UI reflects the updated block status immediately.
      queryClient.invalidateQueries({ queryKey: ["superAdminEventHosts"] });
    },
  });
};

