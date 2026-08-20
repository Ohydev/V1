/**
 * Stripe API Type Definitions
 * TypeScript interfaces for Stripe integration APIs
 */

/**
 * Stripe account data from create/get endpoints
 */
export interface StripeAccountData {
  // Stripe Connect account ID
  stripe_account_id: string;
  // URL to redirect user for KYC onboarding
  onboarding_url: string;
  // Whether KYC verification has been completed
  kyc_completed: boolean;
  // Status message from API
  message: string;
}

/**
 * Create host Stripe account API response
 */
export interface StripeAccountResponse {
  // Success flag
  success: boolean;
  // Response data
  data: StripeAccountData;
}

/**
 * Extended API error response with action_required field
 * Used when publish event fails with E004 error code
 */
export interface StripeErrorResponse {
  // Success flag (always false for errors)
  success: false;
  // Error details
  error: {
    // Error code (e.g., "E004")
    error_code: string;
    // Error message
    error_message: string;
    // Action required to resolve the error
    action_required: string;
  };
}

