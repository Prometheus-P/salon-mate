'use client';

/**
 * PendingReviews - Display and manage pending reviews with AI response generation
 * Implements FR-012, FR-013, FR-014
 */

import { useState } from 'react';
import {
  usePendingReviews,
  useGenerateAIResponse,
  usePublishResponse,
} from '../hooks/useDashboard';
import { CardSkeleton, ErrorState } from './EmptyState';
import type { PendingReview } from '@/lib/api/dashboard';

interface PendingReviewsProps {
  shopId: string;
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
      <span className="ml-1 text-sm text-gray-600">{rating}</span>
    </div>
  );
}

// Platform badge component
function PlatformBadge({ platform }: { platform: 'google' | 'naver' }) {
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

// Single review card component
interface ReviewCardProps {
  review: PendingReview;
  shopId: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function ReviewCard({ review, shopId, isExpanded, onToggle }: ReviewCardProps) {
  const [response, setResponse] = useState(review.ai_response || '');
  const [isEditing, setIsEditing] = useState(false);

  const generateMutation = useGenerateAIResponse(shopId);
  const publishMutation = usePublishResponse(shopId);

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync(review.id);
      setResponse(result.ai_response);
      setIsEditing(true);
    } catch (error) {
      console.error('Failed to generate response:', error);
    }
  };

  const handlePublish = async () => {
    if (!response.trim()) return;

    try {
      await publishMutation.mutateAsync({
        reviewId: review.id,
        finalResponse: response,
      });
    } catch (error) {
      console.error('Failed to publish response:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={`border-b border-gray-100 last:border-b-0 ${
        isExpanded ? 'bg-gray-50' : ''
      }`}
    >
      {/* Collapsed View */}
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      >
        <div className="flex items-center gap-3">
          {/* Reviewer Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {review.reviewer_name.charAt(0)}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {review.reviewer_name}
              </span>
              <PlatformBadge platform={review.platform} />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <StarRating rating={review.rating} />
              <span>·</span>
              <span>{formatDate(review.review_date)}</span>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <svg
          className={`h-5 w-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Review Content */}
          <div className="mb-4 rounded-lg bg-white p-3">
            <p className="text-sm text-gray-700">
              {review.content || '(내용 없음)'}
            </p>
          </div>

          {/* Response Section */}
          <div className="space-y-3">
            {/* Response Textarea */}
            {(response || isEditing) && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  답변
                </label>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={4}
                  placeholder="리뷰에 대한 답변을 작성하세요..."
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Generate AI Response Button */}
              <button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-purple-100 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generateMutation.isPending ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>생성 중...</span>
                  </>
                ) : (
                  <>
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span>AI 답변 생성</span>
                  </>
                )}
              </button>

              {/* Publish Button */}
              {response && (
                <button
                  onClick={handlePublish}
                  disabled={publishMutation.isPending || !response.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishMutation.isPending ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>게시 중...</span>
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>게시</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Error Messages */}
            {generateMutation.isError && (
              <p className="text-sm text-red-600">
                AI 답변 생성에 실패했습니다. 다시 시도해주세요.
              </p>
            )}
            {publishMutation.isError && (
              <p className="text-sm text-red-600">
                답변 게시에 실패했습니다. 다시 시도해주세요.
              </p>
            )}

            {/* Success Message */}
            {publishMutation.isSuccess && (
              <p className="text-sm text-green-600">
                답변이 성공적으로 게시되었습니다!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Empty state component
function EmptyPendingReviews() {
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
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h3 className="mt-4 text-sm font-medium text-gray-900">
        대기 중인 리뷰가 없습니다
      </h3>
      <p className="mt-1 text-sm text-gray-500">
        모든 리뷰에 답변을 완료했습니다!
      </p>
    </div>
  );
}

export function PendingReviews({ shopId }: PendingReviewsProps) {
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = usePendingReviews(shopId);

  if (isLoading) {
    return (
      <div data-testid="pending-reviews-loading">
        <CardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="리뷰 목록을 불러오는데 실패했습니다"
        onRetry={() => refetch()}
      />
    );
  }

  const isEmpty = !data?.reviews || data.reviews.length === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">답변 대기 리뷰</h2>
          <p className="text-sm text-gray-500">
            {data?.total_pending || 0}개의 리뷰가 답변을 기다리고 있습니다
          </p>
        </div>
        {data && data.total_pending > 0 && (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-sm font-medium text-red-700">
            {data.total_pending}
          </span>
        )}
      </div>

      {/* Content */}
      {isEmpty ? (
        <EmptyPendingReviews />
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {data?.reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              shopId={shopId}
              isExpanded={expandedReviewId === review.id}
              onToggle={() =>
                setExpandedReviewId(
                  expandedReviewId === review.id ? null : review.id
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
