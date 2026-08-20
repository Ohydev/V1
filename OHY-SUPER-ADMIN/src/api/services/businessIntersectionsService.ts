// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import endpoints map to avoid hardcoded strings.
import { endpoints } from "../endpoints";

// Single business intersection option returned by the backend.
export type BusinessIntersectionItem = {
  // Unique identifier for the intersection.
  id: number;
  // Display name (e.g. "Woman-owned", "Man-owned").
  name: string;
};

// Response shape after unwrapping success/data (client returns response.data.data).
export type GetBusinessIntersectionsResponse = {
  // Success message from backend.
  message: string;
  // Array of business intersection options for filter dropdown.
  business_intersections: BusinessIntersectionItem[];
};

/**
 * Fetch business intersections list for filter dropdowns.
 * Used on Event Hosts page to filter by business intersection type.
 * @returns Promise containing message and business_intersections array.
 */
export const getBusinessIntersections =
  async (): Promise<GetBusinessIntersectionsResponse> => {
    // Execute GET request through makeRequest helper; no query params.
    return makeRequest<GetBusinessIntersectionsResponse>(
      endpoints.getBusinessIntersections,
      "GET"
    );
  };
