// Import useQuery to handle cached API calls.
import { useQuery } from "@tanstack/react-query";
// Import ApiError for consistent error typing.
import { ApiError } from "../errors";
// Import auth storage to gate queries when token missing.
import { authStorage } from "../storage";
// Import service and response type for business intersections.
import {
  getBusinessIntersections,
  type GetBusinessIntersectionsResponse,
} from "../services/businessIntersectionsService";

/**
 * React Query hook to fetch business intersections for filter dropdowns.
 * Used on Event Hosts page for the business intersection filter.
 * @returns Query result with data containing business_intersections array.
 */
export const useBusinessIntersections = () => {
  // Retrieve stored token to prevent unauthorized calls.
  const token = authStorage.getToken();
  // Configure React Query consumer.
  return useQuery<GetBusinessIntersectionsResponse, ApiError>({
    // Stable cache key; list is relatively static.
    queryKey: ["businessIntersections"],
    // Execute the service function.
    queryFn: () => getBusinessIntersections(),
    // Disable query execution when token is absent.
    enabled: Boolean(token),
    // Cache longer since business intersections rarely change.
    staleTime: 5 * 60 * 1000,
  });
};
