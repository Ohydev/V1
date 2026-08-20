/**
 * Dashboard Service
 * API service functions for dashboard data
 */

import { makeRequest } from './apiClient';
import { GetHostUserDashboardResponse } from '../types/dashboard.types';

/**
 * Get host user dashboard data
 * Retrieves dashboard summary metrics (active events count, completed events count, total revenue)
 * and recent events (limit 3) with complete details including event thumbnail, title, date,
 * attendees count, location, revenue, and status badge
 * @returns Promise with dashboard data including summary metrics and recent events
 */
export const getHostUserDashboard = async (): Promise<GetHostUserDashboardResponse> => {
  // Make GET request to dashboard endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<GetHostUserDashboardResponse>(
    '/get_host_user_dashboard',
    'GET'
  );
  // Return response data
  return response.data;
};

