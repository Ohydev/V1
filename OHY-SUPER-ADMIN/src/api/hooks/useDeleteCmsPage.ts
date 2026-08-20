// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import service function and response typing.
import {
  deleteCmsPage,
  type DeleteCmsPageResponse,
} from "../services/cmsService";

/**
 * Custom hook that handles CMS page deletion workflow.
 * Invalidates the CMS pages list queries to refresh the UI after successful mutation.
 */
export const useDeleteCmsPage = () => {
  // Initialize the query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the delete CMS page endpoint.
  return useMutation<DeleteCmsPageResponse, ApiError, number>({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["deleteCmsPage"],
    // Define the function that executes the API request with the CMS page ID.
    mutationFn: (cmsPageId) => deleteCmsPage(cmsPageId),
    // Handle successful responses by invalidating cached queries.
    onSuccess: () => {
      // Invalidate all CMS pages list queries to trigger refetch.
      // This ensures the UI reflects the deleted CMS page immediately.
      queryClient.invalidateQueries({ queryKey: ["cmsPagesList"] });
    },
  });
};

