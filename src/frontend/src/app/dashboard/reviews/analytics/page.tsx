'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { ReviewAnalytics } from '../components/ReviewAnalytics';
import { useReviewAnalytics } from '../hooks/useReviews';
import { useShopStore } from '@/stores/shopStore';

type Period = 'week' | 'month' | 'year';

export default function ReviewAnalyticsPage() {
  const { selectedShopId } = useShopStore();
  const [period, setPeriod] = React.useState<Period>('month');

  const { data, isLoading, error } = useReviewAnalytics(selectedShopId, period);

  if (!selectedShopId) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="리뷰 분석"
        description="리뷰 데이터를 분석하여 인사이트를 얻으세요"
        action={
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
              <SelectItem value="year">올해</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-48" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            분석 데이터를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      ) : data ? (
        <ReviewAnalytics data={data} />
      ) : null}
    </div>
  );
}
