// Import useQuery to handle cached API calls.
import { useQuery } from "@tanstack/react-query";
// Import ApiError for consistent error typing.
import { ApiError } from "../errors";
// Import auth storage to gate queries when token missing.
import { authStorage } from "../storage";
// Import service and response type for states.
import { getStates, type GetStatesResponse } from "../services/statesService";

/**
 * React Query hook to fetch states for filter dropdowns.
 * Used on Users page for the state filter.
 * @returns Query result with data containing states array.
 */
export const useStates = () => {
  const token = authStorage.getToken();
  return useQuery<GetStatesResponse, ApiError>({
    queryKey: ["states"],
    queryFn: () => getStates(),
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });
};

