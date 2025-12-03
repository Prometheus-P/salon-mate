'use client';

/**
 * EmptyState - Contextual empty states with actionable guidance
 * Implements FR-017: Display appropriate empty states with guidance
 */

import Link from 'next/link';

type EmptyStateVariant =
  | 'reviews'
  | 'calendar'
  | 'engagement'
  | 'trends'
  | 'pending-reviews';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  className?: string;
}

const emptyStateContent: Record<
  EmptyStateVariant,
  {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
  }
> = {
  reviews: {
    icon: '📊',
    title: 'No review data yet',
    description: 'Connect your review platforms (Naver, Google) to see statistics.',
    actionLabel: 'Connect Platforms',
    actionHref: '/settings/integrations',
  },
  calendar: {
    icon: '📅',
    title: 'No posts scheduled',
    description: 'Create your first Instagram post to see it on the calendar.',
    actionLabel: 'Create Post',
    actionHref: '/posts/new',
  },
  engagement: {
    icon: '📈',
    title: 'No engagement data',
    description: 'Publish posts to start tracking likes, comments, and reach.',
    actionLabel: 'View Calendar',
    actionHref: '/dashboard?tab=calendar',
  },
  trends: {
    icon: '📉',
    title: 'Not enough data yet',
    description: 'Check back in a few days once we have more historical data to show trends.',
  },
  'pending-reviews': {
    icon: '🎉',
    title: 'All caught up!',
    description: 'No reviews need responses right now. Great job staying on top of customer feedback!',
  },
};

export function EmptyState({ variant, className = '' }: EmptyStateProps) {
  const content = emptyStateContent[variant];

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 p-8 text-center ${className}`}
    >
      <span className="mb-3 text-4xl" role="img" aria-label={content.title}>
        {content.icon}
      </span>
      <h3 className="mb-1 text-lg font-medium text-gray-900">{content.title}</h3>
      <p className="mb-4 max-w-sm text-sm text-gray-500">{content.description}</p>
      {content.actionLabel && content.actionHref && (
        <Link
          href={content.actionHref}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {content.actionLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * Loading skeleton for dashboard cards
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-gray-200 bg-white p-6 ${className}`}
    >
      <div className="mb-4 h-4 w-1/3 rounded bg-gray-200" />
      <div className="mb-2 h-8 w-1/2 rounded bg-gray-200" />
      <div className="h-4 w-2/3 rounded bg-gray-200" />
    </div>
  );
}

/**
 * Error state for dashboard cards
 */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6 text-center ${className}`}
    >
      <span className="mb-2 text-2xl">⚠️</span>
      <p className="mb-3 text-sm text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * Data freshness indicator
 * Implements FR-018: Show data freshness indicators
 */
interface FreshnessIndicatorProps {
  lastSyncedAt: string | Date;
  className?: string;
}

export function FreshnessIndicator({
  lastSyncedAt,
  className = '',
}: FreshnessIndicatorProps) {
  const syncDate = new Date(lastSyncedAt);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / 60000);

  let timeAgo: string;
  let isStale = false;

  if (diffMinutes < 1) {
    timeAgo = 'Just now';
  } else if (diffMinutes < 60) {
    timeAgo = `${diffMinutes}m ago`;
  } else if (diffMinutes < 1440) {
    const hours = Math.floor(diffMinutes / 60);
    timeAgo = `${hours}h ago`;
    isStale = hours > 1;
  } else {
    const days = Math.floor(diffMinutes / 1440);
    timeAgo = `${days}d ago`;
    isStale = true;
  }

  return (
    <span
      className={`text-xs ${isStale ? 'text-orange-600' : 'text-gray-400'} ${className}`}
      title={`Last synced: ${syncDate.toLocaleString()}`}
    >
      Updated {timeAgo}
    </span>
  );
}
