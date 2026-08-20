// Import useQuery to enable cached data fetching.
import { useQuery } from "@tanstack/react-query";
// Import ApiError type to keep error typing consistent.
import { ApiError } from "../errors";
// Import authStorage to ensure calls only run when authenticated.
import { authStorage } from "../storage";
// Import service function to fetch CMS page details.
import { getCmsPageDetails } from "../services/cmsService";
// Import response type so consumers receive strongly typed data.
import type { CmsPageDetailsResponse } from "../services/cmsService";

// React Query hook that fetches a single CMS page by its ID for editing.
export const useCmsPageDetails = (cmsPageId: number | undefined) => {
  // Read token to gate the query when user is not authenticated.
  const token = authStorage.getToken();
  // Configure the React Query instance.
  return useQuery<CmsPageDetailsResponse, ApiError>({
    // Include CMS page ID in the cache key for scoping.
    queryKey: ["cmsPageDetails", cmsPageId],
    // Execute the fetcher with the CMS page ID.
    queryFn: () => getCmsPageDetails(cmsPageId!),
    // Disable automatic execution when no token exists or no CMS page ID is provided.
    enabled: Boolean(token) && Boolean(cmsPageId),
    // Cache data briefly to avoid duplicate calls when revisiting.
    staleTime: 30 * 1000,
  });
};

