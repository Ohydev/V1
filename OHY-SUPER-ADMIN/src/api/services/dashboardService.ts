// Import shared makeRequest helper to ensure consistent HTTP configuration.
import { makeRequest } from "../client";
// Import endpoints map to reference backend routes without hardcoding strings.
import { endpoints } from "../endpoints";

// Define the shape of the summary object returned by the dashboard endpoint.
export type SuperAdminDashboardSummary = {
  // Total count of currently active events.
  active_events: number;
  // Total number of events across the platform.
  total_events: number;
  // Total number of users across the platform.
  total_users: number;
  // Total revenue amount aggregated by the backend.
  total_revenue: number;
  // Total platform fees collected across all events.
  total_platform_fees_collected: number;
};

// Define the structure for each recent event entry in the dashboard payload.
export type SuperAdminDashboardRecentEvent = {
  // Unique identifier for the event.
  event_id: number;
  // Title string describing the event.
  event_title: string;
  // Status string (live, upcoming, completed, etc.).
  status: string;
  // Event date formatted as d-m-Y per API contract.
  date: string;
  // Event time formatted as HH:mm.
  time: string;
  // Number of attendees recorded for the event.
  attendees: number;
  // Name of the venue hosting the event.
  venue_name: string;
  // Revenue amount associated with the event.
  revenue: number;
  // Relative or absolute path to the event thumbnail image.
  thumbnail: string | null;
};

// Define the overall dashboard response returned by the backend.
export type SuperAdminDashboardResponse = {
  // Message describing the response outcome.
  message: string;
  // Summary object containing aggregate metrics.
  summary: SuperAdminDashboardSummary;
  // List of the most recent events for display.
  recent_events: SuperAdminDashboardRecentEvent[];
};

// Fetch the super admin dashboard data from the backend API.
export const getSuperAdminDashboard = async (): Promise<SuperAdminDashboardResponse> => {
  // Execute the GET request through the shared makeRequest helper.
  return makeRequest<SuperAdminDashboardResponse>(
    endpoints.superAdminDashboard,
    "GET"
  );
};

// Define optional parameters for fetching analytics data.
export type GetSuperAdminAnalyticsParams = {
  // Optional year filter for analytics data (defaults to 2025).
  year?: number;
};

// Define the structure for monthly analytics data returned by the API.
export type SuperAdminAnalyticsMonthlyData = Array<{
  // Month abbreviation as key (Jan, Feb, Mar, etc.) with numeric value.
  [month: string]: number;
}>;

// Define the overall analytics response returned by the backend.
export type SuperAdminAnalyticsResponse = {
  // Year for which the analytics data is provided.
  year: number;
  // Array of monthly event counts, each object containing month abbreviation and count.
  events: SuperAdminAnalyticsMonthlyData;
  // Array of monthly revenue amounts, each object containing month abbreviation and amount.
  revenue: SuperAdminAnalyticsMonthlyData;
  // Array of monthly profit amounts, each object containing month abbreviation and amount.
  profit: SuperAdminAnalyticsMonthlyData;
};

// Fetch the super admin analytics data from the backend API.
export const getSuperAdminAnalytics = async (
  params?: GetSuperAdminAnalyticsParams
): Promise<SuperAdminAnalyticsResponse> => {
  // Build query parameters object from provided params.
  const queryParams: Record<string, string> = {};
  
  // Add year parameter when provided (defaults to 2026 if not specified).
  const year = params?.year ?? 2026;
  queryParams.year = String(year);
  
  // Build query string from params object.
  const queryString = new URLSearchParams(queryParams).toString();
  // Append query string to endpoint.
  const endpoint = `${endpoints.superAdminAnalytics}?${queryString}`;
  
  // Execute the GET request through the shared makeRequest helper.
  return makeRequest<SuperAdminAnalyticsResponse>(endpoint, "GET");
};


