import { PUBLIC_API_URL, PUBLIC_APP_NAME } from '$env/static/public';

export const env = {
	apiUrl: PUBLIC_API_URL || 'http://localhost:8080',
	appName: PUBLIC_APP_NAME || 'SalonMate'
} as const;
