'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { StarRating } from '@/components/common/StarRating';
import { PlatformBadge, StatusBadge } from '@/components/common/PlatformBadge';
import { cn } from '@/lib/utils';
import type { Review } from '@/lib/api/reviews';

interface ReviewListProps {
  reviews: Review[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onGenerateAI: (reviewId: string) => void;
  isGeneratingAI?: boolean;
  generatingReviewId?: string;
  className?: string;
}

export function ReviewList({
  reviews,
  total,
  page,
  pageSize,
  onPageChange,
  onGenerateAI,
  isGeneratingAI = false,
  generatingReviewId,
  className,
}: ReviewListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const totalPages = Math.ceil(total / pageSize);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.id)));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;

    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const truncateContent = (content: string | null, maxLength: number = 80) => {
    if (!content) return '내용 없음';
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
  };

  const getStatusValue = (status: string): 'pending' | 'responded' => {
    return status === 'replied' ? 'responded' : 'pending';
  };

  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">리뷰가 없습니다</h3>
        <p className="text-sm text-muted-foreground mt-1">
          리뷰 플랫폼을 연동하면 고객 리뷰가 자동으로 수집됩니다
        </p>
        <Button className="mt-4" variant="outline">
          플랫폼 연동하기
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    reviews.length > 0 && selectedIds.size === reviews.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[100px]">평점</TableHead>
              <TableHead className="w-[120px]">작성자</TableHead>
              <TableHead className="w-[80px]">플랫폼</TableHead>
              <TableHead className="w-[100px]">작성일</TableHead>
              <TableHead className="w-[80px]">상태</TableHead>
              <TableHead>내용</TableHead>
              <TableHead className="w-[120px]">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow
                key={review.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  router.push(`/dashboard/reviews/${review.id}`)
                }
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(review.id)}
                    onCheckedChange={() => toggleSelect(review.id)}
                  />
                </TableCell>
                <TableCell>
                  <StarRating rating={review.rating} size="sm" />
                </TableCell>
                <TableCell className="font-medium">
                  {review.reviewerName}
                </TableCell>
                <TableCell>
                  <PlatformBadge platform="google" size="sm" />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(review.reviewDate)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={getStatusValue(review.status)} size="sm" />
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <span className="text-muted-foreground">
                    {truncateContent(review.content)}
                  </span>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        router.push(`/dashboard/reviews/${review.id}`)
                      }
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {review.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onGenerateAI(review.id)}
                        disabled={isGeneratingAI && generatingReviewId === review.id}
                      >
                        <Sparkles
                          className={cn(
                            'h-4 w-4',
                            isGeneratingAI &&
                              generatingReviewId === review.id &&
                              'animate-pulse'
                          )}
                        />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            총 {total}개 중 {(page - 1) * pageSize + 1}-
            {Math.min(page * pageSize, total)}개
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(page - 1)}
                  className={cn(
                    page === 1 && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={page === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              {totalPages > 5 && (
                <>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink onClick={() => onPageChange(totalPages)}>
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(page + 1)}
                  className={cn(
                    page === totalPages && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
