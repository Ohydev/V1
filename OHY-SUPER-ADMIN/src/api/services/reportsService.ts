// Import the shared makeRequest helper to keep HTTP calls consistent.
import { makeRequest } from "../client";
// Import endpoints map to avoid hardcoded strings.
import { endpoints } from "../endpoints";

// Reporter info nested in each report (end user who submitted the report).
export type SuperAdminReportReporter = {
  // End user id.
  user_id: number;
  // Full name of the reporter.
  full_name: string;
  // Email of the reporter.
  email: string;
};

// Related event info when report_type is "event".
export type SuperAdminReportEvent = {
  // Event id.
  event_id: number;
  // Event title.
  event_title: string;
  // Host user id who created the event.
  host_user_id: number;
};

// Related host user info when report involves a host.
export type SuperAdminReportHostUser = {
  // Host user id.
  host_user_id: number;
  // First name.
  first_name: string;
  // Last name.
  last_name: string;
  // Email.
  email: string;
  // Phone number.
  phone_number: string | null;
  // Profile image path or null.
  profile_image: string | null;
};

// Related order info when report_type is "order".
export type SuperAdminReportOrder = {
  // Order id.
  order_id: number;
  // Human-readable order number (e.g. OHY-02012026-001).
  order_number: string;
  // Order status (e.g. paid).
  order_status: string;
  // Order date (d-m-Y from backend).
  order_date: string;
  // Total amount in currency units.
  total_amount: number;
  // End user id who placed the order.
  user_id: number;
};

// Report status: new, in_review, or resolved.
export type SuperAdminReportStatus = "new" | "in_review" | "resolved";

// Single report item returned by the backend.
export type SuperAdminReportListItem = {
  // Unique report id.
  report_id: number;
  // Type of report: event, host_profile, order, etc.
  report_type: string;
  // Status of the report: new, in_review, resolved.
  status: SuperAdminReportStatus;
  // Related event id when applicable (nullable for host/order reports).
  event_id: number | null;
  // Related host user id when applicable (nullable for event-only reports).
  host_user_id: number | null;
  // Related order id when report_type is order (nullable otherwise).
  order_id: number | null;
  // Report title.
  title: string;
  // Report description.
  description: string;
  // Priority: low, medium, high.
  priority: string;
  // Created at timestamp (d-m-Y H:i:s from backend).
  created_at: string;
  // Reporter (end user who submitted).
  reporter: SuperAdminReportReporter;
  // Related event when report_type is event.
  event?: SuperAdminReportEvent | null;
  // Related host user when applicable.
  host_user?: SuperAdminReportHostUser | null;
  // Related order when report_type is order.
  order?: SuperAdminReportOrder | null;
};

// Pagination metadata for the reports list.
export type SuperAdminReportsPagination = {
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
export type SuperAdminReportsListResponse = {
  // Success message from backend.
  message: string;
  // Array of report items for the current page.
  reports: SuperAdminReportListItem[];
  // Pagination metadata.
  pagination: SuperAdminReportsPagination;
};

// Optional query params for the reports list endpoint.
export type GetSuperAdminReportsListParams = {
  // Page number to request (default 1).
  page?: number;
  // Optional number of records per page.
  per_page?: number;
  // Filter by priority: high, medium, low.
  priority?: "high" | "medium" | "low";
  // Filter by status: new, in_review, resolved.
  status?: SuperAdminReportStatus;
  // Filter by report type: host, event, order (backend may map host -> host_profile).
  type?: "host" | "event" | "order";
};

/**
 * Fetch paginated user submitted reports for the super admin.
 * @param params - Optional page and per_page.
 * @returns Promise resolving to the reports list payload.
 */
export const getSuperAdminReportsList = async (
  params?: GetSuperAdminReportsListParams
): Promise<SuperAdminReportsListResponse> => {
  // Default to page 1 when not provided.
  const page = params?.page ?? 1;
  // Build request params object for makeRequest config.
  const requestParams: Record<string, string> = { page: String(page) };
  // Add per_page when provided by the caller.
  if (params?.per_page) {
    requestParams.per_page = String(params.per_page);
  }
  // Add priority filter when provided (high, medium, low).
  if (params?.priority) {
    requestParams.priority = params.priority;
  }
  // Add status filter when provided (new, in_review, resolved).
  if (params?.status) {
    requestParams.status = params.status;
  }
  // Add type filter when provided (host, event, order); backend may expect host_profile for host.
  if (params?.type) {
    requestParams.type =
      params.type === "host" ? "host_profile" : params.type;
  }
  // Execute GET through makeRequest with query params.
  return makeRequest<SuperAdminReportsListResponse>(
    endpoints.superAdminReportsList,
    "GET",
    undefined,
    { params: requestParams }
  );
};

// Request payload for updating report status.
export type UpdateSuperAdminReportStatusRequest = {
  // Report id to update.
  report_id: number;
  // New status: new, in_review, or resolved.
  status: SuperAdminReportStatus;
};

// Response shape for update report status (after unwrap).
export type UpdateSuperAdminReportStatusResponse = {
  // Success message from backend.
  message: string;
};

/**
 * Update the status of a user submitted report.
 * @param payload - report_id and new status.
 * @returns Promise resolving to the update response.
 */
export const updateSuperAdminReportStatus = async (
  payload: UpdateSuperAdminReportStatusRequest
): Promise<UpdateSuperAdminReportStatusResponse> => {
  // Execute POST through makeRequest with payload in body.
  return makeRequest<UpdateSuperAdminReportStatusResponse>(
    endpoints.updateSuperAdminReportStatus,
    "POST",
    payload
  );
};
