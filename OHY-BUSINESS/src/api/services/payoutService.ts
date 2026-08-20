/**
 * Payout Service
 * API service functions for host payouts data
 */

import { makeRequest } from "./apiClient";
import { GetHostPayoutsResponse } from "../types/payout.types";

/**
 * Get host payouts
 * Retrieves list of events with settlement breakdown and payouts
 * @param page - Page number (default: 1)
 * @param per_page - Items per page (default: 10)
 * @returns Promise with payouts data including events and pagination
 */
export const getHostPayouts = async (
  page: number = 1,
  per_page: number = 10
): Promise<GetHostPayoutsResponse> => {
  // Build query parameters
  const queryParams = new URLSearchParams({
    page: page.toString(),
    per_page: per_page.toString(),
  });
  
  // Make GET request to host payouts endpoint with pagination
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<GetHostPayoutsResponse>(
    `/host_payouts?${queryParams.toString()}`,
    "GET"
  );
  // Return response data
  return response.data;
};


