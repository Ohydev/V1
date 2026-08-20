/**
 * Stripe Service
 * API service functions for Stripe integration
 */

import { makeRequest } from './apiClient';
import { StripeAccountResponse } from '../types/stripe';

/**
 * Create host Stripe account
 * Creates a new Stripe Connect account for the authenticated host user
 * API Endpoint: POST /api/v1/create_host_stripe_account
 * 
 * @returns Promise with Stripe account data including onboarding URL
 * @throws AxiosError if request fails
 */
export const createHostStripeAccount = async (): Promise<StripeAccountResponse> => {
  // Make POST request to create Stripe account endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<StripeAccountResponse>(
    '/create_host_stripe_account',
    'POST'
  );
  // Return response data
  return response.data;
};

