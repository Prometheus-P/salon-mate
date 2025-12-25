'use client';

/**
 * Global Inbox Page - Agency Mode
 * Unified view of all pending reviews across all shops
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useGlobalInbox, useBulkApprove } from '../hooks/useDashboard';
import { InboxList } from './components/InboxList';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Loading skeleton
function InboxSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse border-b border-gray-100 p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 rounded bg-gray-200" />
            <div className="flex-1 space-y-3">
              <div className="flex gap-2">
                <div className="h-5 w-20 rounded bg-gray-200" />
                <div className="h-5 w-16 rounded bg-gray-200" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="h-5 w-24 rounded bg-gray-200" />
              </div>
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Error state
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="h-12 w-12 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        리뷰를 불러오는데 실패했습니다
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        네트워크 연결을 확인하고 다시 시도해주세요.
      </p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        다시 시도
      </Button>
    </div>
  );
}

export default function InboxPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setBulkDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useGlobalInbox();
  const bulkApproveMutation = useBulkApprove();

  // Handle individual selection
  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const reviews = data?.reviews;
  const handleSelectAll = useCallback(() => {
    if (!reviews) return;

    setSelectedIds((prev) => {
      if (prev.size === reviews.length) {
        return new Set();
      }
      return new Set(reviews.map((r) => r.id));
    });
  }, [reviews]);

  // Filter reviews that have AI responses for bulk approve
  const selectedWithAIResponse = reviews?.filter(
    (r) => selectedIds.has(r.id) && r.aiResponse
  );

  // Handle bulk approve
  const handleBulkApprove = async () => {
    if (!selectedWithAIResponse || selectedWithAIResponse.length === 0) return;

    try {
      const result = await bulkApproveMutation.mutateAsync({
        reviewIds: selectedWithAIResponse.map((r) => r.id),
      });

      if (result.successCount > 0) {
        toast.success(`${result.successCount}개의 답변이 게시되었습니다`, {
          description:
            result.failedCount > 0
              ? `${result.failedCount}개는 실패했습니다.`
              : undefined,
        });
      } else {
        toast.error('답변 게시에 실패했습니다');
      }

      setSelectedIds(new Set());
      setBulkDialogOpen(false);
    } catch (error) {
      console.error('Bulk approve failed:', error);
      toast.error('일괄 승인에 실패했습니다');
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">전체 리뷰 인박스</h1>
          <p className="text-sm text-gray-500">
            모든 매장의 답변 대기 리뷰를 한 곳에서 관리하세요
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Pending count badge */}
          {data?.totalPending !== undefined && data.totalPending > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {data.totalPending}개 대기 중
            </span>
          )}

          {/* Bulk approve button */}
          {selectedIds.size > 0 && (
            <Button
              onClick={() => setBulkDialogOpen(true)}
              disabled={!selectedWithAIResponse || selectedWithAIResponse.length === 0}
            >
              선택 항목 일괄 승인 ({selectedWithAIResponse?.length || 0})
            </Button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">
        {isLoading ? (
          <InboxSkeleton />
        ) : error ? (
          <ErrorState onRetry={refetch} />
        ) : (
          <InboxList
            reviews={reviews || []}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
          />
        )}
      </div>

      {/* Bulk approve confirmation dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일괄 답변 게시</DialogTitle>
            <DialogDescription>
              선택한 {selectedWithAIResponse?.length || 0}개 리뷰의 AI 답변을 게시합니다.
              {selectedIds.size > (selectedWithAIResponse?.length || 0) && (
                <span className="mt-2 block text-amber-600">
                  * AI 답변이 없는{' '}
                  {selectedIds.size - (selectedWithAIResponse?.length || 0)}개 리뷰는
                  제외됩니다.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Preview of selected reviews */}
          <div className="max-h-60 overflow-y-auto rounded-lg border border-gray-200">
            {selectedWithAIResponse?.map((review) => (
              <div
                key={review.id}
                className="border-b border-gray-100 p-3 last:border-b-0"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-purple-700">{review.shopName}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-600">{review.reviewerName}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                  {review.aiResponse}
                </p>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setBulkDialogOpen(false)}
              disabled={bulkApproveMutation.isPending}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleBulkApprove}
              disabled={bulkApproveMutation.isPending}
            >
              {bulkApproveMutation.isPending
                ? '처리 중...'
                : `${selectedWithAIResponse?.length || 0}개 게시하기`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
