export type ApiErrorShape = {
	status: number;
	code: string;
	message: string | Record<string, string[]>;
	raw?: unknown;
};

export class ApiError extends Error {
	status: number;
	code: string;
	details?: unknown;
	constructor(e: ApiErrorShape) {
		super(typeof e.message === "string" ? e.message : "Validation error");
		this.name = "ApiError";
		this.status = e.status;
		this.code = e.code;
		this.details = e.message;
	}
}

export function normalizeApiError(err: any): ApiError {
	const status: number = err?.response?.status ?? 500;
	const payload = err?.response?.data;

	if (payload && payload.success === false && payload.error) {
		return new ApiError({
			status,
			code: payload.error.error_code ?? "E500",
			message: payload.error.error_message ?? "An error occurred",
			raw: payload
		});
	}

	return new ApiError({
		status,
		code: status === 401 ? "E003" : "E500",
		message: err?.message ?? "An error occurred",
		raw: err
	});
}


