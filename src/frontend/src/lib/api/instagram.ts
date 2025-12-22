/**
 * Instagram API client functions
 * Instagram Business 계정 연동 및 포스트 발행
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============== Types ==============

export interface InstagramConnectionStatus {
  connected: boolean;
  username: string | null;
  profile_picture_url: string | null;
  expires_at: string | null;
}

export interface InstagramOAuthStart {
  oauth_url: string;
}

// ============== Helper ==============

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============== API Functions ==============

/**
 * Instagram OAuth 인증 시작
 * 반환된 oauth_url로 사용자를 리다이렉트합니다.
 */
export async function startInstagramOAuth(redirectUri: string): Promise<InstagramOAuthStart> {
  const params = new URLSearchParams({ redirect_uri: redirectUri });
  return fetchWithAuth<InstagramOAuthStart>(
    `${API_BASE_URL}/instagram/oauth/start?${params}`
  );
}

/**
 * 현재 사용자의 Instagram 연결 상태 조회
 */
export async function getInstagramStatus(): Promise<InstagramConnectionStatus> {
  return fetchWithAuth<InstagramConnectionStatus>(
    `${API_BASE_URL}/instagram/status`
  );
}

/**
 * 특정 Shop의 Instagram 연결 상태 조회
 */
export async function getShopInstagramStatus(shopId: string): Promise<InstagramConnectionStatus> {
  return fetchWithAuth<InstagramConnectionStatus>(
    `${API_BASE_URL}/instagram/shop/${shopId}/status`
  );
}

/**
 * Instagram 연결 해제
 */
export async function disconnectInstagram(): Promise<{ success: boolean }> {
  return fetchWithAuth<{ success: boolean }>(
    `${API_BASE_URL}/instagram/disconnect`,
    { method: 'DELETE' }
  );
}
