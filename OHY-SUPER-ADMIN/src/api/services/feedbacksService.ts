// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import endpoints map to avoid hardcoded strings.
import { endpoints } from "../endpoints";

// Submitter info nested in each feedback (user or host who submitted).
export type SuperAdminFeedbackSubmitter = {
  // Full name of the submitter.
  name: string;
  // Email of the submitter.
  email: string;
};

// Single feedback item returned by the backend.
export type SuperAdminFeedbackListItem = {
  // Unique feedback id.
  feedback_id: number;
  // Type of submitter: user or host.
  submitter_type: string;
  // Submitter details (name, email).
  submitter: SuperAdminFeedbackSubmitter;
  // Feedback title.
  title: string;
  // Feedback description.
  description: string;
  // Created at timestamp (d-m-Y H:i:s from backend).
  created_at: string;
};

// Pagination metadata for the feedbacks list.
export type SuperAdminFeedbacksPagination = {
  // Total number of records available.
  total_records: number;
  // Current page (1-based).
  current_page: number;
  // Total number of pages.
  total_pages: number;
  // Next page number or null.
  next_page: number | null;
  // Previous page number or null.
  prev_page: number | null;
};

// Response shape after unwrapping success/data (client returns response.data.data).
export type SuperAdminFeedbacksListResponse = {
  // Success message from backend.
  message: string;
  // Array of feedback items for the current page.
  feedbacks: SuperAdminFeedbackListItem[];
  // Pagination metadata.
  pagination: SuperAdminFeedbacksPagination;
};

// Optional query params for the feedbacks list endpoint.
export type GetSuperAdminFeedbacksListParams = {
  // Page number to request (default 1).
  page?: number;
  // Optional number of records per page.
  per_page?: number;
};

/**
 * Fetch paginated feedbacks list for the super admin.
 * @param params - Optional page and per_page.
 * @returns Promise resolving to the feedbacks list payload.
 */
export const getSuperAdminFeedbacksList = async (
  params?: GetSuperAdminFeedbacksListParams
): Promise<SuperAdminFeedbacksListResponse> => {
  // Default to page 1 when not provided.
  const page = params?.page ?? 1;
  // Build request params object for makeRequest config.
  const requestParams: Record<string, string> = { page: String(page) };
  // Add per_page when provided by the caller.
  if (params?.per_page) {
    requestParams.per_page = String(params.per_page);
  }
  // Execute GET through makeRequest with query params.
  return makeRequest<SuperAdminFeedbacksListResponse>(
    endpoints.superAdminFeedbacksList,
    "GET",
    undefined,
    { params: requestParams }
  );
};
