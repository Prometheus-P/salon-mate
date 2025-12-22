'use client';

/**
 * TanStack Query hooks for dashboard data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReviewStats,
  getPostingCalendar,
  getEngagementMetrics,
  getTrendData,
  getPendingReviews,
  generateAIResponse,
  publishResponse,
  getUserShops,
  type ReviewStatsResponse,
  type CalendarResponse,
  type EngagementResponse,
  type TrendResponse,
  type PendingReviewsResponse,
  type GeneratedResponseResult,
  type PublishResponseResult,
  type ShopsListResponse,
} from '@/lib/api/dashboard';

// ============== Query Keys ==============

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: (shopId: string) => [...dashboardKeys.all, 'stats', shopId] as const,
  calendar: (shopId: string, startDate: string, endDate: string) =>
    [...dashboardKeys.all, 'calendar', shopId, startDate, endDate] as const,
  engagement: (shopId: string) => [...dashboardKeys.all, 'engagement', shopId] as const,
  trends: (shopId: string, period: string) =>
    [...dashboardKeys.all, 'trends', shopId, period] as const,
  pendingReviews: (shopId: string) =>
    [...dashboardKeys.all, 'pendingReviews', shopId] as const,
  shops: () => ['shops'] as const,
};

// ============== Review Stats ==============

export function useReviewStats(shopId: string | null) {
  return useQuery<ReviewStatsResponse>({
    queryKey: dashboardKeys.stats(shopId ?? ''),
    queryFn: () => getReviewStats(shopId!),
    enabled: !!shopId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============== Posting Calendar ==============

export function usePostingCalendar(
  shopId: string | null,
  startDate: string,
  endDate: string,
  view: 'week' | 'month' = 'month'
) {
  return useQuery<CalendarResponse>({
    queryKey: dashboardKeys.calendar(shopId ?? '', startDate, endDate),
    queryFn: () => getPostingCalendar(shopId!, startDate, endDate, view),
    enabled: !!shopId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============== Engagement Metrics ==============

export function useEngagementMetrics(shopId: string | null) {
  return useQuery<EngagementResponse>({
    queryKey: dashboardKeys.engagement(shopId ?? ''),
    queryFn: () => getEngagementMetrics(shopId!),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============== Trend Data ==============

export function useTrendData(shopId: string | null, period: 'week' | 'month' | 'year') {
  return useQuery<TrendResponse>({
    queryKey: dashboardKeys.trends(shopId ?? '', period),
    queryFn: () => getTrendData(shopId!, period),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000, // 5 minutes (FR-015: ≤5 min staleness)
  });
}

// ============== Pending Reviews ==============

export function usePendingReviews(shopId: string | null, limit: number = 10) {
  return useQuery<PendingReviewsResponse>({
    queryKey: dashboardKeys.pendingReviews(shopId ?? ''),
    queryFn: () => getPendingReviews(shopId!, limit),
    enabled: !!shopId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// ============== AI Response Generation ==============

export function useGenerateAIResponse(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<GeneratedResponseResult, Error, string>({
    mutationFn: (reviewId: string) => generateAIResponse(shopId, reviewId),
    onSuccess: () => {
      // Invalidate pending reviews to refresh the list
      queryClient.invalidateQueries({ queryKey: dashboardKeys.pendingReviews(shopId) });
    },
  });
}

// ============== Publish Response ==============

export function usePublishResponse(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<
    PublishResponseResult,
    Error,
    { reviewId: string; finalResponse: string },
    { previousReviews: PendingReviewsResponse | undefined }
  >({
    mutationFn: ({ reviewId, finalResponse }) =>
      publishResponse(shopId, reviewId, finalResponse),
    // Optimistic update: remove review from list immediately
    onMutate: async ({ reviewId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: dashboardKeys.pendingReviews(shopId) });

      // Snapshot the previous value
      const previousReviews = queryClient.getQueryData<PendingReviewsResponse>(
        dashboardKeys.pendingReviews(shopId)
      );

      // Optimistically update to the new value
      if (previousReviews) {
        queryClient.setQueryData<PendingReviewsResponse>(
          dashboardKeys.pendingReviews(shopId),
          {
            ...previousReviews,
            reviews: previousReviews.reviews.filter((r) => r.id !== reviewId),
            total_pending: Math.max(0, previousReviews.total_pending - 1),
          }
        );
      }

      // Return a context object with the snapshotted value
      return { previousReviews };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_err, _variables, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(
          dashboardKeys.pendingReviews(shopId),
          context.previousReviews
        );
      }
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.pendingReviews(shopId) });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats(shopId) });
    },
  });
}

// ============== User Shops ==============

export function useUserShops() {
  return useQuery<ShopsListResponse>({
    queryKey: dashboardKeys.shops(),
    queryFn: getUserShops,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
