import { api } from "../client";
import { endpoints } from "../endpoints";
import { ApiResponse } from "../types";
import { ApiError } from "../errors";

export interface SubmitReportRequest {
	event_id?: number;
	host_user_id?: number;
	order_id?: number;
	title: string;
	description?: string;
	priority: "low" | "medium" | "high";
}

export interface SubmitReportResponse {
	message: string;
	report_id: number;
}

export async function submitReport(body: SubmitReportRequest) {
	const { data } = await api.post<ApiResponse<SubmitReportResponse>>(endpoints.submitReport, body);
	if (data.success && "data" in data && data.data) return data.data;
	if (!data.success && "error" in data) {
		const err = data.error;
		throw new ApiError({
			status: 400,
			code: err.error_code ?? "E500",
			message: typeof err.error_message === "string" ? err.error_message : "Report submission failed"
		});
	}
	throw new Error("Unexpected response shape");
}
