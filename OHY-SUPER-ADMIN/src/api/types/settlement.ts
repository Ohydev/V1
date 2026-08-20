// Define the structure for settlement summary data within each event.
export type SettlementSummaryData = {
  // Total amount collected from ticket sales for the event.
  total_collected: string;
  // Total amount that has been settled to the host.
  settlement_amount: string;
  // Total number of orders for the event.
  total_orders: number;
  // Number of orders that have been settled.
  settled_orders: number;
  // Current settlement status (settled or pending).
  settlement_status: "settled" | "pending";
  // Total platform fees collected by OHY.
  platform_fee_collected: string;
  // Timestamp when settlement was completed (formatted as Y-m-d H:i:s or null).
  settled_at: string | null;
};

// Define the structure for each event settlement summary entry.
export type EventSettlementSummary = {
  // Unique identifier for the event.
  event_id: number;
  // Title string describing the event.
  event_title: string;
  // Event end date formatted as Y-m-d.
  event_end_date: string;
  // Current status of the event (draft, live, upcoming, completed).
  event_status: string;
  // Boolean flag indicating if the event can be settled (event must be completed).
  can_settle: boolean;
  // Unique identifier for the host user who created the event.
  host_user_id: number;
  // Display name of the host user.
  host_name: string;
  // Settlement summary object containing financial metrics.
  summary: SettlementSummaryData;
};

// Define the pagination metadata attached to the settlement summary response.
export type SettlementPagination = {
  // Total number of event records available across all pages.
  total_records: number;
  // Current page number (1-indexed).
  current_page: number;
  // Number of records per page.
  per_page: number;
  // Total number of pages calculated by backend.
  total_pages: number;
  // Boolean flag indicating if another page exists after current page.
  has_next_page: boolean;
  // Boolean flag indicating if a previous page exists before current page.
  has_previous_page: boolean;
};

// Define the complete response payload returned by get_event_settlement_summary endpoint.
export type EventSettlementSummaryResponse = {
  // Array of event settlement summary records for the current page.
  events: EventSettlementSummary[];
  // Pagination metadata to drive pagination controls.
  pagination: SettlementPagination;
};

// Define optional query parameters for getEventSettlementSummary function.
export type GetEventSettlementSummaryParams = {
  // Optional event identifier to filter results to a specific event.
  event_id?: number;
  // Optional page number for pagination (defaults to 1).
  page?: number;
  // Optional number of records per page (defaults to backend default).
  per_page?: number;
  // Optional settlement status filter (settled or pending).
  settlement_status?: "settled" | "pending";
};

// Define the structure for settlement data returned after successful payout settlement.
export type SettlementData = {
  // Stripe transfer identifier for the settlement transaction.
  transfer_id: string;
  // Unique identifier for the event that was settled.
  event_id: number;
  // Title string describing the event that was settled.
  event_title: string;
  // Unique identifier for the host user who received the settlement.
  host_user_id: number;
  // Display name of the host user who received the settlement.
  host_name: string;
  // Total settlement amount as a formatted string (e.g., "100.00").
  total_amount: string;
  // Total settlement amount in cents (e.g., 10000 for $100.00).
  amount_cents: number;
  // Currency code for the settlement (e.g., "usd").
  currency: string;
  // Number of orders included in this settlement.
  order_count: number;
  // Timestamp when settlement was completed (formatted as Y-m-d H:i:s).
  settled_at: string;
};

// Define the request payload for settling event payout.
export type SettleEventPayoutRequest = {
  // Unique identifier of the event to settle.
  event_id: number;
};

// Define the response payload returned by settle_event_payout endpoint.
export type SettleEventPayoutResponse = {
  // Message describing the settlement outcome.
  message: string;
  // Settlement data object containing transaction details.
  settlement: SettlementData;
};

// Define the structure for settlement breakdown metrics.
export type SettlementBreakdownData = {
  // Total amount paid by customers for tickets.
  total_customer_paid: string;
  // Total fees charged by Stripe payment processor.
  total_stripe_fees: string;
  // Net amount after deducting Stripe fees from customer payments.
  net_after_stripe: string;
  // Total platform fees deducted by OHY.
  total_platform_fees: string;
  // Final amount to be paid out to the event host.
  total_host_payout: string;
  // Number of orders included in this settlement breakdown.
  order_count: number;
};

// Define the structure for event settlement breakdown response.
export type EventSettlementBreakdown = {
  // Unique identifier for the event.
  event_id: number;
  // Title string describing the event.
  event_title: string;
  // Unique identifier for the host user who created the event.
  host_user_id: number;
  // Display name of the host user.
  host_name: string;
  // Breakdown object containing detailed financial metrics.
  breakdown: SettlementBreakdownData;
};

// Define the request payload for getting event settlement breakdown.
export type GetEventSettlementBreakdownRequest = {
  // Unique identifier of the event to get breakdown for.
  event_id: number;
};

// Define the response payload returned by get_event_settlement_breakdown endpoint.
export type GetEventSettlementBreakdownResponse = EventSettlementBreakdown;


