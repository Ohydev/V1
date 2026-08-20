// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import centralized endpoint map to avoid scattering literal strings.
import { endpoints } from "../endpoints";

// Response shape returned by get_super_admin_venue_cities.
export type GetSuperAdminVenueCitiesResponse = {
  // Array of distinct venue cities.
  cities: string[];
  // Array of distinct venue states.
  states: string[];
};

/**
 * Fetch venue cities and states for super admin events filters.
 * Wraps GET /get_super_admin_venue_cities.
 */
export const getSuperAdminVenueCities =
  async (): Promise<GetSuperAdminVenueCitiesResponse> => {
    return makeRequest<GetSuperAdminVenueCitiesResponse>(
      endpoints.getSuperAdminVenueCities,
      "GET"
    );
  };

