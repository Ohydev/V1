/**
 * Support Service
 * Handles support request submission for hosts
 */

import { makeRequest } from "./apiClient";

export interface SubmitSupportRequestPayload {
  title: string;
  description: string;
}

export interface SubmitSupportRequestResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

/**
 * Submit a support request (e.g. from Help page)
 * API Endpoint: POST /submit_support_request
 *
 * @param data - Support request with title and description
 * @returns Promise with submit support request response
 * @throws AxiosError if request fails
 */
export const submitSupportRequest = async (
  data: SubmitSupportRequestPayload
): Promise<SubmitSupportRequestResponse> => {
  const response = await makeRequest<SubmitSupportRequestResponse>(
    "/submit_support_request",
    "POST",
    data
  );
  return response.data;
};
