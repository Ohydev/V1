// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import service along with request and response typings.
import {
  updateHostPlatformFee,
  type UpdateHostPlatformFeeRequest,
  type UpdateHostPlatformFeeResponse,
} from "../services/platformFeeService";

/**
 * Custom hook that handles host platform fee update workflow.
 * Invalidates the host platform fees queries to refresh the UI after successful mutation.
 */
export const useUpdateHostPlatformFee = () => {
  // Initialize the query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the update host platform fee endpoint.
  return useMutation<
    UpdateHostPlatformFeeResponse,
    ApiError,
    UpdateHostPlatformFeeRequest
  >({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["updateHostPlatformFee"],
    // Define the function that executes the API request.
    mutationFn: (payload) => updateHostPlatformFee(payload),
    // Handle successful responses by invalidating cached queries.
    onSuccess: (data, variables) => {
      // Invalidate the host platform fees list queries to trigger refetch.
      // This ensures the UI reflects the updated fee immediately.
      queryClient.invalidateQueries({ queryKey: ["allHostPlatformFees"] });
      // Invalidate the specific host platform fee query to refresh the details modal.
      queryClient.invalidateQueries({ 
        queryKey: ["hostPlatformFee", variables.host_user_id] 
      });
    },
  });
};

