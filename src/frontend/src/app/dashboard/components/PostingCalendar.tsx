'use client';

/**
 * PostingCalendar - Display Instagram posts on a calendar
 * Implements FR-005, FR-006, FR-007
 */

import Image from 'next/image';
import { useState, useMemo } from 'react';
import { usePostingCalendar } from '../hooks/useDashboard';
import { CardSkeleton, ErrorState, FreshnessIndicator } from './EmptyState';
import type { CalendarEntry, PostSummary } from '@/lib/api/dashboard';

interface PostingCalendarProps {
  shopId: string;
}

type ViewMode = 'week' | 'month';

const PLACEHOLDER_IMAGE = '/placeholder-image.svg';

// M3 Status colors for FR-007 (spec.md Design System)
const statusColors: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  published: { bg: 'bg-status-published-container', text: 'text-status-published', dot: 'bg-status-published', label: '게시됨' },
  scheduled: { bg: 'bg-status-scheduled-container', text: 'text-status-scheduled', dot: 'bg-status-scheduled', label: '예약됨' },
  failed: { bg: 'bg-status-failed-container', text: 'text-status-failed', dot: 'bg-status-failed', label: '실패' },
  draft: { bg: 'bg-status-pending-container', text: 'text-status-pending', dot: 'bg-status-pending', label: '초안' },
};

function getDateRange(viewMode: ViewMode, referenceDate: Date): { start: Date; end: Date } {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);

  if (viewMode === 'week') {
    // Get start of week (Sunday)
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    end.setDate(start.getDate() + 6);
  } else {
    // Get start and end of month
    start.setDate(1);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0); // Last day of current month
  }

  return { start, end };
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function getDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

function PostStatusBadge({ status }: { status: string }) {
  const colors = statusColors[status] || statusColors.draft;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
      data-testid={`status-${status}`}
    >
      {colors.label}
    </span>
  );
}

function PostCard({ post }: { post: PostSummary }) {
  return (
    <div className="group relative rounded-md border border-gray-200 bg-white p-2 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-2">
        {/* Thumbnail */}
        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100">
          <Image
            src={post.image_url || PLACEHOLDER_IMAGE}
            alt="Post thumbnail"
            fill
            sizes="40px"
            className="object-cover"
            onError={(event) => {
              if (event.currentTarget.src !== PLACEHOLDER_IMAGE) {
                event.currentTarget.src = PLACEHOLDER_IMAGE;
              }
            }}
          />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <PostStatusBadge status={post.status} />
          {post.caption_snippet && (
            <p className="mt-1 truncate text-xs text-gray-600">
              {post.caption_snippet}
            </p>
          )}
        </div>
      </div>

      {/* Time */}
      {(post.scheduled_at || post.published_at) && (
        <p className="mt-1 text-xs text-gray-400">
          {new Date(post.scheduled_at || post.published_at!).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}

function CalendarGrid({
  entries,
  days,
  viewMode,
}: {
  entries: CalendarEntry[];
  days: Date[];
  viewMode: ViewMode;
}) {
  // Create a map for quick lookup
  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry>();
    entries.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [entries]);

  const today = formatDate(new Date());

  if (viewMode === 'week') {
    // Week view - horizontal layout
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Day cells */}
        {days.map((day) => {
          const dateStr = formatDate(day);
          const entry = entriesByDate.get(dateStr);
          const isToday = dateStr === today;

          return (
            <div
              key={dateStr}
              className={`min-h-[100px] rounded-lg border p-2 ${
                isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                {day.getDate()}
              </div>
              <div className="mt-1 space-y-1">
                {entry?.posts.map((post) => (
                  <div
                    key={post.id}
                    className={`rounded px-1.5 py-0.5 text-xs ${statusColors[post.status]?.bg} ${statusColors[post.status]?.text}`}
                    title={post.caption_snippet || undefined}
                  >
                    <span className="truncate block">{post.caption_snippet?.slice(0, 15) || '포스트'}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Month view - calendar grid
  const firstDayOfMonth = days[0];
  const startPadding = firstDayOfMonth.getDay(); // 0 = Sunday

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Day headers */}
      {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
        <div key={day} className="py-2 text-center text-xs font-medium text-gray-500">
          {day}
        </div>
      ))}

      {/* Padding for days before month start */}
      {Array.from({ length: startPadding }).map((_, i) => (
        <div key={`pad-${i}`} className="min-h-[80px]" />
      ))}

      {/* Day cells */}
      {days.map((day) => {
        const dateStr = formatDate(day);
        const entry = entriesByDate.get(dateStr);
        const isToday = dateStr === today;

        return (
          <div
            key={dateStr}
            className={`min-h-[80px] rounded-lg border p-1 ${
              isToday ? 'border-blue-300 bg-blue-50' : 'border-gray-100'
            }`}
          >
            <div className={`text-xs ${isToday ? 'font-bold text-blue-600' : 'text-gray-400'}`}>
              {day.getDate()}
            </div>
            <div className="mt-0.5 space-y-0.5">
              {entry?.posts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className={`h-1.5 w-full rounded-full ${statusColors[post.status]?.dot || 'bg-status-pending'}`}
                  title={`${statusColors[post.status]?.label}: ${post.caption_snippet || ''}`}
                />
              ))}
              {entry && entry.posts.length > 3 && (
                <span className="text-xs text-gray-400">+{entry.posts.length - 3}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyCalendar() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
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
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 className="mt-4 text-sm font-medium text-gray-900">No posts scheduled</h3>
      <p className="mt-1 text-sm text-gray-500">
        예약된 포스트가 없습니다. 새 포스트를 예약해보세요.
      </p>
    </div>
  );
}

export function PostingCalendar({ shopId }: PostingCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [referenceDate, setReferenceDate] = useState(new Date());

  const { start, end } = useMemo(
    () => getDateRange(viewMode, referenceDate),
    [viewMode, referenceDate]
  );

  const startDate = formatDate(start);
  const endDate = formatDate(end);

  const { data, isLoading, error, refetch } = usePostingCalendar(
    shopId,
    startDate,
    endDate,
    viewMode
  );

  const days = useMemo(() => getDaysInRange(start, end), [start, end]);

  const navigatePrevious = () => {
    const newDate = new Date(referenceDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setReferenceDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(referenceDate);
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setReferenceDate(newDate);
  };

  const goToToday = () => {
    setReferenceDate(new Date());
  };

  if (isLoading) {
    return (
      <div data-testid="posting-calendar-loading">
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load posting calendar"
        onRetry={() => refetch()}
      />
    );
  }

  const headerText = viewMode === 'month'
    ? referenceDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
    : `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Posting Calendar</h2>
        {data?.last_synced_at && (
          <FreshnessIndicator lastSyncedAt={data.last_synced_at} />
        )}
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={navigatePrevious}
            className="rounded-md border border-gray-300 p-1.5 hover:bg-gray-50"
            aria-label="Previous"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="min-w-[150px] text-center text-sm font-medium">
            {headerText}
          </span>

          <button
            onClick={navigateNext}
            className="rounded-md border border-gray-300 p-1.5 hover:bg-gray-50"
            aria-label="Next"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={goToToday}
            className="ml-2 rounded-md border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
          >
            오늘
          </button>
        </div>

        {/* View Toggle */}
        <div className="flex rounded-md border border-gray-300">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 text-sm ${
              viewMode === 'week'
                ? 'bg-gray-100 font-medium text-gray-900'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 text-sm ${
              viewMode === 'month'
                ? 'bg-gray-100 font-medium text-gray-900'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            Month
          </button>
        </div>
      </div>

      {/* Legend - M3 Status Colors */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-status-published" />
          <span className="text-muted-foreground">게시됨</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-status-scheduled" />
          <span className="text-muted-foreground">예약됨</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-status-failed" />
          <span className="text-muted-foreground">실패</span>
        </div>
      </div>

      {/* Calendar Grid */}
      {data && data.entries.length > 0 ? (
        <CalendarGrid entries={data.entries} days={days} viewMode={viewMode} />
      ) : (
        <EmptyCalendar />
      )}

      {/* Post List for current selection (optional detail view) */}
      {data && data.entries.length > 0 && viewMode === 'week' && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">이번 주 포스트</h3>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.entries.flatMap((entry) =>
              entry.posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
