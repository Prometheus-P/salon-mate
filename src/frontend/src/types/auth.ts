// 인증 관련 타입

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  shopName?: string;
  shopType?: 'nail' | 'hair' | 'skin' | 'lash';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AccessTokenResponse {
  accessToken: string;
  expiresIn: number;
}

export interface OAuthURLResponse {
  authUrl: string;
}

export interface OAuthProvidersResponse {
  providers: string[];
}
