import { useState, useEffect } from "react";
import { authStorage } from "@/api/storage";

/**
 * Custom hook to check if user is authenticated
 * @returns { isAuthenticated: boolean } - Whether the user has a valid token
 */
export function useAuth() {
	const [isAuthenticated, setIsAuthenticated] = useState(() => {
		const token = authStorage.getToken();
		return token !== null && token.length > 0;
	});

	useEffect(() => {
		// Check authentication status on mount and when storage changes
		const checkAuth = () => {
			const token = authStorage.getToken();
			setIsAuthenticated(token !== null && token.length > 0);
		};

		// Check on mount
		checkAuth();

		// Listen for storage changes (when token is set/cleared in other tabs)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === "ohy_token" || e.key === null) {
				checkAuth();
			}
		};

		window.addEventListener("storage", handleStorageChange);

		// Listen for custom logout event (when logout happens in same tab)
		const handleLogout = () => {
			checkAuth();
		};

		window.addEventListener("auth:logout", handleLogout);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener("auth:logout", handleLogout);
		};
	}, []);

	return { isAuthenticated };
}

