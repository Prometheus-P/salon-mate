/**
 * Posts API client functions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============== Types ==============

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';

export interface Post {
  id: string;
  shopId: string;
  instagramPostId: string | null;
  status: PostStatus;
  imageUrl: string;
  caption: string | null;
  captionSnippet: string;
  hashtags: string[];
  scheduledAt: string | null;
  publishedAt: string | null;
  likesCount: number;
  commentsCount: number;
  reachCount: number;
  engagementScore: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
}

export interface PostStatsResponse {
  totalPosts: number;
  draftCount: number;
  scheduledCount: number;
  publishedCount: number;
  failedCount: number;
}

export interface PostCreateRequest {
  imageUrl: string;
  caption?: string;
  hashtags?: string[];
  scheduledAt?: string;
}

export interface PostUpdateRequest {
  imageUrl?: string;
  caption?: string;
  hashtags?: string[];
  scheduledAt?: string;
  status?: PostStatus;
}

export interface AICaptionRequest {
  prompt: string;
  tone?: 'friendly' | 'professional' | 'trendy' | 'emotional';
  length?: 'short' | 'medium' | 'long';
  includeCta?: boolean;
  includeEmoji?: boolean;
  language?: 'ko' | 'en' | 'mixed';
}

export interface AICaptionResponse {
  caption: string;
  hashtags: string[];
  generatedAt: string;
}

export type AIContentType = 'image' | 'reels' | 'caption' | 'story';
export type AITone = 'professional' | 'trendy' | 'emotional' | 'humorous';
export type AIMood = 'bright' | 'calm' | 'luxury' | 'casual';
export type AIColorScheme = 'warm' | 'cool' | 'monochrome' | 'vivid';

export interface AIImageRequest {
  prompt: string;
  contentType: AIContentType;
  tone?: AITone;
  mood?: AIMood;
  colorScheme?: AIColorScheme;
  count?: number;
}

export interface AIGeneratedImage {
  id: string;
  url: string;
  prompt: string;
  generatedAt: string;
}

export interface AIImageResponse {
  images: AIGeneratedImage[];
  suggestedCaption: string;
  suggestedHashtags: string[];
}

export interface HashtagRecommendation {
  industry: string[];
  location: string[];
  trending: string[];
  aiRecommended: string[];
}

export interface OptimalTime {
  day: string;
  time: string;
  reason: string;
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
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============== API Functions ==============

export async function getPosts(
  shopId: string,
  params: { status?: PostStatus; limit?: number; offset?: number } = {}
): Promise<PostListResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  return fetchWithAuth<PostListResponse>(
    `${API_BASE_URL}/shops/${shopId}/posts${queryString ? `?${queryString}` : ''}`
  );
}

export async function getPostById(shopId: string, postId: string): Promise<Post> {
  return fetchWithAuth<Post>(`${API_BASE_URL}/shops/${shopId}/posts/${postId}`);
}

export async function getPostStats(shopId: string): Promise<PostStatsResponse> {
  return fetchWithAuth<PostStatsResponse>(`${API_BASE_URL}/shops/${shopId}/posts/stats`);
}

export async function createPost(shopId: string, data: PostCreateRequest): Promise<Post> {
  return fetchWithAuth<Post>(`${API_BASE_URL}/shops/${shopId}/posts`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePost(
  shopId: string,
  postId: string,
  data: PostUpdateRequest
): Promise<Post> {
  return fetchWithAuth<Post>(`${API_BASE_URL}/shops/${shopId}/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deletePost(shopId: string, postId: string): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/shops/${shopId}/posts/${postId}`, {
    method: 'DELETE',
  });
}

export async function publishPost(shopId: string, postId: string): Promise<Post> {
  return fetchWithAuth<Post>(`${API_BASE_URL}/shops/${shopId}/posts/${postId}/publish`, {
    method: 'POST',
  });
}

export async function duplicatePost(shopId: string, postId: string): Promise<Post> {
  return fetchWithAuth<Post>(`${API_BASE_URL}/shops/${shopId}/posts/${postId}/duplicate`, {
    method: 'POST',
  });
}

export async function generateAICaption(
  shopId: string,
  request: AICaptionRequest
): Promise<AICaptionResponse> {
  return fetchWithAuth<AICaptionResponse>(
    `${API_BASE_URL}/shops/${shopId}/posts/ai/generate-caption`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}

export async function getRecommendedHashtags(shopId: string): Promise<HashtagRecommendation> {
  return fetchWithAuth<HashtagRecommendation>(
    `${API_BASE_URL}/shops/${shopId}/posts/ai/recommend-hashtags`
  );
}

export async function getOptimalTimes(shopId: string): Promise<{ times: OptimalTime[] }> {
  return fetchWithAuth<{ times: OptimalTime[] }>(
    `${API_BASE_URL}/shops/${shopId}/posts/optimal-times`
  );
}

export async function generateAIImage(
  shopId: string,
  request: AIImageRequest
): Promise<AIImageResponse> {
  return fetchWithAuth<AIImageResponse>(
    `${API_BASE_URL}/shops/${shopId}/posts/ai/generate-image`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );
}
