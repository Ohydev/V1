// Import useQuery for data fetching with caching.
import { keepPreviousData, useQuery } from "@tanstack/react-query";
// Import typed ApiError for consistent error contracts.
import { ApiError } from "../errors";
// Import auth storage helper to gate requests without token.
import { authStorage } from "../storage";
// Import service function, params type, and response type definition.
import {
  getSuperAdminEventsList,
  type GetSuperAdminEventsParams,
  type SuperAdminEventsResponse,
} from "../services/eventsService";

/**
 * React Query hook to fetch the paginated super admin events list.
 * @param params - Optional pagination and filter parameters (sent in POST body).
 */
export const useSuperAdminEvents = (params?: GetSuperAdminEventsParams) => {
  // Look up the stored token so we only run when authenticated.
  const token = authStorage.getToken();
  // Normalize params for cache key and request (page, per_page, status, filters).
  const page = params?.page ?? 1;
  const perPage = params?.per_page;
  const status = params?.status;
  const search = params?.search;
  const reportedEvents = params?.reported_events;
  const businessIntersectionId = params?.business_intersection_id;
  const dateFrom = params?.date_from;
  const dateTo = params?.date_to;
  const eventCategoryId = params?.event_category_id;
  const city = params?.city;
  const state = params?.state;
  const postalCode = params?.postal_code;
  // Configure the query instance specific to the provided params.
  return useQuery<SuperAdminEventsResponse, ApiError>({
    // Include all params that affect the result in the cache key.
    queryKey: [
      "superAdminEvents",
      page,
      perPage,
      status,
      search,
      reportedEvents,
      businessIntersectionId,
      dateFrom,
      dateTo,
      eventCategoryId,
      city,
      state,
      postalCode,
    ],
    // Call the API service with the full params object (sent as POST body).
    queryFn: () => getSuperAdminEventsList(params),
    // Disable the query when token is missing to prevent 401s.
    enabled: Boolean(token),
    // Keep previous page data while fetching the next to avoid flicker.
    placeholderData: keepPreviousData,
    // Cache data briefly to minimize repeated calls when navigating pages.
    staleTime: 30 * 1000,
  });
};


