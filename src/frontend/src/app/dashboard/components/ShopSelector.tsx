'use client';

/**
 * ShopSelector - Dropdown for selecting which shop to view in dashboard
 * Implements FR-016: Multi-shop owners with shop selection capability
 */

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserShops } from '../hooks/useDashboard';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';

interface ShopSelectorProps {
  selectedShopId: string | null;
  onShopChange: (shopId: string) => void;
}

export function ShopSelector({ selectedShopId, onShopChange }: ShopSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, isLoading, error } = useUserShops();

  // Sync URL with selected shop
  useEffect(() => {
    if (selectedShopId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('shopId', selectedShopId);
      router.replace(`/dashboard?${params.toString()}`);
    }
  }, [selectedShopId, router, searchParams]);

  // Auto-select first shop if none selected
  useEffect(() => {
    if (!selectedShopId && data?.shops && data.shops.length > 0) {
      // Check URL for shopId first
      const urlShopId = searchParams.get('shopId');
      if (urlShopId && data.shops.some((s) => s.id === urlShopId)) {
        onShopChange(urlShopId);
      } else {
        // Check localStorage for last selected shop
        const lastShopId = localStorage.getItem('lastSelectedShopId');
        if (lastShopId && data.shops.some((s) => s.id === lastShopId)) {
          onShopChange(lastShopId);
        } else {
          // Default to first shop
          onShopChange(data.shops[0].id);
        }
      }
    }
  }, [selectedShopId, data, searchParams, onShopChange]);

  // Persist selection to localStorage
  useEffect(() => {
    if (selectedShopId) {
      localStorage.setItem('lastSelectedShopId', selectedShopId);
    }
  }, [selectedShopId]);

  const shops = data?.shops;
  const selectedShop = useMemo(() => {
    if (!shops || shops.length === 0) return null;
    return shops.find((s) => s.id === selectedShopId) ?? shops[0];
  }, [shops, selectedShopId]);

  if (isLoading) {
    return (
      <div className="h-10 w-48 animate-pulse rounded-md bg-gray-200" />
    );
  }

  if (error) {
    return (
      <div className="text-sm text-red-600">
        Failed to load shops
      </div>
    );
  }

  if (!shops || shops.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No shops found
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col">
        <Label htmlFor="shop-select" className="text-sm text-gray-600">
          워크스페이스
        </Label>
        <Select
          value={selectedShop?.id}
          onValueChange={(value) => onShopChange(value)}
        >
          <SelectTrigger id="shop-select" className="w-60">
            <SelectValue placeholder="샵을 선택하세요" />
          </SelectTrigger>
          <SelectContent align="start">
            {shops.map((shop) => (
              <SelectItem
                key={shop.id}
                value={shop.id}
                className="flex-col items-start"
              >
                <span className="font-medium text-gray-900">{shop.name}</span>
                <span className="text-xs text-gray-500">{shop.type}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedShop && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="border border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Info className="h-4 w-4" />
              샵 인사이트
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3 text-sm" align="end">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">선택된 샵</p>
              <p className="text-base font-semibold text-gray-900">{selectedShop.name}</p>
              <p className="text-xs text-gray-500">{selectedShop.type}</p>
            </div>
            <div className="flex gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  selectedShop.has_reviews
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                리뷰 연동
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  selectedShop.has_posts
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                콘텐츠 스튜디오
              </span>
            </div>
            <p className="text-xs text-gray-500">
              마지막 방문한 샵은 브라우저에 저장되어 다음 접속 시 자동으로 불러옵니다.
            </p>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
