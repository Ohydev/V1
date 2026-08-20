// Import React Query helper for data fetching with caching.
import { useQuery } from "@tanstack/react-query";
// Import ApiError for consistent error handling.
import { ApiError } from "../errors";
// Import auth storage to gate the query when unauthenticated.
import { authStorage } from "../storage";
// Import service helper and param types.
import {
  getSuperAdminAttendeesList,
  type GetSuperAdminAttendeesParams,
} from "../services/usersService";
// Import response type for consumer typing.
import type { SuperAdminAttendeesResponse } from "../types/users";

/**
 * React Query hook to fetch paginated attendees list for super admin.
 * @param params - Optional pagination parameters.
 */
export const useSuperAdminAttendees = (
  params?: GetSuperAdminAttendeesParams
) => {
  // Retrieve stored token to disable query when logged out.
  const token = authStorage.getToken();
  // Normalize page parameter with default value.
  const page = params?.page ?? 1;
  // Normalize the per_page parameter when provided by the caller.
  const perPage = params?.per_page;
  // Configure React Query instance.
  return useQuery<SuperAdminAttendeesResponse, ApiError>({
    // Cache key includes page and per_page for scoped caching.
    queryKey: ["superAdminAttendees", page, perPage],
    // Invoke service call with normalized params.
    queryFn: () => getSuperAdminAttendeesList({ page, per_page: perPage }),
    // Disable when token missing to avoid unauthorized errors.
    enabled: Boolean(token),
    // Keep previous data for smoother pagination transitions.
    keepPreviousData: true,
    // Cache entries briefly to reduce duplicate calls.
    staleTime: 30 * 1000,
  });
};


