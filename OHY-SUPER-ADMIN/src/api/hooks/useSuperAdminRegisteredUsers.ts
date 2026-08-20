// Import useQuery to enable cached data fetching.
import { keepPreviousData, useQuery } from "@tanstack/react-query";
// Import ApiError type to keep error typing consistent.
import { ApiError } from "../errors";
// Import authStorage to ensure calls only run when authenticated.
import { authStorage } from "../storage";
// Import service plus param type to reuse within the hook.
import {
  getSuperAdminRegisteredUsersList,
  type GetSuperAdminRegisteredUsersParams,
} from "../services/usersService";
// Import response type so consumers receive strongly typed data.
import type { SuperAdminRegisteredUsersResponse } from "../types/users";

// React Query hook that fetches registered users with pagination support.
export const useSuperAdminRegisteredUsers = (
  params?: GetSuperAdminRegisteredUsersParams
) => {
  // Read token to gate the query when user is not authenticated.
  const token = authStorage.getToken();
  // Normalize the page parameter to default to page 1.
  const page = params?.page ?? 1;
  // Normalize the search term to empty string when not provided.
  const search = params?.search ?? "";
  // Normalize the per_page parameter when provided by the caller.
  const perPage = params?.per_page;
  // Normalize optional gender filter when provided by the caller.
  const gender = params?.gender;
  // Normalize optional age range filter when provided by the caller.
  const ageRange = params?.age_range;
  // Normalize optional state filter when provided by the caller.
  const stateId = params?.state_id;
  // Normalize optional zipcode filter when provided by the caller.
  const zipcode = params?.zipcode;
  // Configure the React Query instance.
  return useQuery<SuperAdminRegisteredUsersResponse, ApiError>({
    // Include page, search, per_page, gender, age_range, state_id, and zipcode in the cache key for scoping.
    queryKey: ["superAdminRegisteredUsers", page, search, perPage, gender, ageRange, stateId, zipcode],
    // Execute the fetcher with the provided params (body for POST).
    queryFn: () =>
      getSuperAdminRegisteredUsersList({
        page,
        search,
        per_page: perPage,
        gender,
        age_range: ageRange,
        state_id: stateId,
        zipcode,
      }),
    // Disable automatic execution when no token exists.
    enabled: Boolean(token),
    // Keep previous data while fetching to smooth pagination UX.
    placeholderData: keepPreviousData,
    // Cache data briefly to avoid duplicate calls when revisiting.
    staleTime: 30 * 1000,
  });
};


