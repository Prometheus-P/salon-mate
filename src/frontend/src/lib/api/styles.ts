/**
 * Styles API client functions
 * 스타일북 - Vision AI 기반 시술 사진 분석 및 관리
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============== Types ==============

export interface StyleTag {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  service_type: string | null;
  style_category: string | null;
  season_trend: string | null;
  dominant_colors: string[];
  technique_tags: string[];
  mood_tags: string[];
  ai_description: string | null;
  suggested_hashtags: string[];
  confidence_score: number | null;
  analyzed_at: string | null;
  created_at: string;
}

export interface StyleTagListResponse {
  style_tags: StyleTag[];
  total: number;
  limit: number;
  offset: number;
}

export interface StyleStatistics {
  total_count: number;
  by_service_type: Record<string, number>;
  by_style_category: Record<string, number>;
}

export interface ContentSuggestion {
  caption: string;
  hashtags: string[];
}

export interface AnalyzeImageRequest {
  image_url: string;
  thumbnail_url?: string;
}

export interface AnalyzeBase64Request {
  image_data: string;
  image_format?: string;
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

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ============== API Functions ==============

/**
 * 이미지 분석 및 스타일 태그 생성
 */
export async function analyzeImage(
  shopId: string,
  data: AnalyzeImageRequest
): Promise<StyleTag> {
  return fetchWithAuth<StyleTag>(
    `${API_BASE_URL}/shops/${shopId}/styles`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

/**
 * Base64 이미지 분석
 */
export async function analyzeBase64Image(
  shopId: string,
  data: AnalyzeBase64Request
): Promise<StyleTag> {
  return fetchWithAuth<StyleTag>(
    `${API_BASE_URL}/shops/${shopId}/styles/analyze-base64`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

/**
 * 스타일 태그 목록 조회
 */
export async function getStyleTags(
  shopId: string,
  options?: {
    serviceType?: string;
    styleCategory?: string;
    limit?: number;
    offset?: number;
  }
): Promise<StyleTagListResponse> {
  const params = new URLSearchParams();
  if (options?.serviceType) params.set('service_type', options.serviceType);
  if (options?.styleCategory) params.set('style_category', options.styleCategory);
  if (options?.limit) params.set('limit', options.limit.toString());
  if (options?.offset) params.set('offset', options.offset.toString());

  const queryString = params.toString();
  return fetchWithAuth<StyleTagListResponse>(
    `${API_BASE_URL}/shops/${shopId}/styles${queryString ? `?${queryString}` : ''}`
  );
}

/**
 * 스타일 통계 조회
 */
export async function getStyleStatistics(shopId: string): Promise<StyleStatistics> {
  return fetchWithAuth<StyleStatistics>(
    `${API_BASE_URL}/shops/${shopId}/styles/statistics`
  );
}

/**
 * 특정 스타일 태그 조회
 */
export async function getStyleTag(shopId: string, styleTagId: string): Promise<StyleTag> {
  return fetchWithAuth<StyleTag>(
    `${API_BASE_URL}/shops/${shopId}/styles/${styleTagId}`
  );
}

/**
 * 스타일 기반 콘텐츠 제안
 */
export async function getContentSuggestion(
  shopId: string,
  styleTagId: string
): Promise<ContentSuggestion> {
  return fetchWithAuth<ContentSuggestion>(
    `${API_BASE_URL}/shops/${shopId}/styles/${styleTagId}/suggest`
  );
}

/**
 * 스타일 태그 삭제
 */
export async function deleteStyleTag(shopId: string, styleTagId: string): Promise<void> {
  await fetchWithAuth<void>(
    `${API_BASE_URL}/shops/${shopId}/styles/${styleTagId}`,
    { method: 'DELETE' }
  );
}
