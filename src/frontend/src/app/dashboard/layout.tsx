'use client';

import type { ReactNode } from 'react';
import { useCallback, useSyncExternalStore } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ShopSidebar } from './components/ShopSidebar';
import { useShopStore } from '@/stores/shopStore';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Helper to safely get selectedShopId with hydration handling
function useHydratedShopId() {
  const store = useShopStore;
  return useSyncExternalStore(
    store.subscribe,
    () => store.getState().selectedShopId,
    () => null // Server snapshot returns null
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedShopId = useHydratedShopId();
  const setSelectedShopId = useShopStore((s) => s.setSelectedShopId);

  // Handle shop selection
  const handleShopChange = useCallback(
    (shopId: string) => {
      setSelectedShopId(shopId);

      // Update URL with new shopId
      const params = new URLSearchParams(searchParams.toString());
      params.set('shopId', shopId);
      router.replace(`?${params.toString()}`);
    },
    [setSelectedShopId, searchParams, router]
  );

  return (
    <div className="flex min-h-screen">
      {/* Shop Sidebar */}
      <ShopSidebar
        selectedShopId={selectedShopId}
        onShopChange={handleShopChange}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
}
