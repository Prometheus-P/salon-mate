import { env } from '$lib/env';

export interface ApiError {
	message: string;
	code?: string;
	status: number;
}

export class ApiClient {
	private baseUrl: string;
	private accessToken: string | null = null;

	constructor(baseUrl?: string) {
		this.baseUrl = baseUrl || env.apiUrl;
	}

	setAccessToken(token: string | null) {
		this.accessToken = token;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<T> {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			...((options.headers as Record<string, string>) || {})
		};

		if (this.accessToken) {
			headers['Authorization'] = `Bearer ${this.accessToken}`;
		}

		const response = await fetch(`${this.baseUrl}${endpoint}`, {
			...options,
			headers
		});

		if (!response.ok) {
			const error: ApiError = {
				message: 'An error occurred',
				status: response.status
			};

			try {
				const body = await response.json();
				error.message = body.message || body.error || error.message;
				error.code = body.code;
			} catch {
				// Ignore JSON parse errors
			}

			throw error;
		}

		// Handle 204 No Content
		if (response.status === 204) {
			return {} as T;
		}

		return response.json();
	}

	async get<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: 'GET' });
	}

	async post<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	async put<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PUT',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	async patch<T>(endpoint: string, data?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: data ? JSON.stringify(data) : undefined
		});
	}

	async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: 'DELETE' });
	}
}

export const api = new ApiClient();
