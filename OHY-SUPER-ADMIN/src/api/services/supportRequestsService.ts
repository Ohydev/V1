// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import endpoints map to avoid hardcoded strings.
import { endpoints } from "../endpoints";

// Submitter info nested in each support request (user or host who submitted).
export type SupportRequestSubmitter = {
  // Full name of the submitter.
  name: string;
  // Email of the submitter.
  email: string;
};

// Single support request item returned by the backend.
export type SupportRequestListItem = {
  // Unique support request id.
  support_request_id: number;
  // Type of submitter: user or host.
  submitter_type: string;
  // Submitter details (name, email).
  submitter: SupportRequestSubmitter;
  // Support request title.
  title: string;
  // Support request description.
  description: string;
  // Created at timestamp (d-m-Y H:i:s from backend).
  created_at: string;
};

// Pagination metadata for the support requests list.
export type SuperAdminSupportRequestsPagination = {
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
export type SuperAdminSupportRequestsListResponse = {
  // Success message from backend.
  message: string;
  // Array of support request items for the current page.
  support_requests: SupportRequestListItem[];
  // Pagination metadata.
  pagination: SuperAdminSupportRequestsPagination;
};

// Optional query params for the support requests list endpoint.
export type GetSuperAdminSupportRequestsListParams = {
  // Page number to request (default 1).
  page?: number;
  // Optional number of records per page.
  per_page?: number;
};

/**
 * Fetch paginated support requests list for the super admin.
 * @param params - Optional page and per_page.
 * @returns Promise resolving to the support requests list payload.
 */
export const getSuperAdminSupportRequestsList = async (
  params?: GetSuperAdminSupportRequestsListParams
): Promise<SuperAdminSupportRequestsListResponse> => {
  // Default to page 1 when not provided.
  const page = params?.page ?? 1;
  // Build request params object for makeRequest config.
  const requestParams: Record<string, string> = { page: String(page) };
  // Add per_page when provided by the caller.
  if (params?.per_page) {
    requestParams.per_page = String(params.per_page);
  }
  // Execute GET through makeRequest with query params.
  return makeRequest<SuperAdminSupportRequestsListResponse>(
    endpoints.superAdminSupportRequestsList,
    "GET",
    undefined,
    { params: requestParams }
  );
};
