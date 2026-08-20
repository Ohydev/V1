// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import endpoints map to avoid hardcoded strings.
import { endpoints } from "../endpoints";

// Single event category option returned by the backend.
export type EventCategoryItem = {
  // Unique identifier for the category.
  event_category_id: number;
  // Display name (e.g. "Arts & Culture", "Technology").
  category_name: string;
};

// Response shape after unwrapping success/data (client returns response.data.data).
export type GetEventCategoriesResponse = {
  // Success message from backend.
  message: string;
  // Array of event category options for filter dropdown.
  categories: EventCategoryItem[];
};

/**
 * Fetch event categories list for filter dropdowns.
 * Used on Events page to filter by event category.
 * @returns Promise containing message and categories array.
 */
export const getEventCategories =
  async (): Promise<GetEventCategoriesResponse> => {
    return makeRequest<GetEventCategoriesResponse>(
      endpoints.getEventCategories,
      "GET"
    );
  };
