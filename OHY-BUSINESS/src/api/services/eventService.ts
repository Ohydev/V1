/**
 * Event Service
 * API service functions for event creation and management
 */

import { makeRequest } from './apiClient';
import {
  EventCreationMasterDataResponse,
  SaveEventStep1Response,
  GetEventDataForEditingResponse,
  ApiErrorResponse,
  CreateTicketCategoryRequest,
  CreateTicketCategoryResponse,
  GetTicketCategoriesResponse,
  SaveEventStep2Request,
  SaveEventStep2Response,
  SaveEventStep3Response,
  SaveEventStep4Response,
  SaveEventStep5Request,
  SaveEventStep5Response,
  SaveEventStep6Request,
  SaveEventStep6Response,
  GetEventsListRequest,
  GetEventsListResponse,
  GetEventSummaryResponse,
  PublishEventRequest,
  PublishEventResponse,
  GetEventDetailsResponse,
} from '../types/event.types';

/**
 * Get event creation master data
 * Retrieves all master data required for the 7-step event creation wizard
 * @returns Promise with master data including categories, countries, ticket types, etc.
 */
export const getEventCreationMasterData = async (): Promise<EventCreationMasterDataResponse> => {
  // Make GET request to master data endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<EventCreationMasterDataResponse>(
    '/get_event_creation_master_data',
    'GET'
  );
  // Return response data
  return response.data;
};

/**
 * Save event step 1 (Event Details)
 * Saves or updates event basic information, media files, and social media links
 * @param formData - FormData object containing all step 1 fields and files
 * @returns Promise with event data including event_id and is_new_event flag
 */
export const saveEventStep1 = async (formData: FormData): Promise<SaveEventStep1Response> => {
  // Make POST request with multipart/form-data for file uploads
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<SaveEventStep1Response>(
    '/save_event_step_1',
    'POST',
    formData,
    {
      // Set content type for file uploads (browser will set boundary automatically)
      'Content-Type': 'multipart/form-data',
    }
  );
  // Return response data
  return response.data;
};

/**
 * Get event data for editing
 * Retrieves all event data from all 7 steps for a draft event in a format optimized for form preloading
 * @param eventId - Event ID to retrieve data for editing
 * @returns Promise with complete event data organized by steps (step_1 through step_6)
 */
export const getEventDataForEditing = async (eventId: number): Promise<GetEventDataForEditingResponse> => {
  // Build query string with event_id parameter
  const queryParams = new URLSearchParams({
    event_id: eventId.toString(),
  });
  // Make GET request to get event data for editing endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<GetEventDataForEditingResponse>(
    `/get_event_data_for_editing?${queryParams.toString()}`,
    'GET'
  );
  // Return response data
  return response.data;
};

/**
 * Create ticket category
 * Creates a new ticket category for a specific event
 * @param eventId - Event ID to create category for
 * @param categoryName - Category name (e.g., 'Early Bird', 'VIP')
 * @returns Promise with created ticket category
 */
export const createTicketCategory = async (
  eventId: number,
  categoryName: string
): Promise<CreateTicketCategoryResponse> => {
  // Create request body with event_id and category_name
  const requestData: CreateTicketCategoryRequest = {
    event_id: eventId,
    category_name: categoryName,
  };
  // Make POST request to create ticket category endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<CreateTicketCategoryResponse>(
    '/create_ticket_category',
    'POST',
    requestData
  );
  // Return response data
  return response.data;
};

/**
 * Get ticket categories
 * Retrieves all ticket categories for a specific event
 * @param eventId - Event ID to retrieve categories for
 * @returns Promise with array of ticket categories sorted alphabetically
 */
export const getTicketCategories = async (eventId: number): Promise<GetTicketCategoriesResponse> => {
  // Build query string with event_id parameter
  const queryParams = new URLSearchParams({
    event_id: eventId.toString(),
  });
  // Make GET request to get ticket categories endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<GetTicketCategoriesResponse>(
    `/get_ticket_categories?${queryParams.toString()}`,
    'GET'
  );
  // Return response data
  return response.data;
};

/**
 * Save event step 2 (Ticketing)
 * Saves all tickets for Step 2 of event creation wizard
 * Uses "replace all" approach: deletes all existing tickets and creates new ones
 * @param eventId - Event ID to save tickets for
 * @param tickets - Array of ticket objects (can be empty to delete all tickets)
 * @returns Promise with all created tickets
 */
export const saveEventStep2 = async (
  eventId: number,
  tickets: SaveEventStep2Request['tickets']
): Promise<SaveEventStep2Response> => {
  // Create request body with event_id and tickets array
  const requestData: SaveEventStep2Request = {
    event_id: eventId,
    tickets: tickets,
  };
  // Make POST request to save event step 2 endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<SaveEventStep2Response>(
    '/save_event_step_2',
    'POST',
    requestData
  );
  // Return response data
  return response.data;
};

/**
 * Save event step 3 (Venue Details)
 * Saves or updates venue details for Step 3 of event creation wizard
 * Uses create/update pattern: checks if venue exists for the event, updates if exists, creates if not
 * Handles optional venue image upload with automatic old file deletion when updating
 * @param eventId - Event ID to save venue for
 * @param formData - FormData object containing all venue fields and optional venue_image file
 * @returns Promise with venue data including coordinates formatted as strings
 */
export const saveEventStep3 = async (
  eventId: number,
  formData: FormData
): Promise<SaveEventStep3Response> => {
  // Append event_id to form data
  formData.append('event_id', eventId.toString());
  // Make POST request with multipart/form-data for file uploads
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<SaveEventStep3Response>(
    '/save_event_step_3',
    'POST',
    formData,
    {
      // Set content type for file uploads (browser will set boundary automatically)
      'Content-Type': 'multipart/form-data',
    }
  );
  // Return response data
  return response.data;
};

/**
 * Save event step 4 (Event Members/Artists)
 * Saves all artists for Step 4 of event creation wizard
 * Uses "replace all" approach: deletes all existing artists and creates new ones
 * Handles optional artist image uploads
 * @param eventId - Event ID to save artists for
 * @param formData - FormData object containing artists array with nested social_media arrays and optional artist_image files
 * @returns Promise with all created artists including their social media links
 */
export const saveEventStep4 = async (
  eventId: number,
  formData: FormData
): Promise<SaveEventStep4Response> => {
  // Append event_id to form data
  formData.append('event_id', eventId.toString());
  // Make POST request with multipart/form-data for file uploads
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<SaveEventStep4Response>(
    '/save_event_step_4',
    'POST',
    formData,
    {
      // Set content type for file uploads (browser will set boundary automatically)
      'Content-Type': 'multipart/form-data',
    }
  );
  // Return response data
  return response.data;
};

/**
 * Save event step 5 (Terms & Conditions)
 * Saves or updates terms content for Step 5 of event creation wizard
 * Uses create/update pattern (single terms record per event)
 * @param payload - Request payload containing event_id and terms_content
 * @returns Promise with saved terms data
 */
export const saveEventStep5 = async (
  payload: SaveEventStep5Request
): Promise<SaveEventStep5Response> => {
  // Make POST request with JSON payload
  const response = await makeRequest<SaveEventStep5Response>(
    '/save_event_step_5',
    'POST',
    payload
  );
  // Return response data
  return response.data;
};

/**
 * Save event step 6 (Coupons)
 * Saves all coupons using replace-all pattern (deletes existing, creates new)
 * @param payload - Request payload containing event_id and coupons array
 * @returns Promise with saved coupons data
 */
export const saveEventStep6 = async (
  payload: SaveEventStep6Request
): Promise<SaveEventStep6Response> => {
  const response = await makeRequest<SaveEventStep6Response>(
    '/save_event_step_6',
    'POST',
    payload
  );
  return response.data;
};

/**
 * Get event summary (Step 7)
 * Aggregates all step data for summary screen
 * @param eventId - Event ID to fetch summary for
 * @param signal - Optional AbortSignal for cancellation
 * @returns Promise with event summary data
 */
export const getEventSummary = async (
  eventId: number,
  signal?: AbortSignal
): Promise<GetEventSummaryResponse> => {
  const queryParams = new URLSearchParams({
    event_id: eventId.toString(),
  });
  const response = await makeRequest<GetEventSummaryResponse>(
    `/get_event_summary?${queryParams.toString()}`,
    'GET',
    undefined,
    undefined,
    undefined,
    signal
  );
  return response.data;
};

/**
 * Publish event (final step)
 * Updates event status to published
 * @param payload - Event ID payload
 * @returns Promise with updated event data
 */
export const publishEvent = async (
  payload: PublishEventRequest
): Promise<PublishEventResponse> => {
  const response = await makeRequest<PublishEventResponse>(
    '/publish_event',
    'POST',
    payload
  );
  return response.data;
};

/**
 * Get events list for Manage Events page
 * Retrieves paginated events with status, revenue, attendees, and thumbnail info
 * @param params - Optional filters for status, search, pagination
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise with events array and pagination metadata
 */
export const getEventsList = async (
  params: GetEventsListRequest,
  signal?: AbortSignal
): Promise<GetEventsListResponse> => {
  // Create URLSearchParams to store query parameters
  const queryParams = new URLSearchParams();
  // Append status filter if provided
  if (params.status) {
    // Store status filter inside query params
    queryParams.append('status', params.status);
  }
  // Append search keyword if provided
  if (params.search) {
    // Store search keyword for backend filtering
    queryParams.append('search', params.search);
  }
  // Append page number if provided
  if (params.page) {
    // Store page number as string value
    queryParams.append('page', params.page.toString());
  }
  // Append per_page value if provided
  if (params.per_page) {
    // Store records per page as string
    queryParams.append('per_page', params.per_page.toString());
  }
  // Build endpoint with serialized query string (skip '?' when empty)
  const endpoint = queryParams.toString()
    ? `/get_events_list?${queryParams.toString()}`
    : '/get_events_list';
  // Make GET request with optional abort signal
  const response = await makeRequest<GetEventsListResponse>(
    endpoint,
    'GET',
    undefined,
    undefined,
    undefined,
    signal
  );
  // Return parsed response data
  return response.data;
};

/**
 * Get event details
 * Retrieves comprehensive details for a single event, optimized for performance using eager loading
 * Returns all event information organized into header information, summary cards (registered count, revenue, ticket types, active coupons),
 * event overview content (description, media, tickets, artists, terms & conditions), and sidebar details (event dates/times, venue, social media, active coupons)
 * @param eventId - Event ID to retrieve details for (required, must exist in events table and belong to authenticated host user)
 * @param signal - Optional AbortSignal for request cancellation
 * @returns Promise with complete event details organized into sections
 */
export const getEventDetails = async (
  eventId: number,
  signal?: AbortSignal
): Promise<GetEventDetailsResponse> => {
  // Build query string with event_id parameter
  const queryParams = new URLSearchParams({
    event_id: eventId.toString(),
  });
  // Make GET request to get event details endpoint
  // Base URL already includes /api/v1, so endpoint should not include /v1 prefix
  const response = await makeRequest<GetEventDetailsResponse>(
    `/get_event_details?${queryParams.toString()}`,
    'GET',
    undefined,
    undefined,
    undefined,
    signal
  );
  // Return response data
  return response.data;
};

