import { useQuery } from "@tanstack/react-query";
import { getPublicEventDetails } from "../services/events";
import type { PublicEventDetailsResponse } from "../types";

export function usePublicEventDetails(eventId: number | undefined) {
	return useQuery<PublicEventDetailsResponse>({
		queryKey: ["publicEventDetails", eventId],
		queryFn: () => getPublicEventDetails({ event_id: eventId! }),
		enabled: !!eventId && eventId > 0,
	});
}

