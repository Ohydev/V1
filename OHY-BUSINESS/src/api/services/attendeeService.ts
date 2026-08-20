/**
 * Attendee Service
 * API service functions for attendee management
 */

// Import makeRequest function from API client
import { makeRequest } from './apiClient';
// Import TypeScript types for request and response
import {
  GetAttendeesListRequest,
  GetAttendeesListResponse,
} from '../types/attendee.types';

/**
 * Get attendees list
 * Retrieves a paginated list of attendees (End Users) across all events created by the authenticated Event Host
 * Supports search, date range filtering, event filtering, and sorting
 * @param params - Optional filters for search, date range, events, sorting, and pagination
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise with attendees array and pagination metadata
 */
export const getAttendeesList = async (
  params: GetAttendeesListRequest,
  signal?: AbortSignal
): Promise<GetAttendeesListResponse> => {
  // Create URLSearchParams to store query parameters
  const queryParams = new URLSearchParams();
  // Append search query if provided
  if (params.search) {
    // Store search keyword for backend filtering (searches name, email, contact)
    queryParams.append('search', params.search);
  }
  // Append start date if provided (already in d-m-Y format)
  if (params.start_date) {
    // Store start date in d-m-Y format for backend filtering
    queryParams.append('start_date', params.start_date);
  }
  // Append end date if provided (already in d-m-Y format)
  if (params.end_date) {
    // Store end date in d-m-Y format for backend filtering
    queryParams.append('end_date', params.end_date);
  }
  // Append events filter if provided (free text search on event titles)
  if (params.events_filter) {
    // Store events filter for backend filtering
    queryParams.append('events_filter', params.events_filter);
  }
  // Append event ID if provided (filter attendees for specific event)
  if (params.event_id) {
    // Store event ID for backend filtering
    queryParams.append('event_id', params.event_id.toString());
  }
  // Append sort by option if provided
  if (params.sort_by) {
    // Store sort option (last_txn_date, total_spend, or total_txns)
    queryParams.append('sort_by', params.sort_by);
  }
  // Append page number if provided
  if (params.page) {
    // Store page number as string value
    queryParams.append('page', params.page.toString());
  }
  // Append per_page value if provided
  if (params.per_page) {
    // Store records per page as string
    queryParams.append('per_page', params.per_page.toString());
  }
  // Build endpoint with serialized query string (skip '?' when empty)
  const endpoint = queryParams.toString()
    ? `/get_attendees_list?${queryParams.toString()}`
    : '/get_attendees_list';
  // Make GET request with optional abort signal
  const response = await makeRequest<GetAttendeesListResponse>(
    endpoint,
    'GET',
    undefined,
    undefined,
    undefined,
    signal
  );
  // Return parsed response data
  return response.data;
};

