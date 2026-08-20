/**
 * Events List Hooks
 * Provides typed React Query hooks for fetching event listings and tab counts
 */

// Import memo hook for derived data memoization
import { useMemo } from "react";
// Import React Query helpers for single and multiple queries
import { useQueries, useQuery } from "@tanstack/react-query";
// Import event service function to call backend API
import { getEventsList } from "@/api/services/eventService";
// Import type definitions for request parameters and enums
import {
  EventStatusFilter,
  GetEventsListRequest,
  GetEventsListResponse,
} from "@/api/types/event.types";

// Define base query key for main events list queries
const EVENTS_LIST_QUERY_KEY = "events-list";
// Define base query key for tab count queries
const EVENTS_COUNT_QUERY_KEY = "events-count";
// Define array of status values required for tab count queries
const STATUS_FILTERS: EventStatusFilter[] = ["live", "upcoming", "completed", "drafts"];

/**
 * Hook to fetch events list with React Query
 * @param params - Request parameters controlling filters and pagination
 * @returns React Query result containing events data
 */
export const useEventsList = (params: GetEventsListRequest) => {
  // Execute useQuery with stable key built from params
  return useQuery({
    // Build query key using base key plus serialized params
    queryKey: [
      EVENTS_LIST_QUERY_KEY,
      params.status,
      params.search || "",
      params.page || 1,
      params.per_page || 30,
    ],
    // Define query function that calls service with AbortSignal support
    queryFn: ({ signal }) => getEventsList(params, signal),
    // Keep previous data for smooth pagination transitions
    placeholderData: (previousData) => previousData,
    // Cache and stale times to reduce refetches within short intervals
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    // Disable refetch on window focus per PRD requirements
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to fetch counts for each status tab
 * @param search - Search term to keep counts aligned with visible filters
 * @returns Object containing counts per status and loading state
 */
export const useEventsTabCounts = (search: string) => {
  // Execute multiple queries (one per status) to fetch pagination totals
  const countQueries = useQueries({
    // Map status filters to query configs
    queries: STATUS_FILTERS.map((status) => ({
      // Build unique query key for each status + search combo
      queryKey: [EVENTS_COUNT_QUERY_KEY, status, search || ""],
      // Query function reuses events list API with per_page=1 for lightweight calls
      queryFn: ({ signal }) =>
        getEventsList(
          {
            status,
            search: search || undefined,
            page: 1,
            per_page: 1,
          },
          signal,
        ),
      // Share stale time configuration to avoid unnecessary refetches
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      // Disable window focus refetch for consistency
      refetchOnWindowFocus: false,
    })),
  });

  // Memoize derived counts map and loading state to avoid recalculations
  const counts = useMemo(() => {
    // Initialize counts map with zeros for all statuses
    const initialCounts: Record<EventStatusFilter, number> = {
      live: 0,
      upcoming: 0,
      completed: 0,
      drafts: 0,
    };
    // Iterate through query results and copy pagination totals when available
    countQueries.forEach((query, index) => {
      // Determine status key based on index ordering
      const statusKey = STATUS_FILTERS[index];
      // Update count when query has data
      if (query.data?.data.pagination.total_records !== undefined) {
        // Store pagination total records for the corresponding status
        initialCounts[statusKey] = query.data.data.pagination.total_records;
      }
    });
    // Return populated counts map
    return initialCounts;
  }, [countQueries]);

  // Determine combined loading state across all count queries
  const isLoading = countQueries.some((query) => query.isLoading);

  // Return counts and loading indicator to consuming components
  return { counts, isLoading };
};

