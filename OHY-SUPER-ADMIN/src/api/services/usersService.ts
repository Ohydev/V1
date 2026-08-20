// Import shared makeRequest helper to ensure consistent API integration.
import { makeRequest } from "../client";
// Import endpoints map so we avoid hardcoded strings.
import { endpoints } from "../endpoints";
// Import response and body types for strong typing.
import type {
  SuperAdminRegisteredUsersResponse,
  GetSuperAdminRegisteredUsersBody,
  SuperAdminAttendeesResponse,
} from "../types/users";

// Re-export body type so hooks can import params from the service.
export type GetSuperAdminRegisteredUsersParams = GetSuperAdminRegisteredUsersBody;

// Fetch the registered users list for the super admin dashboard (POST with body).
export const getSuperAdminRegisteredUsersList = async (
  params?: GetSuperAdminRegisteredUsersBody
): Promise<SuperAdminRegisteredUsersResponse> => {
  // Build request body with only defined fields so backend receives sent filters only.
  const body: GetSuperAdminRegisteredUsersBody = {};
  if (params?.page !== undefined) {
    body.page = params.page;
  }
  if (params?.search !== undefined && params.search !== "") {
    body.search = params.search;
  }
  if (params?.per_page !== undefined) {
    body.per_page = params.per_page;
  }
  if (params?.gender !== undefined) {
    body.gender = params.gender;
  }
  if (params?.age_range !== undefined) {
    body.age_range = params.age_range;
  }
  if (params?.state_id !== undefined) {
    body.state_id = params.state_id;
  }
  if (params?.zipcode !== undefined && params.zipcode.trim() !== "") {
    body.zipcode = params.zipcode.trim();
  }
  // Execute the POST request through the shared helper with body and return the payload.
  return makeRequest<SuperAdminRegisteredUsersResponse>(
    endpoints.superAdminRegisteredUsers,
    "POST",
    body
  );
};

// Define optional params for the attendees endpoint.
export type GetSuperAdminAttendeesParams = {
  // Page number to request.
  page?: number;
  // Optional number of records per page (defaults to backend default, typically 30).
  per_page?: number;
};

// Fetch the attendees list for the super admin dashboard.
export const getSuperAdminAttendeesList = async (
  params?: GetSuperAdminAttendeesParams
): Promise<SuperAdminAttendeesResponse> => {
  // Determine the requested page (default 1).
  const page = params?.page ?? 1;
  // Build params object with page and optional per_page.
  const requestParams: Record<string, string> = { page: String(page) };
  // Append per_page parameter when provided by the caller.
  if (params?.per_page) {
    requestParams.per_page = String(params.per_page);
  }
  // Execute GET using makeRequest with query params.
  return makeRequest<SuperAdminAttendeesResponse>(
    endpoints.superAdminAttendees,
    "GET",
    undefined,
    { params: requestParams }
  );
};


