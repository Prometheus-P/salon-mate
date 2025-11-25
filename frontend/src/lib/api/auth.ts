import { api } from './client';
import { z } from 'zod';

// Request/Response schemas
export const LoginRequestSchema = z.object({
	email: z.string().email('올바른 이메일을 입력하세요'),
	password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다')
});

export const SignupRequestSchema = z.object({
	email: z.string().email('올바른 이메일을 입력하세요'),
	password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
	name: z.string().min(1, '이름을 입력하세요')
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export interface AuthResponse {
	user: {
		id: string;
		email: string;
		name: string;
	};
	accessToken: string;
	refreshToken: string;
}

export interface RefreshResponse {
	accessToken: string;
}

export const authApi = {
	async login(data: LoginRequest): Promise<AuthResponse> {
		return api.post<AuthResponse>('/api/v1/auth/login', data);
	},

	async signup(data: SignupRequest): Promise<AuthResponse> {
		return api.post<AuthResponse>('/api/v1/auth/signup', data);
	},

	async logout(): Promise<void> {
		return api.post('/api/v1/auth/logout');
	},

	async refresh(refreshToken: string): Promise<RefreshResponse> {
		return api.post<RefreshResponse>('/api/v1/auth/refresh', { refreshToken });
	},

	async me(): Promise<AuthResponse['user']> {
		return api.get<AuthResponse['user']>('/api/v1/auth/me');
	}
};
