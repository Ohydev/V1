import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "../services/user";

export function useUserProfile() {
	return useQuery({
		queryKey: ["userProfile"],
		queryFn: () => getUserProfile(),
	});
}

