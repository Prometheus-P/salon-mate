import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';
import { api, authApi, type AuthResponse } from '$lib/api';

export interface User {
	id: string;
	email: string;
	name: string;
}

interface AuthState {
	user: User | null;
	isLoading: boolean;
	isInitialized: boolean;
}

function createAuthStore() {
	const { subscribe, set, update } = writable<AuthState>({
		user: null,
		isLoading: false,
		isInitialized: false
	});

	const STORAGE_KEY = 'salonmate_tokens';

	function saveTokens(accessToken: string, refreshToken: string) {
		if (browser) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, refreshToken }));
		}
	}

	function loadTokens(): { accessToken: string; refreshToken: string } | null {
		if (browser) {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : null;
		}
		return null;
	}

	function clearTokens() {
		if (browser) {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	async function initialize() {
		const tokens = loadTokens();
		if (tokens) {
			api.setAccessToken(tokens.accessToken);
			try {
				const user = await authApi.me();
				set({ user, isLoading: false, isInitialized: true });
			} catch {
				// Token expired, try refresh
				try {
					const { accessToken } = await authApi.refresh(tokens.refreshToken);
					api.setAccessToken(accessToken);
					saveTokens(accessToken, tokens.refreshToken);
					const user = await authApi.me();
					set({ user, isLoading: false, isInitialized: true });
				} catch {
					clearTokens();
					api.setAccessToken(null);
					set({ user: null, isLoading: false, isInitialized: true });
				}
			}
		} else {
			set({ user: null, isLoading: false, isInitialized: true });
		}
	}

	async function login(email: string, password: string): Promise<void> {
		update((state) => ({ ...state, isLoading: true }));
		try {
			const response: AuthResponse = await authApi.login({ email, password });
			api.setAccessToken(response.accessToken);
			saveTokens(response.accessToken, response.refreshToken);
			set({ user: response.user, isLoading: false, isInitialized: true });
		} catch (error) {
			update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	}

	async function signup(email: string, password: string, name: string): Promise<void> {
		update((state) => ({ ...state, isLoading: true }));
		try {
			const response: AuthResponse = await authApi.signup({ email, password, name });
			api.setAccessToken(response.accessToken);
			saveTokens(response.accessToken, response.refreshToken);
			set({ user: response.user, isLoading: false, isInitialized: true });
		} catch (error) {
			update((state) => ({ ...state, isLoading: false }));
			throw error;
		}
	}

	async function logout(): Promise<void> {
		try {
			await authApi.logout();
		} catch {
			// Ignore logout errors
		}
		clearTokens();
		api.setAccessToken(null);
		set({ user: null, isLoading: false, isInitialized: true });
	}

	return {
		subscribe,
		initialize,
		login,
		signup,
		logout
	};
}

export const auth = createAuthStore();
export const isAuthenticated = derived(auth, ($auth) => $auth.user !== null);
export const currentUser = derived(auth, ($auth) => $auth.user);
