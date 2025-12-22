'use client';

import * as React from 'react';
import { Plus, Store, MapPin, Phone, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  isDefault: boolean;
  integrations: string[];
}

export default function ShopsSettingsPage() {
  const [isLoading] = React.useState(false);

  // Mock shops data - TODO: Replace with actual API data
  const displayShops: Shop[] = [
    {
      id: '1',
      name: '헤어샵 강남점',
      address: '서울시 강남구 역삼동 123-45',
      phone: '02-1234-5678',
      isDefault: true,
      integrations: ['google', 'naver', 'instagram'],
    },
    {
      id: '2',
      name: '헤어샵 홍대점',
      address: '서울시 마포구 서교동 789-12',
      phone: '02-9876-5432',
      isDefault: false,
      integrations: ['google', 'kakao'],
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="샵 관리" description="등록된 매장을 관리하세요" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="샵 관리"
        description="등록된 매장을 관리하세요"
        action={
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            샵 추가
          </Button>
        }
      />

      {displayShops.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Store className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">등록된 샵이 없습니다</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            첫 번째 매장을 등록해보세요
          </p>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            샵 추가
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {displayShops.map((shop: Shop) => (
            <Card key={shop.id} className="relative">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {shop.name}
                      {shop.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          기본
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      편집
                    </DropdownMenuItem>
                    {!shop.isDefault && (
                      <DropdownMenuItem>기본 샵으로 설정</DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{shop.address}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>{shop.phone}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-xs text-muted-foreground">연동:</span>
                  <div className="flex gap-1">
                    {shop.integrations.map((platform: string) => (
                      <Badge key={platform} variant="outline" className="text-xs">
                        {platform}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Shop Card */}
          <Card className="flex flex-col items-center justify-center p-6 border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="rounded-full bg-primary/10 p-3 mb-3">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">새 샵 추가</p>
            <p className="text-xs text-muted-foreground mt-1">
              새로운 매장을 등록하세요
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
