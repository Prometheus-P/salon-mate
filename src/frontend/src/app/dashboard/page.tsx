'use client';

/**
 * Marketing Dashboard Page
 * Main dashboard view for salon owners to monitor marketing metrics
 */

import { useState } from 'react';
import { ShopSelector } from './components/ShopSelector';
import { ReviewStats } from './components/ReviewStats';
import { PostingCalendar } from './components/PostingCalendar';
import { EngagementMetrics } from './components/EngagementMetrics';
import { TrendCharts } from './components/TrendCharts';
import { PendingReviews } from './components/PendingReviews';
import { CardSkeleton } from './components/EmptyState';

export default function DashboardPage() {
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Header with Shop Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">대시보드</h1>
          <p className="text-gray-600">마케팅 현황을 한눈에 확인하세요</p>
        </div>
        <ShopSelector
          selectedShopId={selectedShopId}
          onShopChange={setSelectedShopId}
        />
      </div>

      {/* Dashboard Content */}
      {!selectedShopId ? (
        // Loading state while shop is being selected
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Row 1: Review Stats + Pending Reviews */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ReviewStats component - US1 */}
            <ReviewStats shopId={selectedShopId} />

            {/* PendingReviews component - US5 */}
            <PendingReviews shopId={selectedShopId} />
          </div>

          {/* Row 2: Posting Calendar - US2 */}
          <PostingCalendar shopId={selectedShopId} />

          {/* Row 3: Engagement Metrics + Trend Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* EngagementMetrics component - US3 */}
            <EngagementMetrics shopId={selectedShopId} />

            {/* TrendCharts component - US4 */}
            <TrendCharts shopId={selectedShopId} />
          </div>
        </div>
      )}
    </div>
  );
}
