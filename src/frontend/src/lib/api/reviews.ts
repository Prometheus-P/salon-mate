/**
 * Reviews API client functions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============== Types ==============

export type ReviewStatus = 'pending' | 'replied' | 'ignored';
export type Platform = 'google' | 'naver' | 'kakao';

export interface Review {
  id: string;
  shopId: string;
  reviewerName: string;
  reviewerProfileUrl: string | null;
  rating: number;
  content: string | null;
  reviewDate: string;
  status: ReviewStatus;
  aiResponse: string | null;
  aiResponseGeneratedAt: string | null;
  finalResponse: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
}

export interface ReviewListParams {
  status?: ReviewStatus;
  platform?: Platform[];
  ratingMin?: number;
  ratingMax?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  sort?: 'created_at' | 'rating' | 'review_date';
  order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface MetricComparison {
  current: number;
  previous: number;
  changePercent: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percent: number;
}

export interface PlatformDistribution {
  platform: string;
  count: number;
  percent: number;
}

export interface TrendDataPoint {
  date: string;
  reviewCount: number;
  averageRating: number;
}

export interface KeywordFrequency {
  keyword: string;
  count: number;
}

export interface SentimentAnalysis {
  positive: number;
  neutral: number;
  negative: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
}

export interface ReviewAnalyticsResponse {
  totalReviews: MetricComparison;
  averageRating: MetricComparison;
  responseRate: MetricComparison;
  ratingDistribution: RatingDistribution[];
  platformDistribution: PlatformDistribution[];
  trendData: TrendDataPoint[];
  keywords: KeywordFrequency[];
  sentiment: SentimentAnalysis;
}

export interface ReviewExportItem {
  id: string;
  reviewerName: string;
  rating: number;
  content: string | null;
  reviewDate: string;
  status: string;
  platform: string;
  response: string | null;
  respondedAt: string | null;
}

export interface ReviewUpdateRequest {
  status?: ReviewStatus;
  finalResponse?: string;
}

export interface AIResponseRequest {
  tone?: 'friendly' | 'formal' | 'casual';
  includeShopName?: boolean;
  maxLength?: number;
}

export interface AIResponseResult {
  aiResponse: string;
  generatedAt: string;
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

export async function getReviews(
  shopId: string,
  params: ReviewListParams = {}
): Promise<ReviewListResponse> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.ratingMin) searchParams.set('rating_min', params.ratingMin.toString());
  if (params.ratingMax) searchParams.set('rating_max', params.ratingMax.toString());
  if (params.dateFrom) searchParams.set('date_from', params.dateFrom);
  if (params.dateTo) searchParams.set('date_to', params.dateTo);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.order) searchParams.set('order', params.order);
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  return fetchWithAuth<ReviewListResponse>(
    `${API_BASE_URL}/shops/${shopId}/reviews${queryString ? `?${queryString}` : ''}`
  );
}

export async function getReviewById(shopId: string, reviewId: string): Promise<Review> {
  return fetchWithAuth<Review>(`${API_BASE_URL}/shops/${shopId}/reviews/${reviewId}`);
}

export async function updateReview(
  shopId: string,
  reviewId: string,
  data: ReviewUpdateRequest
): Promise<Review> {
  return fetchWithAuth<Review>(`${API_BASE_URL}/shops/${shopId}/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function generateAIResponse(
  shopId: string,
  reviewId: string,
  options?: AIResponseRequest
): Promise<AIResponseResult> {
  return fetchWithAuth<AIResponseResult>(
    `${API_BASE_URL}/shops/${shopId}/reviews/${reviewId}/ai-response`,
    {
      method: 'POST',
      body: JSON.stringify(options || {}),
    }
  );
}

export async function getReviewAnalytics(
  shopId: string,
  period: 'week' | 'month' | 'year' = 'month'
): Promise<ReviewAnalyticsResponse> {
  const params = new URLSearchParams({ period });
  return fetchWithAuth<ReviewAnalyticsResponse>(
    `${API_BASE_URL}/shops/${shopId}/reviews/analytics?${params}`
  );
}

export async function exportReviews(
  shopId: string,
  params: {
    status?: ReviewStatus;
    dateFrom?: string;
    dateTo?: string;
  } = {}
): Promise<ReviewExportItem[]> {
  const searchParams = new URLSearchParams();

  if (params.status) searchParams.set('status', params.status);
  if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
  if (params.dateTo) searchParams.set('dateTo', params.dateTo);

  const queryString = searchParams.toString();
  return fetchWithAuth<ReviewExportItem[]>(
    `${API_BASE_URL}/shops/${shopId}/reviews/export${queryString ? `?${queryString}` : ''}`
  );
}
