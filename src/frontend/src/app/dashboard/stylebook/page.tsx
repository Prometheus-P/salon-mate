'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StyleGrid } from './components/StyleGrid';
import { useShopStore } from '@/stores/shopStore';

function StylebookContent() {
  const searchParams = useSearchParams();
  const { selectedShopId } = useShopStore();

  // URL 파라미터 또는 스토어에서 shopId 가져오기
  const shopId = searchParams.get('shopId') || selectedShopId;

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h2 className="mb-2 text-lg font-medium text-gray-900">
          매장을 선택해주세요
        </h2>
        <p className="text-sm text-gray-500">
          스타일북을 보려면 먼저 매장을 선택해야 합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <StyleGrid shopId={shopId} />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-200" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StylebookPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StylebookContent />
    </Suspense>
  );
}
