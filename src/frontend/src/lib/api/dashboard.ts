/**
 * Dashboard API client functions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============== Types ==============

export interface PlatformStats {
  total_reviews: number;
  average_rating: number;
  response_rate: number;
}

export interface ReviewStatsResponse {
  total_reviews: number;
  average_rating: number;
  response_rate: number;
  pending_count: number;
  by_platform: Record<string, PlatformStats>;
  last_synced_at: string;
}

export interface PostSummary {
  id: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  image_url: string;
  caption_snippet: string | null;
  scheduled_at: string | null;
  published_at: string | null;
}

export interface CalendarEntry {
  date: string;
  posts: PostSummary[];
}

export interface CalendarResponse {
  start_date: string;
  end_date: string;
  entries: CalendarEntry[];
  last_synced_at: string;
}

export interface TopPost {
  id: string;
  image_url: string;
  likes_count: number;
  comments_count: number;
  reach_count: number;
  engagement_score: number;
}

export interface EngagementResponse {
  total_likes: number;
  total_comments: number;
  total_reach: number;
  top_posts: TopPost[];
  last_synced_at: string;
}

export interface TrendDataPoint {
  date: string;
  review_count: number;
  average_rating: number;
  response_rate: number;
}

export interface TrendResponse {
  period: 'week' | 'month' | 'year';
  data_points: TrendDataPoint[];
}

export interface PendingReview {
  id: string;
  reviewer_name: string;
  reviewer_profile_url: string | null;
  rating: number;
  content: string | null;
  review_date: string;
  platform: 'google' | 'naver';
  ai_response: string | null;
}

export interface PendingReviewsResponse {
  reviews: PendingReview[];
  total_pending: number;
}

export interface GeneratedResponseResult {
  review_id: string;
  ai_response: string;
  generated_at: string;
}

export interface PublishResponseResult {
  review_id: string;
  status: string;
  replied_at: string;
}

export interface ShopSummary {
  id: string;
  name: string;
  type: string;
  has_reviews: boolean;
  has_posts: boolean;
}

export interface ShopsListResponse {
  shops: ShopSummary[];
}

// Agency Mode: Shops with Stats
export interface ShopWithStats {
  id: string;
  name: string;
  type: string;
  pendingCount: number;
}

export interface ShopsWithStatsResponse {
  shops: ShopWithStats[];
  totalPending: number;
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
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============== API Functions ==============

export async function getReviewStats(shopId: string): Promise<ReviewStatsResponse> {
  return fetchWithAuth<ReviewStatsResponse>(
    `${API_BASE_URL}/dashboard/${shopId}/stats`
  );
}

export async function getPostingCalendar(
  shopId: string,
  startDate: string,
  endDate: string,
  view: 'week' | 'month' = 'month'
): Promise<CalendarResponse> {
  const params = new URLSearchParams({
    start_date: startDate,
    end_date: endDate,
    view,
  });
  return fetchWithAuth<CalendarResponse>(
    `${API_BASE_URL}/dashboard/${shopId}/calendar?${params}`
  );
}

export async function getEngagementMetrics(shopId: string): Promise<EngagementResponse> {
  return fetchWithAuth<EngagementResponse>(
    `${API_BASE_URL}/dashboard/${shopId}/engagement`
  );
}

export async function getTrendData(
  shopId: string,
  period: 'week' | 'month' | 'year'
): Promise<TrendResponse> {
  const params = new URLSearchParams({ period });
  return fetchWithAuth<TrendResponse>(
    `${API_BASE_URL}/dashboard/${shopId}/trends?${params}`
  );
}

export async function getPendingReviews(
  shopId: string,
  limit: number = 10
): Promise<PendingReviewsResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  return fetchWithAuth<PendingReviewsResponse>(
    `${API_BASE_URL}/dashboard/${shopId}/pending-reviews?${params}`
  );
}

export async function generateAIResponse(
  shopId: string,
  reviewId: string
): Promise<GeneratedResponseResult> {
  return fetchWithAuth<GeneratedResponseResult>(
    `${API_BASE_URL}/dashboard/${shopId}/reviews/${reviewId}/generate-response`,
    { method: 'POST' }
  );
}

export async function publishResponse(
  shopId: string,
  reviewId: string,
  finalResponse: string
): Promise<PublishResponseResult> {
  return fetchWithAuth<PublishResponseResult>(
    `${API_BASE_URL}/dashboard/${shopId}/reviews/${reviewId}/publish-response`,
    {
      method: 'POST',
      body: JSON.stringify({ final_response: finalResponse }),
    }
  );
}

export async function getUserShops(): Promise<ShopsListResponse> {
  return fetchWithAuth<ShopsListResponse>(`${API_BASE_URL}/shops`);
}

export async function getShopsWithStats(): Promise<ShopsWithStatsResponse> {
  return fetchWithAuth<ShopsWithStatsResponse>(`${API_BASE_URL}/shops/with-stats`);
}

// ============== Global Inbox (Agency Mode) ==============

export interface InboxReviewItem {
  id: string;
  shopId: string;
  shopName: string;
  reviewerName: string;
  reviewerProfileUrl: string | null;
  rating: number;
  content: string | null;
  reviewDate: string;
  status: string;
  aiResponse: string | null;
  aiResponseGeneratedAt: string | null;
  platform: string;
  createdAt: string;
}

export interface GlobalInboxResponse {
  totalPending: number;
  reviews: InboxReviewItem[];
}

export interface BulkApproveRequest {
  reviewIds: string[];
  customSuffix?: string;
}

export interface BulkApproveResponse {
  successCount: number;
  failedCount: number;
  failedIds: string[];
}

export async function getGlobalInbox(
  limit: number = 50,
  offset: number = 0
): Promise<GlobalInboxResponse> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  return fetchWithAuth<GlobalInboxResponse>(`${API_BASE_URL}/inbox?${params}`);
}

export async function bulkApproveReviews(
  request: BulkApproveRequest
): Promise<BulkApproveResponse> {
  return fetchWithAuth<BulkApproveResponse>(`${API_BASE_URL}/inbox/bulk-approve`, {
    method: 'POST',
    body: JSON.stringify({
      review_ids: request.reviewIds,
      custom_suffix: request.customSuffix,
    }),
  });
}
