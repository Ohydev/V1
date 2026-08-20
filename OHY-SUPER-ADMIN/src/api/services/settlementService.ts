// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import centralized endpoint map to avoid scattering literal strings.
import { endpoints } from "../endpoints";
// Import type definitions for settlement-related API responses.
import type {
  EventSettlementSummaryResponse,
  GetEventSettlementSummaryParams,
  SettleEventPayoutRequest,
  SettleEventPayoutResponse,
  GetEventSettlementBreakdownRequest,
  GetEventSettlementBreakdownResponse,
} from "../types/settlement";

/**
 * Fetch event settlement summary from the backend API.
 * Retrieves paginated list of events with their settlement information.
 * 
 * @param params - Optional query parameters for filtering and pagination.
 * @param params.event_id - Optional event identifier to filter results to a specific event.
 * @param params.page - Optional page number for pagination (defaults to 1).
 * @param params.per_page - Optional number of records per page (defaults to backend default).
 * @param params.settlement_status - Optional settlement status filter (settled or pending).
 * @returns Promise resolving to the settlement summary response with events and pagination.
 */
export const getEventSettlementSummary = async (
  params?: GetEventSettlementSummaryParams
): Promise<EventSettlementSummaryResponse> => {
  // Build query parameters object from provided params.
  const queryParams: Record<string, string> = {};
  
  // Add event_id parameter when provided.
  if (params?.event_id) {
    queryParams.event_id = String(params.event_id);
  }
  
  // Add page parameter when provided (defaults to 1 if not specified).
  const page = params?.page ?? 1;
  if (page > 1) {
    queryParams.page = String(page);
  }
  
  // Add per_page parameter when provided.
  if (params?.per_page) {
    queryParams.per_page = String(params.per_page);
  }
  
  // Add settlement_status parameter when provided.
  if (params?.settlement_status) {
    queryParams.settlement_status = params.settlement_status;
  }
  
  // Build query string from params object.
  const queryString = new URLSearchParams(queryParams).toString();
  // Append query string to endpoint when params exist.
  const endpoint = queryString
    ? `${endpoints.eventSettlementSummary}?${queryString}`
    : endpoints.eventSettlementSummary;
  
  // Execute GET request through makeRequest helper.
  return makeRequest<EventSettlementSummaryResponse>(endpoint, "GET");
};

/**
 * Settle event payout from the backend API.
 * Processes the settlement transaction for a specific event and transfers funds to the host.
 * 
 * @param request - Request payload containing the event identifier to settle.
 * @param request.event_id - Unique identifier of the event to settle.
 * @returns Promise resolving to the settlement response with transaction details.
 */
export const settleEventPayout = async (
  request: SettleEventPayoutRequest
): Promise<SettleEventPayoutResponse> => {
  // Execute POST request through makeRequest helper with event_id in request body.
  return makeRequest<SettleEventPayoutResponse>(
    endpoints.settleEventPayout,
    "POST",
    request
  );
};

/**
 * Fetch event settlement breakdown from the backend API.
 * Retrieves detailed financial breakdown for a specific event including fees and payout calculations.
 * 
 * @param request - Request payload containing the event identifier to get breakdown for.
 * @param request.event_id - Unique identifier of the event to get breakdown for.
 * @returns Promise resolving to the settlement breakdown response with detailed metrics.
 */
export const getEventSettlementBreakdown = async (
  request: GetEventSettlementBreakdownRequest
): Promise<GetEventSettlementBreakdownResponse> => {
  // Build query string with event_id parameter.
  const queryString = `event_id=${request.event_id}`;
  // Append query string to endpoint.
  const endpoint = `${endpoints.getEventSettlementBreakdown}?${queryString}`;
  // Execute GET request through makeRequest helper with event_id as query parameter.
  return makeRequest<GetEventSettlementBreakdownResponse>(endpoint, "GET");
};


