// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import service along with request and response typings.
import {
  updateGlobalPlatformFee,
  type UpdateGlobalPlatformFeeRequest,
  type UpdateGlobalPlatformFeeResponse,
} from "../services/platformFeeService";

/**
 * Custom hook that handles global platform fee update workflow.
 * Invalidates the global platform fee query to refresh the UI after successful mutation.
 */
export const useUpdateGlobalPlatformFee = () => {
  // Initialize the query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the update global platform fee endpoint.
  return useMutation<
    UpdateGlobalPlatformFeeResponse,
    ApiError,
    UpdateGlobalPlatformFeeRequest
  >({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["updateGlobalPlatformFee"],
    // Define the function that executes the API request.
    mutationFn: (payload) => updateGlobalPlatformFee(payload),
    // Handle successful responses by invalidating cached queries.
    onSuccess: () => {
      // Invalidate the global platform fee query to trigger refetch.
      // This ensures the UI reflects the updated fee immediately.
      queryClient.invalidateQueries({ queryKey: ["globalPlatformFee"] });
    },
  });
};

