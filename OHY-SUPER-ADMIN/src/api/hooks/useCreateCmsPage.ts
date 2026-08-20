// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import service along with request and response typings.
import {
  createCmsPage,
  type CreateCmsPageRequest,
  type CreateCmsPageResponse,
} from "../services/cmsService";

/**
 * Custom hook that handles CMS page creation workflow.
 * Invalidates the CMS pages list queries to refresh the UI after successful mutation.
 */
export const useCreateCmsPage = () => {
  // Initialize the query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the create CMS page endpoint.
  return useMutation<
    CreateCmsPageResponse,
    ApiError,
    CreateCmsPageRequest
  >({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["createCmsPage"],
    // Define the function that executes the API request.
    mutationFn: (payload) => createCmsPage(payload),
    // Handle successful responses by invalidating cached queries.
    onSuccess: () => {
      // Invalidate all CMS pages list queries to trigger refetch.
      // This ensures the UI reflects the newly created CMS page immediately.
      queryClient.invalidateQueries({ queryKey: ["cmsPagesList"] });
    },
  });
};

