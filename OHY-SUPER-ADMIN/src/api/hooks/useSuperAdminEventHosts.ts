// Import useQuery to handle cached API calls.
import { keepPreviousData, useQuery } from "@tanstack/react-query";
// Import ApiError for consistent error typing.
import { ApiError } from "../errors";
// Import auth storage to gate queries when token missing.
import { authStorage } from "../storage";
// Import service helpers and param type for event hosts.
import {
  getSuperAdminEventHostsList,
  type GetSuperAdminEventHostsParams,
  type SuperAdminEventHostsResponse,
} from "../services/eventsService";

/**
 * React Query hook to fetch paginated event hosts for the super admin.
 * @param params - Optional pagination and filter parameters (sent in POST body).
 */
export const useSuperAdminEventHosts = (
  params?: GetSuperAdminEventHostsParams
) => {
  // Retrieve stored token to prevent unauthorized calls.
  const token = authStorage.getToken();
  // Normalize the requested page (defaults to 1).
  const page = params?.page ?? 1;
  // Normalize the per_page parameter when provided by the caller.
  const perPage = params?.per_page;
  // Normalize filter params for cache key and request.
  const businessIntersectionId = params?.business_intersection_id;
  const hasReports = params?.has_reports;
  const accountType = params?.account_type;
  const stateId = params?.state_id;
  const zipcode = params?.zipcode;
  // Configure React Query consumer.
  return useQuery<SuperAdminEventHostsResponse, ApiError>({
    // Include page, per_page and filters in cache key for scoped caching.
    queryKey: [
      "superAdminEventHosts",
      page,
      perPage,
      businessIntersectionId,
      hasReports,
      accountType,
      stateId,
      zipcode,
    ],
    // Execute the service function with full params (sent as POST body).
    queryFn: () => getSuperAdminEventHostsList(params),
    // Disable query execution when token is absent.
    enabled: Boolean(token),
    // Preserve previous data while fetching the next page.
    placeholderData: keepPreviousData,
    // Cache entries briefly to avoid duplicate requests.
    staleTime: 30 * 1000,
  });
};


