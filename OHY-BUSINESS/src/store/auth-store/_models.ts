/**
 * Authentication store model definitions
 * These types define the structure of authentication data stored in the Zustand store
 */

// Import user and business info types from API types
import { UserInfo, BusinessInfo } from "@/api/types/auth.types";

/**
 * Authentication model structure
 * Contains token and user/business information from API response
 */
export interface AuthModel {
  // API authentication token for authenticated requests (Laravel Sanctum token)
  api_token: string;
  // User information object containing user details (can be null if not available)
  userInfo: UserInfo | null;
  // Business information object containing business details (can be null if user doesn't have business)
  businessInfo: BusinessInfo | null;
}

