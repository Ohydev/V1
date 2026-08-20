/**
 * Feedback Service
 * Handles feedback submission for authenticated users
 */

import { makeRequest } from "./apiClient";

export interface SubmitFeedbackRequest {
  title: string;
  description: string;
}

export interface SubmitFeedbackResponse {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

/**
 * Submit user feedback
 * API Endpoint: POST /submit_feedback
 *
 * @param data - Feedback data with title and description
 * @returns Promise with submit feedback response
 * @throws AxiosError if request fails
 */
export const submitFeedback = async (
  data: SubmitFeedbackRequest
): Promise<SubmitFeedbackResponse> => {
  const response = await makeRequest<SubmitFeedbackResponse>(
    "/submit_feedback",
    "POST",
    data
  );
  return response.data;
};
