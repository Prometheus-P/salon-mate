'use client';

import { useState } from 'react';
import { ImagePlus, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StyleCard } from './StyleCard';
import { StyleUploader } from './StyleUploader';
import { useStyleTags, useStyleStatistics } from '../hooks/useStyles';

interface StyleGridProps {
  shopId: string;
}

// 서비스 타입 옵션
const SERVICE_TYPES = [
  { value: '', label: '전체 서비스' },
  { value: 'nail', label: '네일' },
  { value: 'hair', label: '헤어' },
  { value: 'makeup', label: '메이크업' },
  { value: 'lash', label: '속눈썹' },
  { value: 'skin', label: '피부관리' },
];

// 스타일 카테고리 옵션
const STYLE_CATEGORIES = [
  { value: '', label: '전체 스타일' },
  { value: 'minimal', label: '미니멀' },
  { value: 'luxury', label: '럭셔리' },
  { value: 'trendy', label: '트렌디' },
  { value: 'classic', label: '클래식' },
  { value: 'natural', label: '내추럴' },
  { value: 'cute', label: '큐트' },
  { value: 'chic', label: '시크' },
  { value: 'elegant', label: '엘레강스' },
];

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-full bg-purple-100 p-4">
        <ImagePlus className="h-8 w-8 text-purple-600" />
      </div>
      <h3 className="mb-2 text-lg font-medium text-gray-900">
        스타일북이 비어있습니다
      </h3>
      <p className="mb-6 max-w-sm text-sm text-gray-500">
        시술 사진을 업로드하면 AI가 자동으로 스타일을 분석하고 태그를 생성합니다.
      </p>
      <Button onClick={onUpload}>
        <ImagePlus className="mr-2 h-4 w-4" />
        첫 스타일 추가하기
      </Button>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square rounded-lg bg-gray-200" />
          <div className="mt-2 space-y-2 p-2">
            <div className="flex gap-1">
              <div className="h-5 w-12 rounded-full bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-200" />
            </div>
            <div className="flex gap-1">
              <div className="h-4 w-4 rounded-full bg-gray-200" />
              <div className="h-4 w-4 rounded-full bg-gray-200" />
              <div className="h-4 w-4 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StyleGrid({ shopId }: StyleGridProps) {
  const [isUploaderOpen, setUploaderOpen] = useState(false);
  const [serviceType, setServiceType] = useState('');
  const [styleCategory, setStyleCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, error, refetch } = useStyleTags(shopId, {
    serviceType: serviceType || undefined,
    styleCategory: styleCategory || undefined,
    limit,
    offset: page * limit,
  });

  const { data: stats } = useStyleStatistics(shopId);

  const handleUploadComplete = () => {
    setUploaderOpen(false);
    refetch();
  };

  const hasFilters = serviceType || styleCategory;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">스타일북</h1>
          <p className="text-sm text-gray-500">
            {stats?.total_count || 0}개의 스타일이 등록되어 있습니다
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={hasFilters ? 'border-purple-500 text-purple-600' : ''}
          >
            <Filter className="mr-2 h-4 w-4" />
            필터
            {hasFilters && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-xs">
                {(serviceType ? 1 : 0) + (styleCategory ? 1 : 0)}
              </span>
            )}
          </Button>
          <Button onClick={() => setUploaderOpen(true)}>
            <ImagePlus className="mr-2 h-4 w-4" />
            스타일 추가
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              서비스 유형
            </label>
            <div className="relative">
              <select
                value={serviceType}
                onChange={(e) => {
                  setServiceType(e.target.value);
                  setPage(0);
                }}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {SERVICE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          <div className="min-w-[150px]">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              스타일 카테고리
            </label>
            <div className="relative">
              <select
                value={styleCategory}
                onChange={(e) => {
                  setStyleCategory(e.target.value);
                  setPage(0);
                }}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                {STYLE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {hasFilters && (
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setServiceType('');
                  setStyleCategory('');
                  setPage(0);
                }}
              >
                필터 초기화
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Statistics Summary */}
      {stats && stats.total_count > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(stats.by_service_type).slice(0, 4).map(([type, count]) => (
            <div
              key={type}
              className="rounded-lg border border-gray-200 bg-white p-4 text-center"
            >
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-500">
                {SERVICE_TYPES.find((t) => t.value === type)?.label || type}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">스타일 목록을 불러오는데 실패했습니다.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      ) : !data?.style_tags || data.style_tags.length === 0 ? (
        <EmptyState onUpload={() => setUploaderOpen(true)} />
      ) : (
        <>
          {/* Grid */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {data.style_tags.map((styleTag) => (
              <StyleCard key={styleTag.id} styleTag={styleTag} shopId={shopId} />
            ))}
          </div>

          {/* Pagination */}
          {data.total > limit && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                이전
              </Button>
              <span className="text-sm text-gray-500">
                {page + 1} / {Math.ceil(data.total / limit)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= data.total}
              >
                다음
              </Button>
            </div>
          )}
        </>
      )}

      {/* Uploader Modal */}
      <StyleUploader
        shopId={shopId}
        isOpen={isUploaderOpen}
        onClose={() => setUploaderOpen(false)}
        onComplete={handleUploadComplete}
      />
    </div>
  );
}
