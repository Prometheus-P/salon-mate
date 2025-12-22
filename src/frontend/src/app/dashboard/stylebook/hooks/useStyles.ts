'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  analyzeImage,
  analyzeBase64Image,
  getStyleTags,
  getStyleStatistics,
  getStyleTag,
  getContentSuggestion,
  deleteStyleTag,
  type AnalyzeImageRequest,
  type AnalyzeBase64Request,
} from '@/lib/api/styles';

// ============== Query Keys ==============

export const styleKeys = {
  all: ['styles'] as const,
  lists: () => [...styleKeys.all, 'list'] as const,
  list: (shopId: string, filters?: object) =>
    [...styleKeys.lists(), shopId, filters] as const,
  details: () => [...styleKeys.all, 'detail'] as const,
  detail: (shopId: string, id: string) => [...styleKeys.details(), shopId, id] as const,
  statistics: (shopId: string) => [...styleKeys.all, 'statistics', shopId] as const,
  suggestion: (shopId: string, id: string) =>
    [...styleKeys.all, 'suggestion', shopId, id] as const,
};

// ============== Queries ==============

/**
 * 스타일 태그 목록 조회
 */
export function useStyleTags(
  shopId: string,
  options?: {
    serviceType?: string;
    styleCategory?: string;
    limit?: number;
    offset?: number;
  }
) {
  return useQuery({
    queryKey: styleKeys.list(shopId, options),
    queryFn: () => getStyleTags(shopId, options),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 스타일 통계 조회
 */
export function useStyleStatistics(shopId: string) {
  return useQuery({
    queryKey: styleKeys.statistics(shopId),
    queryFn: () => getStyleStatistics(shopId),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 특정 스타일 태그 조회
 */
export function useStyleTag(shopId: string, styleTagId: string) {
  return useQuery({
    queryKey: styleKeys.detail(shopId, styleTagId),
    queryFn: () => getStyleTag(shopId, styleTagId),
    enabled: !!shopId && !!styleTagId,
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 콘텐츠 제안 조회
 */
export function useContentSuggestion(shopId: string, styleTagId: string) {
  return useQuery({
    queryKey: styleKeys.suggestion(shopId, styleTagId),
    queryFn: () => getContentSuggestion(shopId, styleTagId),
    enabled: !!shopId && !!styleTagId,
    staleTime: 1000 * 60 * 10, // 10분
  });
}

// ============== Mutations ==============

/**
 * 이미지 분석
 */
export function useAnalyzeImage(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AnalyzeImageRequest) => analyzeImage(shopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: styleKeys.statistics(shopId) });
    },
  });
}

/**
 * Base64 이미지 분석
 */
export function useAnalyzeBase64Image(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AnalyzeBase64Request) => analyzeBase64Image(shopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: styleKeys.statistics(shopId) });
    },
  });
}

/**
 * 스타일 태그 삭제
 */
export function useDeleteStyleTag(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (styleTagId: string) => deleteStyleTag(shopId, styleTagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: styleKeys.lists() });
      queryClient.invalidateQueries({ queryKey: styleKeys.statistics(shopId) });
    },
  });
}
