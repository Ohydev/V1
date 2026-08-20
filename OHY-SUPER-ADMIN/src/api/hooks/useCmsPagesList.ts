// Import useQuery to enable cached data fetching.
import { useQuery } from "@tanstack/react-query";
// Import ApiError type to keep error typing consistent.
import { ApiError } from "../errors";
// Import authStorage to ensure calls only run when authenticated.
import { authStorage } from "../storage";
// Import service plus param type to reuse within the hook.
import {
  getCmsPagesList,
  type GetCmsPagesListParams,
} from "../services/cmsService";
// Import response type so consumers receive strongly typed data.
import type { CmsPagesListResponse } from "../services/cmsService";

// React Query hook that fetches CMS pages list with pagination, search, and sort support.
export const useCmsPagesList = (params?: GetCmsPagesListParams) => {
  // Read token to gate the query when user is not authenticated.
  const token = authStorage.getToken();
  // Normalize the page parameter to default to page 1.
  const page = params?.page ?? 1;
  // Normalize the per_page parameter to default to 30.
  const perPage = params?.per_page ?? 30;
  // Normalize the search term to empty string when not provided.
  const search = params?.search ?? "";
  // Normalize the sort_by parameter to default to "title".
  const sortBy = params?.sort_by ?? "title";
  // Normalize the sort_order parameter to default to "desc".
  const sortOrder = params?.sort_order ?? "desc";
  // Configure the React Query instance.
  return useQuery<CmsPagesListResponse, ApiError>({
    // Include all query parameters in the cache key for scoping.
    queryKey: ["cmsPagesList", page, perPage, search, sortBy, sortOrder],
    // Execute the fetcher with the provided params.
    queryFn: () =>
      getCmsPagesList({
        page,
        per_page: perPage,
        search: search || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      }),
    // Disable automatic execution when no token exists.
    enabled: Boolean(token),
    // Keep previous data while fetching to smooth pagination UX.
    keepPreviousData: true,
    // Cache data briefly to avoid duplicate calls when revisiting.
    staleTime: 30 * 1000,
  });
};

