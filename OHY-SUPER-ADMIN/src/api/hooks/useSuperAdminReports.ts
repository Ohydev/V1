// Import useQuery for data fetching with caching.
import { useQuery } from "@tanstack/react-query";
// Import typed ApiError for consistent error contracts.
import { ApiError } from "../errors";
// Import auth storage helper to gate requests without token.
import { authStorage } from "../storage";
// Import service function, params type, and response type.
import {
  getSuperAdminReportsList,
  type GetSuperAdminReportsListParams,
  type SuperAdminReportsListResponse,
} from "../services/reportsService";

/**
 * React Query hook to fetch the paginated super admin user reports list.
 * @param page - Current pagination page requested by the UI.
 * @param per_page - Optional number of records per page.
 * @param filters - Optional filters: priority, status, type (sent as query params).
 */
export const useSuperAdminReportsList = (
  page: number,
  per_page?: number,
  filters?: Pick<
    GetSuperAdminReportsListParams,
    "priority" | "status" | "type"
  >
) => {
  // Look up the stored token so we only run when authenticated.
  const token = authStorage.getToken();
  // Build params for the API call (page, per_page, and any filters).
  const listParams: GetSuperAdminReportsListParams = {
    page,
    per_page,
    ...(filters?.priority && { priority: filters.priority }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.type && { type: filters.type }),
  };
  // Configure the query instance specific to page, per_page, and filters.
  return useQuery<SuperAdminReportsListResponse, ApiError>({
    // Include page, per_page, and filter primitives in the cache key for stability.
    queryKey: [
      "superAdminReportsList",
      page,
      per_page,
      filters?.priority ?? null,
      filters?.status ?? null,
      filters?.type ?? null,
    ],
    // Call the API service with the built params.
    queryFn: () => getSuperAdminReportsList(listParams),
    // Disable the query when token is missing to prevent 401s.
    enabled: Boolean(token),
    // Keep previous page data while fetching the next to avoid flicker.
    keepPreviousData: true,
    // Cache data briefly to minimize repeated calls when navigating pages.
    staleTime: 30 * 1000,
  });
};
