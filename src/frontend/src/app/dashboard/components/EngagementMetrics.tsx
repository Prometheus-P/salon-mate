'use client';

/**
 * EngagementMetrics - Display Instagram engagement metrics
 * Implements FR-008, FR-009
 */

import { useEngagementMetrics } from '../hooks/useDashboard';
import { CardSkeleton, ErrorState, FreshnessIndicator } from './EmptyState';
import type { TopPost } from '@/lib/api/dashboard';

interface EngagementMetricsProps {
  shopId: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
      <div className={`rounded-full p-2 ${color}`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{formatNumber(value)}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function TopPostCard({ post, rank }: { post: TopPost; rank: number }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-2 shadow-sm">
      {/* Rank */}
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
        {rank}
      </div>

      {/* Thumbnail */}
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded bg-gray-100">
        <img
          src={post.image_url}
          alt={`Top post ${rank}`}
          className="h-full w-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-image.png';
          }}
        />
      </div>

      {/* Metrics */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            {formatNumber(post.likes_count)}
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" />
            </svg>
            {formatNumber(post.comments_count)}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <p className="text-sm font-bold text-purple-600">{formatNumber(post.engagement_score)}</p>
        <p className="text-xs text-gray-400">score</p>
      </div>
    </div>
  );
}

function EmptyEngagement() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <svg
        className="h-12 w-12 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <h3 className="mt-4 text-sm font-medium text-gray-900">No engagement data</h3>
      <p className="mt-1 text-sm text-gray-500">
        게시된 포스트가 없어 인게이지먼트 데이터가 없습니다.
      </p>
    </div>
  );
}

export function EngagementMetrics({ shopId }: EngagementMetricsProps) {
  const { data, isLoading, error, refetch } = useEngagementMetrics(shopId);

  if (isLoading) {
    return (
      <div data-testid="engagement-metrics-loading">
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load engagement metrics"
        onRetry={() => refetch()}
      />
    );
  }

  const isEmpty =
    data?.total_likes === 0 &&
    data?.total_comments === 0 &&
    data?.total_reach === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Engagement Metrics</h2>
        {data?.last_synced_at && (
          <FreshnessIndicator lastSyncedAt={data.last_synced_at} />
        )}
      </div>

      {isEmpty ? (
        <EmptyEngagement />
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <MetricCard
              icon={
                <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                </svg>
              }
              label="Total Likes"
              value={data?.total_likes || 0}
              color="bg-red-100"
            />
            <MetricCard
              icon={
                <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" />
                </svg>
              }
              label="Total Comments"
              value={data?.total_comments || 0}
              color="bg-blue-100"
            />
            <MetricCard
              icon={
                <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              }
              label="Total Reach"
              value={data?.total_reach || 0}
              color="bg-green-100"
            />
          </div>

          {/* Top Posts */}
          {data?.top_posts && data.top_posts.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-gray-700">
                Top Performing Posts
              </h3>
              <div className="space-y-2">
                {data.top_posts.map((post, index) => (
                  <TopPostCard key={post.id} post={post} rank={index + 1} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
