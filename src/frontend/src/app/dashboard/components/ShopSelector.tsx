'use client';

/**
 * ShopSelector - Dropdown for selecting which shop to view in dashboard
 * Implements FR-016: Multi-shop owners with shop selection capability
 */

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUserShops } from '../hooks/useDashboard';

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

  if (!data?.shops || data.shops.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No shops found
      </div>
    );
  }

  const selectedShop = data.shops.find((s) => s.id === selectedShopId);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="shop-select" className="text-sm font-medium text-gray-700">
        Shop:
      </label>
      <select
        id="shop-select"
        value={selectedShopId || ''}
        onChange={(e) => onShopChange(e.target.value)}
        className="h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {data.shops.map((shop) => (
          <option key={shop.id} value={shop.id}>
            {shop.name} ({shop.type})
          </option>
        ))}
      </select>
      {selectedShop && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          {selectedShop.has_reviews && (
            <span className="rounded bg-green-100 px-1.5 py-0.5 text-green-700">
              Reviews
            </span>
          )}
          {selectedShop.has_posts && (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700">
              Posts
            </span>
          )}
        </div>
      )}
    </div>
  );
}
