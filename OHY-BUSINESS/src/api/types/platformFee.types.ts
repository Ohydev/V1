/**
 * Platform Fee API Type Definitions
 * TypeScript interfaces for platform fee APIs
 */

/**
 * Platform fee data structure
 * Contains fee type and value information
 */
export interface PlatformFeeData {
  // Fee type: "flat_rate", "percentage", etc.
  fee_type: string;
  // Fee value as string (e.g., "5.00" for flat rate or "5" for percentage)
  fee_value: string;
}

/**
 * Get my platform fee response
 * Response structure for get_my_platform_fee endpoint
 */
export interface GetMyPlatformFeeResponse {
  // Success flag
  success: boolean;
  // Response data containing platform fee information
  data: PlatformFeeData;
}

