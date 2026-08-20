// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import endpoints map to avoid hardcoded strings.
import { endpoints } from "../endpoints";

// Single state option returned by the backend.
export type StateItem = {
  // Unique identifier for the state.
  state_id: number;
  // Display name (e.g. "Alabama", "Alaska").
  name: string;
};

// Response shape after unwrapping success/data (client returns response.data.data).
export type GetStatesResponse = {
  // Success message from backend.
  message: string;
  // Array of state options for filter dropdown.
  states: StateItem[];
};

/**
 * Fetch states list for filter dropdowns.
 * Used on Users page to filter registered users by state.
 * @returns Promise containing message and states array.
 */
export const getStates = async (): Promise<GetStatesResponse> => {
  return makeRequest<GetStatesResponse>(endpoints.getStates, "GET");
};

