const TOKEN_KEY = "ohy_token";

export const authStorage = {
	getToken(): string | null {
		return localStorage.getItem(TOKEN_KEY);
	},
	setToken(token: string) {
		localStorage.setItem(TOKEN_KEY, token);
	},
	clear() {
		localStorage.removeItem(TOKEN_KEY);
	}
};


