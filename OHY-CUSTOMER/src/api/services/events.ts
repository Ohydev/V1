import { api } from "../client";
import { endpoints } from "../endpoints";
import { ApiResponse, EventCategoriesResponse, PublicEventDetailsResponse, PublicEventsListResponse } from "../types";

export async function getPublicEventsList(params?: Record<string, any>) {
	const { data } = await api.post<ApiResponse<PublicEventsListResponse>>(endpoints.getPublicEventsList, params ?? {});
	if (data.success) return data.data;
	throw new Error("Unexpected response shape");
}

export async function getPublicEventDetails(params: { event_id: number }) {
	const { data } = await api.get<ApiResponse<PublicEventDetailsResponse>>(endpoints.getPublicEventDetails, { params });
	if (data.success) return data.data;
	throw new Error("Unexpected response shape");
}

export async function getEventCategories() {
	const { data } = await api.get<ApiResponse<EventCategoriesResponse>>(endpoints.getEventCategories);
	if (data.success) return data.data.categories;
	throw new Error("Unexpected response shape");
}


