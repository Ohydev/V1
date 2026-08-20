/**
 * Dashboard API Type Definitions
 * TypeScript interfaces for dashboard APIs
 */

/**
 * Dashboard summary metrics
 * Contains aggregated statistics for the host user
 */
export interface DashboardSummary {
  // Count of active events (published and currently live)
  active_events: number;
  // Count of completed events (published and ended)
  completed_events: number;
  // Total revenue across all events for the host user
  total_revenue: number;
  // Total Stripe charges deducted from revenue
  total_stripe_charges_deducted: number;
  // Total platform fees deducted from revenue
  platform_fee_deducted: number;
  // Total profit after platform fees
  total_profit: number;
}

/**
 * Recent event from dashboard
 * Contains essential event information for dashboard display
 */
export interface RecentEvent {
  // Unique identifier for the event
  event_id: number;
  // Event title/name
  event_title: string;
  // Calculated event status: 'live', 'upcoming', 'completed', or 'draft'
  status: "live" | "upcoming" | "completed" | "draft";
  // Start date formatted as d-m-Y (e.g., "15-12-2025")
  date: string;
  // Start time formatted as H:i (e.g., "09:00")
  time: string;
  // Total number of tickets sold (sum of sold_quantity)
  attendees: number;
  // Venue name from venue relationship (null if not set)
  venue_name: string | null;
  // Total revenue for this event (sum of sold_quantity * price)
  revenue: number;
  // Thumbnail file path (null if not exists)
  thumbnail: string | null;
}

/**
 * Get host user dashboard response
 * Complete dashboard data including summary metrics and recent events
 */
export interface GetHostUserDashboardResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // Success message
    message: string;
    // Summary metrics: active events count, completed events count, total revenue
    summary: DashboardSummary;
    // Array of 3 most recent events sorted by creation date (newest first)
    recent_events: RecentEvent[];
    // Whether host business profile setup is complete; if false, prompt user to complete profile
    is_host_business_setup_complete?: boolean;
  };
}

