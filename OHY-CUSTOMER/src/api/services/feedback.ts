import { api } from "../client";
import { endpoints } from "../endpoints";
import { ApiResponse } from "../types";
import { ApiError } from "../errors";

export interface SubmitFeedbackRequest {
	title: string;
	description: string;
}

export async function submitFeedback(body: SubmitFeedbackRequest) {
	const { data } = await api.post<ApiResponse<{ message?: string }>>(endpoints.submitFeedback, body);
	if (data.success) return;
	if (!data.success && "error" in data) {
		const err = data.error;
		throw new ApiError({
			status: 400,
			code: err.error_code ?? "E500",
			message: typeof err.error_message === "string" ? err.error_message : "Feedback submission failed"
		});
	}
	throw new Error("Unexpected response shape");
}
