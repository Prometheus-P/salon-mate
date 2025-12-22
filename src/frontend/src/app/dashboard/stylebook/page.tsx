'use client';

import { useSearchParams } from 'next/navigation';
import { StyleGrid } from './components/StyleGrid';
import { useShopStore } from '@/stores/shopStore';

export default function StylebookPage() {
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
