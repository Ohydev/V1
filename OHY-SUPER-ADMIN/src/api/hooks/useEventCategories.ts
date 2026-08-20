// Import useQuery to handle cached API calls.
import { useQuery } from "@tanstack/react-query";
// Import ApiError for consistent error typing.
import { ApiError } from "../errors";
// Import auth storage to gate queries when token missing.
import { authStorage } from "../storage";
// Import service and response type for event categories.
import {
  getEventCategories,
  type GetEventCategoriesResponse,
} from "../services/eventCategoriesService";

/**
 * React Query hook to fetch event categories for filter dropdowns.
 * Used on Events page for the category filter.
 * @returns Query result with data containing categories array.
 */
export const useEventCategories = () => {
  const token = authStorage.getToken();
  return useQuery<GetEventCategoriesResponse, ApiError>({
    queryKey: ["eventCategories"],
    queryFn: () => getEventCategories(),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
};
