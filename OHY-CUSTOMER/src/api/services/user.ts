import { api } from "../client";
import { endpoints } from "../endpoints";
import { ApiResponse } from "../types";

export async function getUserProfile() {
	const { data } = await api.get<ApiResponse<{ message: string; user_profile: any }>>(endpoints.getUserProfile);
	if (data.success) return data.data;
	throw new Error("Unexpected response shape");
}

export async function updateUserProfile(formData: FormData) {
	// FormData automatically sets Content-Type to multipart/form-data with boundary
	// Axios will detect FormData and set the correct Content-Type with boundary
	// We need to override the default 'application/json' header from the axios instance
	const { data } = await api.post<ApiResponse<{ message: string; user_profile: any }>>(
		endpoints.updateUserProfile,
		formData,
		{
			headers: {
				// Don't set Content-Type - let axios/browser set it automatically with boundary for FormData
				// This overrides the default 'application/json' from the axios instance
			},
			transformRequest: [
				(data, headers) => {
					// Remove Content-Type header to let browser set it with boundary for FormData
					if (headers) {
						delete headers['Content-Type'];
					}
					return data;
				},
			],
		}
	);
	
	// Log API response
	console.log('updateUserProfile - Raw API Response:', data);
	
	if (data.success) {
		console.log('updateUserProfile - Success response data:', data.data);
		return data.data;
	}
	
	console.error('updateUserProfile - Unexpected response shape:', data);
	throw new Error("Unexpected response shape");
}

export async function updateUserPassword(body: any) {
	const { data } = await api.post<ApiResponse<{ message: string }>>(endpoints.updateUserPassword, body);
	if (data.success) return data.data;
	throw new Error("Unexpected response shape");
}


