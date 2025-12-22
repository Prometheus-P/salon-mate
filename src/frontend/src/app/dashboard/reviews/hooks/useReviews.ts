'use client';

/**
 * TanStack Query hooks for reviews data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReviews,
  getReviewById,
  updateReview,
  generateAIResponse,
  getReviewAnalytics,
  exportReviews,
  type Review,
  type ReviewListResponse,
  type ReviewListParams,
  type ReviewAnalyticsResponse,
  type ReviewExportItem,
  type AIResponseResult,
  type ReviewUpdateRequest,
  type AIResponseRequest,
} from '@/lib/api/reviews';

// ============== Query Keys ==============

export const reviewKeys = {
  all: ['reviews'] as const,
  lists: () => [...reviewKeys.all, 'list'] as const,
  list: (shopId: string, params?: ReviewListParams) =>
    [...reviewKeys.lists(), shopId, params] as const,
  details: () => [...reviewKeys.all, 'detail'] as const,
  detail: (shopId: string, reviewId: string) =>
    [...reviewKeys.details(), shopId, reviewId] as const,
  analytics: (shopId: string, period: string) =>
    [...reviewKeys.all, 'analytics', shopId, period] as const,
  export: (shopId: string) => [...reviewKeys.all, 'export', shopId] as const,
};

// ============== Review List ==============

export function useReviews(shopId: string | null, params: ReviewListParams = {}) {
  return useQuery<ReviewListResponse>({
    queryKey: reviewKeys.list(shopId ?? '', params),
    queryFn: () => getReviews(shopId!, params),
    enabled: !!shopId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============== Review Detail ==============

export function useReviewDetail(shopId: string | null, reviewId: string | null) {
  return useQuery<Review>({
    queryKey: reviewKeys.detail(shopId ?? '', reviewId ?? ''),
    queryFn: () => getReviewById(shopId!, reviewId!),
    enabled: !!shopId && !!reviewId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============== Update Review ==============

export function useUpdateReview(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<Review, Error, { reviewId: string; data: ReviewUpdateRequest }>({
    mutationFn: ({ reviewId, data }) => updateReview(shopId, reviewId, data),
    onSuccess: (updatedReview) => {
      // Update the detail cache
      queryClient.setQueryData(
        reviewKeys.detail(shopId, updatedReview.id),
        updatedReview
      );
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: reviewKeys.lists() });
    },
  });
}

// ============== Generate AI Response ==============

export function useGenerateAIResponse(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    AIResponseResult,
    Error,
    { reviewId: string; options?: AIResponseRequest }
  >({
    mutationFn: ({ reviewId, options }) => generateAIResponse(shopId, reviewId, options),
    onSuccess: (_result, variables) => {
      // Invalidate review detail to refresh with new AI response
      queryClient.invalidateQueries({
        queryKey: reviewKeys.detail(shopId, variables.reviewId),
      });
    },
  });
}

// ============== Review Analytics ==============

export function useReviewAnalytics(
  shopId: string | null,
  period: 'week' | 'month' | 'year' = 'month'
) {
  return useQuery<ReviewAnalyticsResponse>({
    queryKey: reviewKeys.analytics(shopId ?? '', period),
    queryFn: () => getReviewAnalytics(shopId!, period),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============== Export Reviews ==============

export function useExportReviews(shopId: string) {
  return useMutation<
    ReviewExportItem[],
    Error,
    { status?: string; dateFrom?: string; dateTo?: string }
  >({
    mutationFn: (params) =>
      exportReviews(shopId, params as Parameters<typeof exportReviews>[1]),
  });
}

// Re-export types for convenience
export type { Review, ReviewListResponse, ReviewListParams, ReviewAnalyticsResponse };
