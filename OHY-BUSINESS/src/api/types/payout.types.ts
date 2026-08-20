/**
 * Host Payouts API Type Definitions
 * TypeScript interfaces for host payouts APIs
 */

/**
 * Payout breakdown data structure
 * Contains settlement breakdown values for a single event
 */
export interface PayoutBreakdown {
  // Total amount paid by customers (gross)
  total_customer_paid: string;
  // Total Stripe processing fees
  total_stripe_fees: string;
  // Net amount after Stripe fees
  net_after_stripe: string;
  // Total platform fees deducted
  total_platform_fees: string;
  // Final payout amount to host
  total_host_payout: string;
  // Total number of orders included in this settlement
  order_count: number;
}

/**
 * Host payout event
 * Represents settlement information for a single event
 */
export interface PayoutEvent {
  // Unique identifier for the event
  event_id: number;
  // Event title/name
  event_title: string;
  // Event date in YYYY-MM-DD format
  event_date: string;
  // Settlement status: "pending" | "settled"
  settlement_status: "pending" | "settled";
  // Settlement breakdown details
  breakdown: PayoutBreakdown;
}

/**
 * Pagination metadata for host payouts list
 */
export interface PayoutPagination {
  total_records: number;
  current_page: number;
  per_page: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

/**
 * Get host payouts response
 * Complete payouts data including events and pagination metadata
 */
export interface GetHostPayoutsResponse {
  // Success flag
  success: boolean;
  // Response data
  data: {
    // List of payout events
    events: PayoutEvent[];
    // Pagination information
    pagination: PayoutPagination;
  };
}


