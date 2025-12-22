'use client';

import { Search, Filter, ArrowUpDown, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ReviewStatus } from '@/lib/api/reviews';

interface QuickFilterCounts {
  all: number;
  pending: number;
  replied: number;
  negative: number;
}

interface ReviewFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ReviewStatus | 'all' | 'negative';
  onStatusChange: (value: ReviewStatus | 'all' | 'negative') => void;
  sort: string;
  onSortChange: (value: string) => void;
  counts: QuickFilterCounts;
  onExport: () => void;
  isExporting?: boolean;
  className?: string;
}

export function ReviewFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
  counts,
  onExport,
  isExporting = false,
  className,
}: ReviewFiltersProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="리뷰 내용, 작성자 검색..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                필터
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">플랫폼</label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Google
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Naver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      카카오
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">평점</label>
                  <div className="flex gap-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Button
                        key={rating}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger className="w-[140px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="oldest">오래된순</SelectItem>
              <SelectItem value="rating_high">평점 높은순</SelectItem>
              <SelectItem value="rating_low">평점 낮은순</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            내보내기
          </Button>
        </div>
      </div>

      {/* Quick Filters (Tabs) */}
      <Tabs
        value={status}
        onValueChange={(v) => onStatusChange(v as ReviewStatus | 'all' | 'negative')}
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            전체
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {counts.all}
            </span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            미응답
            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs text-orange-700">
              {counts.pending}
            </span>
          </TabsTrigger>
          <TabsTrigger value="replied" className="gap-2">
            응답완료
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              {counts.replied}
            </span>
          </TabsTrigger>
          <TabsTrigger value="negative" className="gap-2">
            부정적
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
              {counts.negative}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
