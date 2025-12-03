'use client';

/**
 * ReviewStats - Display review performance statistics
 * Implements FR-001, FR-002, FR-003, FR-004
 */

import { useReviewStats } from '../hooks/useDashboard';
import { EmptyState, CardSkeleton, ErrorState, FreshnessIndicator } from './EmptyState';

interface ReviewStatsProps {
  shopId: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  highlight?: boolean;
}

function StatCard({ label, value, subtitle, highlight = false }: StatCardProps) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-2xl font-bold ${
          highlight ? 'text-orange-600' : 'text-gray-900'
        }`}
      >
        {value}
      </span>
      {subtitle && <span className="text-xs text-gray-400">{subtitle}</span>}
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${
            i < fullStars
              ? 'text-yellow-400'
              : i === fullStars && hasHalfStar
                ? 'text-yellow-400'
                : 'text-gray-200'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function ReviewStats({ shopId }: ReviewStatsProps) {
  const { data, isLoading, error, refetch } = useReviewStats(shopId);

  if (isLoading) {
    return (
      <div data-testid="review-stats-loading">
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load review statistics"
        onRetry={() => refetch()}
      />
    );
  }

  if (!data) {
    return <EmptyState variant="reviews" />;
  }

  // Empty state for no reviews
  if (data.total_reviews === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Review Stats</h2>
          <FreshnessIndicator lastSyncedAt={data.last_synced_at} />
        </div>
        <EmptyState variant="reviews" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header with freshness indicator */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Review Stats</h2>
        <FreshnessIndicator lastSyncedAt={data.last_synced_at} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {/* Total Reviews - FR-001 */}
        <StatCard
          label="Total Reviews"
          value={data.total_reviews.toLocaleString()}
          subtitle="total reviews"
        />

        {/* Average Rating - FR-002 */}
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Average Rating</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {data.average_rating.toFixed(1)}
            </span>
            <StarRating rating={data.average_rating} />
          </div>
          <span className="text-xs text-gray-400">out of 5 stars</span>
        </div>

        {/* Response Rate - FR-003 */}
        <StatCard
          label="Response Rate"
          value={`${data.response_rate.toFixed(1)}%`}
          subtitle="of reviews answered"
        />

        {/* Pending Count - FR-004 */}
        <StatCard
          label="Pending Reviews"
          value={data.pending_count}
          subtitle="need response"
          highlight={data.pending_count > 0}
        />
      </div>

      {/* Platform Breakdown */}
      {Object.keys(data.by_platform).length > 0 && (
        <div className="mt-6 border-t border-gray-100 pt-4">
          <h3 className="mb-3 text-sm font-medium text-gray-700">By Platform</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(data.by_platform).map(([platform, stats]) => (
              <div
                key={platform}
                className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2"
              >
                <span
                  className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    platform === 'google'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </span>
                <span className="text-sm text-gray-600">
                  {stats.total_reviews} reviews
                </span>
                <span className="text-sm font-medium">{stats.average_rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
