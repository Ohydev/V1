import { useQuery } from "@tanstack/react-query";
import { getPublicEventsList } from "../services/events";

export function usePublicEvents(params?: Record<string, any>) {
	return useQuery({
		queryKey: ["publicEvents", params],
		queryFn: () => getPublicEventsList(params)
	});
}


