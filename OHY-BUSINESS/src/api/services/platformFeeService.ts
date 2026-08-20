/**
 * Platform Fee Service
 * API service functions for platform fee data
 */

import { makeRequest } from './apiClient';
import { GetMyPlatformFeeResponse } from '../types/platformFee.types';

/**
 * Get my platform fee
 * Retrieves the current user's platform fee configuration including fee type and value
 * @returns Promise with platform fee data including fee_type and fee_value
 */
export const getMyPlatformFee = async (): Promise<GetMyPlatformFeeResponse> => {
  // Make GET request to platform fee endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<GetMyPlatformFeeResponse>(
    '/get_my_platform_fee',
    'GET'
  );
  // Return response data
  return response.data;
};

