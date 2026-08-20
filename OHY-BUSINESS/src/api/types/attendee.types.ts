/**
 * Attendee API Type Definitions
 * TypeScript interfaces for attendee management APIs
 */

/**
 * Sort option for attendees list
 * Valid values: 'last_txn_date' (default), 'total_spend', 'total_txns'
 */
export type AttendeeSortBy = "last_txn_date" | "total_spend" | "total_txns";

/**
 * Request parameters for get_attendees_list API
 */
export interface GetAttendeesListRequest {
  // Optional search query to search across attendee name, email, and contact number
  search?: string;
  // Optional start date for date range filter (last transaction date) in d-m-Y format
  start_date?: string;
  // Optional end date for date range filter (last transaction date) in d-m-Y format
  end_date?: string;
  // Optional free text search on event titles to filter attendees
  events_filter?: string;
  // Optional event ID to filter attendees for a specific event
  event_id?: number;
  // Optional sort option (default: 'last_txn_date')
  sort_by?: AttendeeSortBy;
  // Optional page number for pagination (default: 1)
  page?: number;
  // Optional number of attendees per page (default: 10, max: 100)
  per_page?: number;
}

/**
 * Event information for an attendee
 * Shows which event the attendee purchased tickets for
 */
export interface AttendeeEvent {
  // Unique identifier for the event
  event_id: number;
  // Event title/name
  event_title: string;
  // Number of tickets purchased for this event
  tickets_purchased: number;
  // Total amount spent on this event
  event_spend: number;
}

/**
 * Single attendee record
 * Contains aggregated data across all events for this user
 */
export interface Attendee {
  // Unique identifier for the user (end user)
  user_id: number;
  // Full name of the attendee
  name: string;
  // Email address of the attendee
  email: string;
  // Contact number (phone) of the attendee (nullable)
  contact: string | null;
  // Total number of transactions across all events
  total_txns: number;
  // Total amount spent across all events
  total_spend: number;
  // Last transaction date formatted as d-m-Y H:i:s (nullable if no transactions)
  last_txn: string | null;
  // List of events attended by this attendee
  events: AttendeeEvent[];
}

/**
 * Pagination metadata returned by API
 */
export interface PaginationMetadata {
  // Total number of records matching filters
  total_records: number;
  // Current page number
  current_page: number;
  // Total number of pages
  total_pages: number;
  // Next page number (null if on last page)
  next_page: number | null;
  // Previous page number (null if on first page)
  prev_page: number | null;
}

/**
 * Response from get_attendees_list API
 */
export interface GetAttendeesListResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Array of attendees sorted by selected sort option
    attendees: Attendee[];
    // Pagination metadata
    pagination: PaginationMetadata;
  };
}

