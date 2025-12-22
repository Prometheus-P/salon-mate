'use client';

import { useState, useEffect } from 'react';
import { Instagram, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useInstagramStatus,
  useStartInstagramOAuth,
  useDisconnectInstagram,
} from '../hooks/useInstagram';
import { toast } from 'sonner';

interface InstagramConnectProps {
  onConnected?: () => void;
}

export function InstagramConnect({ onConnected }: InstagramConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const { data: status, isLoading, refetch } = useInstagramStatus();
  const startOAuth = useStartInstagramOAuth();
  const disconnect = useDisconnectInstagram();

  // URL에서 OAuth 콜백 결과 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        refetch();
        onConnected?.();
        // URL에서 쿼리 파라미터 제거
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [refetch, onConnected]);

  const handleConnect = () => {
    setIsConnecting(true);
    // 현재 URL을 redirect_uri로 사용
    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    startOAuth.mutate(redirectUri, {
      onError: (error) => {
        toast.error('Instagram 연결 시작 실패', {
          description: error.message,
        });
        setIsConnecting(false);
      },
    });
  };

  const handleDisconnect = () => {
    disconnect.mutate(undefined, {
      onSuccess: () => {
        toast.success('Instagram 연결이 해제되었습니다.');
      },
      onError: (error) => {
        toast.error('연결 해제 실패', {
          description: error.message,
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6 border rounded-lg bg-muted/50">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isConnected = status?.connected;

  return (
    <div className="border rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
          <Instagram className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="font-semibold">Instagram Business</h3>
          <p className="text-sm text-muted-foreground">
            인스타그램 비즈니스 계정을 연결하여 자동 포스팅을 활성화하세요
          </p>
        </div>
      </div>

      {/* Status */}
      {isConnected ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/50 rounded-lg border border-green-200 dark:border-green-900">
          <Check className="h-5 w-5 text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              연결됨: @{status.username}
            </p>
            {status.expires_at && (
              <p className="text-xs text-green-600 dark:text-green-400">
                토큰 만료: {new Date(status.expires_at).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
          {status.profile_picture_url && (
            <img
              src={status.profile_picture_url}
              alt={status.username || 'Profile'}
              className="h-10 w-10 rounded-full"
            />
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/50 rounded-lg border border-yellow-200 dark:border-yellow-900">
          <AlertCircle className="h-5 w-5 text-yellow-600" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Instagram이 연결되지 않았습니다. 포스트 발행을 위해 연결해주세요.
          </p>
        </div>
      )}

      {/* Requirements */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">연결 요구사항:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Instagram 비즈니스 또는 크리에이터 계정</li>
          <li>Facebook 페이지에 연결된 Instagram 계정</li>
          <li>Facebook 비즈니스 관리자 권한</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {isConnected ? (
          <>
            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              연결 해제
            </Button>
            <Button variant="outline" asChild>
              <a
                href={`https://instagram.com/${status.username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                프로필 보기
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isConnecting || startOAuth.isPending}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:from-purple-600 hover:via-pink-600 hover:to-orange-500"
          >
            {(isConnecting || startOAuth.isPending) && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Instagram className="h-4 w-4 mr-2" />
            Instagram 연결하기
          </Button>
        )}
      </div>

      {/* Help Link */}
      <p className="text-xs text-muted-foreground">
        연결에 문제가 있으신가요?{' '}
        <a
          href="https://developers.facebook.com/docs/instagram-api/getting-started"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          설정 가이드 보기
        </a>
      </p>
    </div>
  );
}
