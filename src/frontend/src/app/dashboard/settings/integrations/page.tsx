'use client';

import * as React from 'react';
import { RefreshCw, Link2, Unlink, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useSyncIntegration,
} from '../hooks/useSettings';
import type { IntegrationPlatform, IntegrationStatus } from '@/lib/api/settings';

const platformInfo: Record<
  IntegrationPlatform,
  { name: string; description: string; icon: string; color: string }
> = {
  google: {
    name: 'Google 비즈니스',
    description: 'Google 지도 리뷰를 자동으로 수집합니다',
    icon: '🔍',
    color: 'bg-blue-50 border-blue-200',
  },
  naver: {
    name: '네이버 플레이스',
    description: '네이버 플레이스 리뷰를 수집합니다',
    icon: '🟢',
    color: 'bg-green-50 border-green-200',
  },
  kakao: {
    name: '카카오맵',
    description: '카카오맵 리뷰를 수집합니다',
    icon: '💬',
    color: 'bg-yellow-50 border-yellow-200',
  },
  instagram: {
    name: 'Instagram',
    description: '인스타그램 비즈니스 계정을 연동합니다',
    icon: '📷',
    color: 'bg-pink-50 border-pink-200',
  },
  facebook: {
    name: 'Facebook',
    description: '페이스북 페이지를 연동합니다',
    icon: '👤',
    color: 'bg-blue-50 border-blue-200',
  },
  openai: {
    name: 'OpenAI',
    description: 'AI 기능을 위한 API 연동',
    icon: '🤖',
    color: 'bg-purple-50 border-purple-200',
  },
};

const statusConfig: Record<IntegrationStatus, { label: string; variant: 'default' | 'secondary' | 'error' | 'outline'; icon: React.ReactNode }> = {
  connected: { label: '연결됨', variant: 'default', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  disconnected: { label: '미연결', variant: 'secondary', icon: <Unlink className="h-3.5 w-3.5" /> },
  error: { label: '오류', variant: 'error', icon: <XCircle className="h-3.5 w-3.5" /> },
  syncing: { label: '동기화중', variant: 'outline', icon: <RefreshCw className="h-3.5 w-3.5 animate-spin" /> },
};

export default function IntegrationsSettingsPage() {
  const { data: integrations, isLoading, error } = useIntegrations();
  const connectIntegration = useConnectIntegration();
  const disconnectIntegration = useDisconnectIntegration();
  const syncIntegration = useSyncIntegration();

  const [syncingId, setSyncingId] = React.useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = React.useState<IntegrationPlatform | null>(null);

  const handleConnect = async (platform: IntegrationPlatform) => {
    setConnectingPlatform(platform);
    try {
      await connectIntegration.mutateAsync(platform);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (confirm('정말로 연동을 해제하시겠습니까?')) {
      await disconnectIntegration.mutateAsync(integrationId);
    }
  };

  const handleSync = async (integrationId: string) => {
    setSyncingId(integrationId);
    try {
      await syncIntegration.mutateAsync(integrationId);
    } finally {
      setSyncingId(null);
    }
  };

  const formatLastSync = (dateStr: string | null) => {
    if (!dateStr) return '동기화 기록 없음';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}분 전`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    return date.toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="플랫폼 연동" description="리뷰 플랫폼과 SNS를 연동하세요" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="플랫폼 연동" description="리뷰 플랫폼과 SNS를 연동하세요" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            연동 정보를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Map integrations by platform
  const integrationMap = new Map(
    integrations?.map((i) => [i.platform, i]) || []
  );

  // All available platforms
  const allPlatforms: IntegrationPlatform[] = [
    'google',
    'naver',
    'kakao',
    'instagram',
    'facebook',
    'openai',
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="플랫폼 연동"
        description="리뷰 플랫폼과 SNS를 연동하세요"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {allPlatforms.map((platform) => {
          const info = platformInfo[platform];
          const integration = integrationMap.get(platform);
          const status = integration?.status || 'disconnected';
          const statusInfo = statusConfig[status];

          return (
            <Card key={platform} className={integration ? info.color : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <CardTitle className="text-base">{info.name}</CardTitle>
                      <Badge
                        variant={statusInfo.variant}
                        className="mt-1 gap-1"
                      >
                        {statusInfo.icon}
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {info.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {integration && status === 'connected' ? (
                  <div className="space-y-3">
                    {integration.accountName && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">계정:</span>{' '}
                        {integration.accountName}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      마지막 동기화: {formatLastSync(integration.lastSyncedAt)}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleSync(integration.id)}
                        disabled={syncingId === integration.id}
                      >
                        {syncingId === integration.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        동기화
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : integration && status === 'error' ? (
                  <div className="space-y-3">
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">
                        {integration.errorMessage || '연결 오류가 발생했습니다'}
                      </AlertDescription>
                    </Alert>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleConnect(platform)}
                      disabled={connectingPlatform === platform}
                    >
                      {connectingPlatform === platform ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Link2 className="mr-2 h-4 w-4" />
                      )}
                      다시 연결
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleConnect(platform)}
                    disabled={connectingPlatform === platform}
                  >
                    {connectingPlatform === platform ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    연결하기
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
