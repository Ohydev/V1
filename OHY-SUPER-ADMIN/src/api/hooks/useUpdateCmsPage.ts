// Import useMutation and query client helpers for React Query integration.
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Import ApiError type to surface normalized backend errors.
import { ApiError } from "../errors";
// Import service along with request and response typings.
import {
  updateCmsPage,
  type UpdateCmsPageRequest,
  type UpdateCmsPageResponse,
} from "../services/cmsService";

/**
 * Custom hook that handles CMS page update workflow.
 * Invalidates both the CMS pages list and details queries to refresh the UI after successful mutation.
 */
export const useUpdateCmsPage = () => {
  // Initialize the query client for cache invalidation after mutation success.
  const queryClient = useQueryClient();
  // Return a React Query mutation configured for the update CMS page endpoint.
  return useMutation<
    UpdateCmsPageResponse,
    ApiError,
    UpdateCmsPageRequest
  >({
    // Provide a stable mutation key for devtools tracking.
    mutationKey: ["updateCmsPage"],
    // Define the function that executes the API request.
    mutationFn: (payload) => updateCmsPage(payload),
    // Handle successful responses by invalidating cached queries.
    onSuccess: (data) => {
      // Invalidate all CMS pages list queries to trigger refetch.
      // This ensures the listing page reflects the updated CMS page immediately.
      queryClient.invalidateQueries({ queryKey: ["cmsPagesList"] });
      // Invalidate the specific CMS page details query to refresh the edit form.
      queryClient.invalidateQueries({
        queryKey: ["cmsPageDetails", data.cms_page.cms_page_id],
      });
    },
  });
};

