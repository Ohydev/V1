// Import shared makeRequest helper to ensure consistent API integration.
import { makeRequest } from "../client";
// Import endpoints map so we avoid hardcoded strings.
import { endpoints } from "../endpoints";

// Define the structure for a single CMS page returned by the API.
export type CmsPage = {
  // Unique identifier for the CMS page.
  cms_page_id: number;
  // Title of the CMS page (e.g., "Terms & Conditions").
  title: string;
  // URL-friendly slug generated from the title.
  slug: string;
  // Rich text HTML content from the WYSIWYG editor.
  content: string;
  // Status flag indicating if the page is active (visible in footer).
  is_active: boolean;
};

// Define the pagination metadata structure returned by the API.
export type CmsPagesPagination = {
  // Total number of CMS pages matching the query.
  total_records: number;
  // Current page number (1-indexed).
  current_page: number;
  // Total number of pages available.
  total_pages: number;
  // Next page number if available, null otherwise.
  next_page: number | null;
  // Previous page number if available, null otherwise.
  prev_page: number | null;
};

// Define the response structure for the CMS pages list endpoint.
export type CmsPagesListResponse = {
  // Message describing the response outcome.
  message: string;
  // Array of CMS pages for the current page.
  cms_pages: CmsPage[];
  // Pagination metadata for navigation controls.
  pagination: CmsPagesPagination;
};

// Define the response structure for the CMS page details endpoint.
export type CmsPageDetailsResponse = {
  // Message describing the response outcome.
  message: string;
  // Complete CMS page data.
  cms_page: CmsPage;
};

// Define the request parameters for fetching CMS pages list.
export type GetCmsPagesListParams = {
  // Page number to request (defaults to backend page 1).
  page?: number;
  // Number of items per page (defaults to backend default, max 100).
  per_page?: number;
  // Search term to filter CMS pages by title (case-insensitive partial match).
  search?: string;
  // Filter by active status (true for active, false for inactive).
  is_active?: boolean;
  // Field to sort by (options: "title").
  sort_by?: "title";
  // Sort direction (options: "asc", "desc").
  sort_order?: "asc" | "desc";
};

// Define the request body for creating a new CMS page.
export type CreateCmsPageRequest = {
  // CMS page title (required, max 255 characters, must be unique).
  title: string;
  // Rich text HTML content from WYSIWYG editor (required).
  content: string;
  // Active status flag (optional, defaults to true).
  is_active?: boolean;
};

// Define the response structure for creating a CMS page.
export type CreateCmsPageResponse = {
  // Message describing the response outcome.
  message: string;
  // Created CMS page data including auto-generated slug.
  cms_page: CmsPage;
};

// Define the request body for updating an existing CMS page.
export type UpdateCmsPageRequest = {
  // Unique identifier of the CMS page to update (required).
  cms_page_id: number;
  // Updated CMS page title (optional, max 255 characters).
  title?: string;
  // Updated rich text HTML content (optional).
  content?: string;
  // Updated active status flag (optional).
  is_active?: boolean;
};

// Define the response structure for updating a CMS page.
export type UpdateCmsPageResponse = {
  // Message describing the response outcome.
  message: string;
  // Updated CMS page data.
  cms_page: CmsPage;
};

// Define the response structure for deleting a CMS page.
export type DeleteCmsPageResponse = {
  // Message describing the response outcome.
  message: string;
};

// Fetch the CMS pages list for the super admin dashboard.
export const getCmsPagesList = async (
  params?: GetCmsPagesListParams
): Promise<CmsPagesListResponse> => {
  // Instantiate URLSearchParams to build the optional query string.
  const query = new URLSearchParams();
  // Append the page parameter when provided by the caller.
  if (params?.page) {
    query.set("page", String(params.page));
  }
  // Append the per_page parameter when provided by the caller.
  if (params?.per_page) {
    query.set("per_page", String(params.per_page));
  }
  // Append the search parameter when provided by the caller.
  if (params?.search) {
    query.set("search", params.search);
  }
  // Append the is_active parameter when provided by the caller.
  if (params?.is_active !== undefined) {
    query.set("is_active", String(params.is_active));
  }
  // Append the sort_by parameter when provided by the caller.
  if (params?.sort_by) {
    query.set("sort_by", params.sort_by);
  }
  // Append the sort_order parameter when provided by the caller.
  if (params?.sort_order) {
    query.set("sort_order", params.sort_order);
  }
  // Serialize the query parameters into a string.
  const queryString = query.toString();
  // Compose the final endpoint with query string when present.
  const endpoint = queryString
    ? `${endpoints.cmsPagesList}?${queryString}`
    : endpoints.cmsPagesList;
  // Execute the GET request through the shared helper and return the payload.
  return makeRequest<CmsPagesListResponse>(endpoint, "GET");
};

// Fetch a single CMS page by its ID for editing.
export const getCmsPageDetails = async (
  cmsPageId: number
): Promise<CmsPageDetailsResponse> => {
  // Build the endpoint with the CMS page ID as a query parameter.
  const endpoint = `${endpoints.cmsPageDetails}?cms_page_id=${cmsPageId}`;
  // Execute the GET request through the shared helper and return the payload.
  return makeRequest<CmsPageDetailsResponse>(endpoint, "GET");
};

// Create a new CMS page with title, content, and optional active status.
export const createCmsPage = async (
  data: CreateCmsPageRequest
): Promise<CreateCmsPageResponse> => {
  // Execute the POST request through the shared helper with the request body.
  return makeRequest<CreateCmsPageResponse>(endpoints.createCmsPage, "POST", data);
};

// Update an existing CMS page with partial data (all fields except cms_page_id are optional).
export const updateCmsPage = async (
  data: UpdateCmsPageRequest
): Promise<UpdateCmsPageResponse> => {
  // Execute the POST request through the shared helper with the request body.
  return makeRequest<UpdateCmsPageResponse>(endpoints.updateCmsPage, "POST", data);
};

// Delete a CMS page by its ID (hard delete, irreversible).
export const deleteCmsPage = async (
  cmsPageId: number
): Promise<DeleteCmsPageResponse> => {
  // Build the endpoint with the CMS page ID in the URL path.
  const endpoint = `${endpoints.deleteCmsPage}/${cmsPageId}`;
  // Execute the POST request through the shared helper (no body needed).
  return makeRequest<DeleteCmsPageResponse>(endpoint, "POST");
};

