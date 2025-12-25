'use client';

/**
 * ShopSidebar - Sidebar navigation for multi-shop management (Agency Mode)
 * Displays all shops with pending review counts and quick navigation
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useShopsWithStats } from '../hooks/useDashboard';
import { Search, Inbox, Store, ChevronRight } from 'lucide-react';

interface ShopSidebarProps {
  selectedShopId: string | null;
  onShopChange: (shopId: string) => void;
}

// Navigation items
const navigation = [
  { name: '대시보드', href: '/dashboard', icon: '📊' },
  { name: '리뷰 관리', href: '/dashboard/reviews', icon: '⭐' },
  { name: '인스타그램', href: '/dashboard/instagram', icon: '📸' },
  { name: '설정', href: '/dashboard/settings', icon: '⚙️' },
];

export function ShopSidebar({ selectedShopId, onShopChange }: ShopSidebarProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, error } = useShopsWithStats();

  // Filter shops based on search query
  const filteredShops = useMemo(() => {
    const shops = data?.shops ?? [];
    if (shops.length === 0) return [];
    if (!searchQuery.trim()) return shops;

    const query = searchQuery.toLowerCase();
    return shops.filter(
      (shop) =>
        shop.name.toLowerCase().includes(query) ||
        shop.type.toLowerCase().includes(query)
    );
  }, [data?.shops, searchQuery]);

  // Get shop type label in Korean
  const getShopTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hair: '헤어샵',
      nail: '네일샵',
      skin: '피부관리',
      lash: '속눈썹',
    };
    return labels[type] || type;
  };

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold text-gray-900">
          SalonMate
        </Link>
      </div>

      {/* Global Inbox Link */}
      <div className="border-b p-3">
        <Link
          href="/dashboard/inbox"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            pathname === '/dashboard/inbox'
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Inbox className="h-5 w-5" />
          <span className="flex-1">전체 인박스</span>
          {data?.totalPending ? (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
              {data.totalPending > 99 ? '99+' : data.totalPending}
            </span>
          ) : null}
        </Link>
      </div>

      {/* Shop Search */}
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="샵 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Shop List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            내 매장
          </span>
          <span className="text-xs text-gray-400">
            {filteredShops.length}개
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            매장 목록을 불러오는데 실패했습니다
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-500">
            {searchQuery ? '검색 결과가 없습니다' : '등록된 매장이 없습니다'}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredShops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => onShopChange(shop.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  selectedShopId === shop.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm">
                  <Store className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{shop.name}</p>
                  <p className="text-xs text-gray-500">
                    {getShopTypeLabel(shop.type)}
                  </p>
                </div>
                {shop.pendingCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1.5 text-xs font-medium text-red-700">
                    {shop.pendingCount}
                  </span>
                )}
                {selectedShopId === shop.id && (
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="border-t p-3">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={
                item.href === '/dashboard' || !selectedShopId
                  ? item.href
                  : `${item.href}?shopId=${selectedShopId}`
              }
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href || pathname.startsWith(item.href + '/')
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
