'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ExternalLink, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { StarRating } from '@/components/common/StarRating';
import { PlatformBadge, StatusBadge } from '@/components/common/PlatformBadge';
import { ResponseEditor } from '../components/ResponseEditor';
import {
  useReviewDetail,
  useUpdateReview,
  useGenerateAIResponse,
} from '../hooks/useReviews';
import { useShopStore } from '@/stores/shopStore';

interface AIOptions {
  tone: 'friendly' | 'formal' | 'casual';
  length: 'short' | 'medium' | 'long';
  emphasis: 'thanks' | 'revisit' | 'apology';
}

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;
  const { selectedShopId } = useShopStore();

  const [response, setResponse] = React.useState('');
  const [aiOptions, setAIOptions] = React.useState<AIOptions>({
    tone: 'friendly',
    length: 'medium',
    emphasis: 'thanks',
  });

  const { data: review, isLoading, error } = useReviewDetail(selectedShopId, reviewId);
  const updateReview = useUpdateReview(selectedShopId || '');
  const generateAI = useGenerateAIResponse(selectedShopId || '');

  // Initialize response with existing data
  React.useEffect(() => {
    if (review) {
      setResponse(review.finalResponse || review.aiResponse || '');
    }
  }, [review]);

  const handleGenerateAI = async () => {
    try {
      const result = await generateAI.mutateAsync({
        reviewId,
        options: { tone: aiOptions.tone },
      });
      setResponse(result.aiResponse);
    } catch (err) {
      console.error('AI generation failed:', err);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await updateReview.mutateAsync({
        reviewId,
        data: { finalResponse: response },
      });
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handlePublish = async () => {
    try {
      await updateReview.mutateAsync({
        reviewId,
        data: { finalResponse: response, status: 'replied' },
      });
      router.push('/dashboard/reviews');
    } catch (err) {
      console.error('Publish failed:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

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

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>리뷰를 불러올 수 없습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusValue = (status: string): 'pending' | 'responded' => {
    return status === 'replied' ? 'responded' : 'pending';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="gap-2"
        onClick={() => router.push('/dashboard/reviews')}
      >
        <ArrowLeft className="h-4 w-4" />
        목록으로
      </Button>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Info */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} size="lg" showValue />
                  <PlatformBadge platform="google" />
                  <StatusBadge status={getStatusValue(review.status)} />
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatRelativeDate(review.reviewDate)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-wrap">
                  {review.content || '내용 없음'}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span>작성일: {formatDate(review.reviewDate)}</span>
                <Button variant="link" className="h-auto p-0 text-sm" asChild>
                  <a href="#" target="_blank" rel="noopener noreferrer">
                    원본 보기
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Response Editor */}
          <Card>
            <CardHeader>
              <CardTitle>응답 작성</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponseEditor
                response={response}
                onResponseChange={setResponse}
                aiOptions={aiOptions}
                onAIOptionsChange={setAIOptions}
                onGenerateAI={handleGenerateAI}
                onSaveDraft={handleSaveDraft}
                onPublish={handlePublish}
                isGeneratingAI={generateAI.isPending}
                isSaving={updateReview.isPending}
                isPublishing={updateReview.isPending}
              />
            </CardContent>
          </Card>

          {/* Response History */}
          {(review.aiResponseGeneratedAt || review.repliedAt) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">응답 히스토리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {review.repliedAt && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                        <Clock className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">응답 게시됨</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(review.repliedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  {review.aiResponseGeneratedAt && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">AI 응답 생성</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(review.aiResponseGeneratedAt)}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <Clock className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">리뷰 수신</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Reviewer Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">리뷰어 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                  {review.reviewerName.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{review.reviewerName}</p>
                  <p className="text-sm text-muted-foreground">Google 리뷰어</p>
                </div>
              </div>
              {review.reviewerProfileUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={review.reviewerProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    프로필 보기
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
