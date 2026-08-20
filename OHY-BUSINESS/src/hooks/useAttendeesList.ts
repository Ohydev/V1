/**
 * Attendees List Hook
 * Provides typed React Query hook for fetching attendees list with filtering and pagination
 */

// Import React Query hook for data fetching
import { useQuery } from "@tanstack/react-query";
// Import attendee service function to call backend API
import { getAttendeesList } from "@/api/services/attendeeService";
// Import type definitions for request parameters
import { GetAttendeesListRequest } from "@/api/types/attendee.types";

// Define base query key for attendees list queries
const ATTENDEES_LIST_QUERY_KEY = "attendees-list";

/**
 * Hook to fetch attendees list with React Query
 * @param params - Request parameters controlling filters, sorting, and pagination
 * @returns React Query result containing attendees data
 */
export const useAttendeesList = (params: GetAttendeesListRequest) => {
  // Execute useQuery with stable key built from params
  return useQuery({
    // Build query key using base key plus serialized params
    queryKey: [
      ATTENDEES_LIST_QUERY_KEY,
      params.search || "",
      params.start_date || "",
      params.end_date || "",
      params.events_filter || "",
      params.event_id || null,
      params.sort_by || "last_txn_date",
      params.page || 1,
      params.per_page || 10,
    ],
    // Define query function that calls service with AbortSignal support
    queryFn: ({ signal }) => getAttendeesList(params, signal),
    // Keep previous data for smooth pagination transitions
    placeholderData: (previousData) => previousData,
    // Cache and stale times to reduce refetches within short intervals
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    // Disable refetch on window focus per PRD requirements
    refetchOnWindowFocus: false,
  });
};

