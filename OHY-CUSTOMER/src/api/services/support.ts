import { api } from "../client";
import { endpoints } from "../endpoints";
import { ApiResponse } from "../types";
import { ApiError } from "../errors";

export interface SubmitSupportRequestBody {
	title: string;
	description: string;
}

export async function submitSupportRequest(body: SubmitSupportRequestBody) {
	const { data } = await api.post<ApiResponse<{ message?: string }>>(endpoints.submitSupportRequest, body);
	if (data.success) return;
	if (!data.success && "error" in data) {
		const err = data.error;
		throw new ApiError({
			status: 400,
			code: err.error_code ?? "E500",
			message: typeof err.error_message === "string" ? err.error_message : "Support request submission failed"
		});
	}
	throw new Error("Unexpected response shape");
}
