'use client';

/**
 * InboxList - Unified review list for Agency Mode
 * Displays all pending reviews across all shops with bulk actions
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { useGenerateAIResponse, usePublishResponse } from '../../hooks/useDashboard';
import type { InboxReviewItem } from '@/lib/api/dashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface InboxListProps {
  reviews: InboxReviewItem[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onSelectAll: () => void;
}

// Star rating display component
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'text-yellow-400' : 'text-gray-200'
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

// Platform badge component
function PlatformBadge({ platform }: { platform: string }) {
  const colors =
    platform === 'google'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-green-100 text-green-700';
  const label = platform === 'google' ? 'Google' : 'Naver';

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors}`}>
      {label}
    </span>
  );
}

// Shop badge component
function ShopBadge({ name }: { name: string }) {
  return (
    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
      {name}
    </span>
  );
}

// Single review card
interface InboxCardProps {
  review: InboxReviewItem;
  isSelected: boolean;
  onSelect: () => void;
}

function InboxCard({ review, isSelected, onSelect }: InboxCardProps) {
  const [response, setResponse] = useState(review.aiResponse || '');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPublishDialogOpen, setPublishDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const generateMutation = useGenerateAIResponse(review.shopId);
  const publishMutation = usePublishResponse(review.shopId);

  const handleCopyToClipboard = async () => {
    if (!response.trim()) return;

    try {
      await navigator.clipboard.writeText(response);
      setIsCopied(true);
      toast.success('클립보드에 복사되었습니다', {
        description: '네이버 또는 카카오에 붙여넣기 하세요.',
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('복사에 실패했습니다');
    }
  };

  const handleOpenNaver = () => {
    window.open('https://m.place.naver.com/my/review', '_blank');
  };

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync(review.id);
      setResponse(result.ai_response);
      setIsExpanded(true);
    } catch (error) {
      console.error('Failed to generate response:', error);
      toast.error('AI 답변 생성에 실패했습니다');
    }
  };

  const handlePublishClick = () => {
    if (!response.trim()) return;
    setPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    if (!response.trim()) return;

    try {
      setIsPublishing(true);
      await publishMutation.mutateAsync({
        reviewId: review.id,
        finalResponse: response,
      });
      setPublishDialogOpen(false);
      toast.success('답변이 성공적으로 게시되었습니다!', {
        description: `${review.reviewerName}님의 리뷰에 답변을 게시했습니다.`,
      });
    } catch (error) {
      console.error('Failed to publish response:', error);
      toast.error('답변 게시에 실패했습니다');
    } finally {
      setIsPublishing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return formatDate(dateString);
  };

  return (
    <div
      className={`border-b border-gray-100 transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Main row */}
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <div className="pt-1">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            aria-label={`Select review from ${review.reviewerName}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <ShopBadge name={review.shopName} />
            <PlatformBadge platform={review.platform} />
            <span className="text-xs text-gray-500">{formatTime(review.reviewDate)}</span>
          </div>

          {/* Reviewer info */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
              {review.reviewerName.charAt(0)}
            </div>
            <div>
              <span className="font-medium text-gray-900">{review.reviewerName}</span>
              <StarRating rating={review.rating} />
            </div>
          </div>

          {/* Review content */}
          <p className="text-sm text-gray-700 line-clamp-2">
            {review.content || '(내용 없음)'}
          </p>

          {/* Quick actions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {/* Generate AI Response */}
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="flex items-center gap-1 rounded-md bg-purple-100 px-2.5 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50"
            >
              {generateMutation.isPending ? (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
              AI 생성
            </button>

            {/* Show/Edit response */}
            {(response || review.aiResponse) && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                <svg
                  className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {isExpanded ? '접기' : '답변 보기'}
              </button>
            )}

            {/* Copy button */}
            {response && (
              <button
                onClick={handleCopyToClipboard}
                className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isCopied
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isCopied ? (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
                {isCopied ? '복사됨' : '복사'}
              </button>
            )}

            {/* Naver button */}
            {response && (
              <button
                onClick={handleOpenNaver}
                className="flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                네이버
              </button>
            )}

            {/* Publish button */}
            {response && (
              <button
                onClick={handlePublishClick}
                disabled={publishMutation.isPending}
                className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                게시
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded response section */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 pl-12">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">답변 편집</label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            rows={3}
            placeholder="리뷰에 대한 답변을 작성하세요..."
          />
        </div>
      )}

      {/* Publish confirmation dialog */}
      <Dialog open={isPublishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>답변 게시 확인</DialogTitle>
            <DialogDescription>
              {review.shopName}의 {review.reviewerName}님 리뷰에 아래 답변을 게시합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
            {response || '(작성된 답변이 없습니다)'}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPublishDialogOpen(false)}
              disabled={isPublishing}
            >
              취소
            </Button>
            <Button type="button" onClick={confirmPublish} disabled={isPublishing}>
              {isPublishing ? '게시 중...' : '게시하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Empty state
function EmptyInbox() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg
        className="h-16 w-16 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        모든 리뷰에 답변을 완료했습니다!
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        대기 중인 리뷰가 없습니다. 잘 하셨어요!
      </p>
    </div>
  );
}

export function InboxList({ reviews, selectedIds, onSelect, onSelectAll }: InboxListProps) {
  if (reviews.length === 0) {
    return <EmptyInbox />;
  }

  const allSelected = reviews.length > 0 && selectedIds.size === reviews.length;

  return (
    <div className="divide-y divide-gray-100">
      {/* Select all header */}
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          aria-label="Select all reviews"
        />
        <span className="text-sm text-gray-600">
          {selectedIds.size > 0 ? `${selectedIds.size}개 선택됨` : '전체 선택'}
        </span>
      </div>

      {/* Review list */}
      {reviews.map((review) => (
        <InboxCard
          key={review.id}
          review={review}
          isSelected={selectedIds.has(review.id)}
          onSelect={() => onSelect(review.id)}
        />
      ))}
    </div>
  );
}
