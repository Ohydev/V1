// Import useQuery for data fetching with caching.
import { useQuery } from "@tanstack/react-query";
// Import typed ApiError for consistent error contracts.
import { ApiError } from "../errors";
// Import auth storage helper to gate requests without token.
import { authStorage } from "../storage";
// Import service function, params type, and response type.
import {
  getSuperAdminSupportRequestsList,
  type GetSuperAdminSupportRequestsListParams,
  type SuperAdminSupportRequestsListResponse,
} from "../services/supportRequestsService";

/**
 * React Query hook to fetch the paginated super admin support requests list.
 * @param page - Current pagination page requested by the UI.
 * @param per_page - Optional number of records per page.
 */
export const useSuperAdminSupportRequestsList = (
  page: number,
  per_page?: number
) => {
  // Look up the stored token so we only run when authenticated.
  const token = authStorage.getToken();
  // Build params for the API call (page and per_page).
  const listParams: GetSuperAdminSupportRequestsListParams = {
    page,
    per_page,
  };
  // Configure the query instance specific to page and per_page.
  return useQuery<SuperAdminSupportRequestsListResponse, ApiError>({
    // Include page and per_page in the cache key for stability.
    queryKey: ["superAdminSupportRequestsList", page, per_page ?? null],
    // Call the API service with the built params.
    queryFn: () => getSuperAdminSupportRequestsList(listParams),
    // Disable the query when token is missing to prevent 401s.
    enabled: Boolean(token),
    // Keep previous page data while fetching the next to avoid flicker.
    keepPreviousData: true,
    // Cache data briefly to minimize repeated calls when navigating pages.
    staleTime: 30 * 1000,
  });
};
