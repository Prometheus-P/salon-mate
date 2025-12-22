'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Store, Link2, Bell, CreditCard, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsNavItems = [
  {
    title: '프로필',
    href: '/dashboard/settings',
    icon: User,
    description: '계정 정보 관리',
  },
  {
    title: '샵 관리',
    href: '/dashboard/settings/shops',
    icon: Store,
    description: '등록된 샵 관리',
  },
  {
    title: '플랫폼 연동',
    href: '/dashboard/settings/integrations',
    icon: Link2,
    description: '리뷰/SNS 연동',
  },
  {
    title: '알림 설정',
    href: '/dashboard/settings/notifications',
    icon: Bell,
    description: '알림 환경설정',
  },
  {
    title: '구독 & 결제',
    href: '/dashboard/settings/billing',
    icon: CreditCard,
    description: '플랜 및 결제',
  },
  {
    title: '팀 관리',
    href: '/dashboard/settings/team',
    icon: Users,
    description: '팀원 초대/관리',
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] gap-6 p-6">
      {/* Sidebar Navigation */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <nav className="sticky top-6 space-y-1">
          {settingsNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <div className="flex-1">
                  <div className="font-medium">{item.title}</div>
                  {!isActive && (
                    <div className="text-xs text-muted-foreground">
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
