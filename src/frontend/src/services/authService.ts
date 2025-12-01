import { api } from '@/lib/api';
import {
  AuthResponse,
  SignupRequest,
  LoginRequest,
  RefreshTokenRequest,
  AccessTokenResponse,
  OAuthURLResponse,
  OAuthProvidersResponse,
} from '@/types/auth';

export const authService = {
  async signup(data: SignupRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/signup', data);
  },

  async login(data: LoginRequest): Promise<AuthResponse> {
    return api.post<AuthResponse>('/auth/login', data);
  },

  async refreshToken(data: RefreshTokenRequest): Promise<AccessTokenResponse> {
    return api.post<AccessTokenResponse>('/auth/refresh', data);
  },

  async logout(): Promise<{ message: string }> {
    return api.post<{ message: string }>('/auth/logout');
  },

  async getOAuthProviders(): Promise<OAuthProvidersResponse> {
    return api.get<OAuthProvidersResponse>('/auth/oauth/providers');
  },

  async getOAuthURL(provider: string): Promise<OAuthURLResponse> {
    return api.get<OAuthURLResponse>(`/auth/oauth/${provider}`);
  },

  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string
  ): Promise<AuthResponse> {
    return api.post<AuthResponse>(`/auth/oauth/${provider}/callback`, {
      code,
      state,
    });
  },
};
