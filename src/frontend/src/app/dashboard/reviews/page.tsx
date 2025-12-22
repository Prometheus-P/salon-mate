'use client';

import * as React from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { ReviewFilters } from './components/ReviewFilters';
import { ReviewList } from './components/ReviewList';
import { useReviews, useGenerateAIResponse, useExportReviews } from './hooks/useReviews';
import { useShopStore } from '@/stores/shopStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { ReviewStatus, ReviewListParams } from '@/lib/api/reviews';

const PAGE_SIZE = 20;

export default function ReviewsPage() {
  const { selectedShopId } = useShopStore();
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<ReviewStatus | 'all' | 'negative'>('all');
  const [sort, setSort] = React.useState('latest');
  const [generatingReviewId, setGeneratingReviewId] = React.useState<string | null>(null);

  // Build query params
  const params: ReviewListParams = React.useMemo(() => {
    const p: ReviewListParams = {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    };

    if (search) p.search = search;
    if (status === 'pending' || status === 'replied' || status === 'ignored') {
      p.status = status;
    }
    if (status === 'negative') {
      p.ratingMax = 3;
    }

    switch (sort) {
      case 'oldest':
        p.sort = 'review_date';
        p.order = 'asc';
        break;
      case 'rating_high':
        p.sort = 'rating';
        p.order = 'desc';
        break;
      case 'rating_low':
        p.sort = 'rating';
        p.order = 'asc';
        break;
      default:
        p.sort = 'review_date';
        p.order = 'desc';
    }

    return p;
  }, [page, search, status, sort]);

  const { data, isLoading, error } = useReviews(selectedShopId, params);
  const generateAI = useGenerateAIResponse(selectedShopId || '');
  const exportReviews = useExportReviews(selectedShopId || '');

  // Calculate counts (in real app, these would come from API)
  const counts = React.useMemo(() => {
    const total = data?.total || 0;
    const pending = data?.reviews.filter((r) => r.status === 'pending').length || 0;
    const replied = data?.reviews.filter((r) => r.status === 'replied').length || 0;
    const negative = data?.reviews.filter((r) => r.rating <= 3).length || 0;
    return { all: total, pending, replied, negative };
  }, [data]);

  const handleGenerateAI = async (reviewId: string) => {
    setGeneratingReviewId(reviewId);
    try {
      await generateAI.mutateAsync({ reviewId });
    } finally {
      setGeneratingReviewId(null);
    }
  };

  const handleExport = async () => {
    try {
      const items = await exportReviews.mutateAsync({});
      // Convert to CSV and download
      const headers = ['ID', '작성자', '평점', '내용', '작성일', '상태', '플랫폼', '응답'];
      const csv = [
        headers.join(','),
        ...items.map((item) =>
          [
            item.id,
            `"${item.reviewerName}"`,
            item.rating,
            `"${(item.content || '').replace(/"/g, '""')}"`,
            item.reviewDate,
            item.status,
            item.platform,
            `"${(item.response || '').replace(/"/g, '""')}"`,
          ].join(',')
        ),
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reviews_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [search, status, sort]);

  if (!selectedShopId) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            매장을 선택해주세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="리뷰 관리"
        description="고객 리뷰를 효율적으로 관리하세요"
      />

      <ReviewFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        sort={sort}
        onSortChange={setSort}
        counts={counts}
        onExport={handleExport}
        isExporting={exportReviews.isPending}
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            리뷰를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      ) : (
        <ReviewList
          reviews={data?.reviews || []}
          total={data?.total || 0}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          onGenerateAI={handleGenerateAI}
          isGeneratingAI={generateAI.isPending}
          generatingReviewId={generatingReviewId || undefined}
        />
      )}
    </div>
  );
}
