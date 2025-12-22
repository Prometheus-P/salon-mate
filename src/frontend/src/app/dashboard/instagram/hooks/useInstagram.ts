'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  disconnectInstagram,
  getInstagramStatus,
  getShopInstagramStatus,
  startInstagramOAuth,
} from '@/lib/api/instagram';

// ============== Query Keys ==============

export const instagramKeys = {
  all: ['instagram'] as const,
  status: () => [...instagramKeys.all, 'status'] as const,
  shopStatus: (shopId: string) => [...instagramKeys.all, 'shop', shopId, 'status'] as const,
};

// ============== Queries ==============

/**
 * 현재 사용자의 Instagram 연결 상태
 */
export function useInstagramStatus() {
  return useQuery({
    queryKey: instagramKeys.status(),
    queryFn: getInstagramStatus,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 특정 Shop의 Instagram 연결 상태
 */
export function useShopInstagramStatus(shopId: string) {
  return useQuery({
    queryKey: instagramKeys.shopStatus(shopId),
    queryFn: () => getShopInstagramStatus(shopId),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

// ============== Mutations ==============

/**
 * Instagram OAuth 시작
 */
export function useStartInstagramOAuth() {
  return useMutation({
    mutationFn: (redirectUri: string) => startInstagramOAuth(redirectUri),
    onSuccess: (data) => {
      // OAuth URL로 리다이렉트
      window.location.href = data.oauth_url;
    },
  });
}

/**
 * Instagram 연결 해제
 */
export function useDisconnectInstagram() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disconnectInstagram,
    onSuccess: () => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: instagramKeys.all });
    },
  });
}
