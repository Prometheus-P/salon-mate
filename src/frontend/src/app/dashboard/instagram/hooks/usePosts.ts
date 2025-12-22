'use client';

/**
 * TanStack Query hooks for posts data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPosts,
  getPostById,
  getPostStats,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  duplicatePost,
  generateAICaption,
  getRecommendedHashtags,
  getOptimalTimes,
  type Post,
  type PostListResponse,
  type PostStatsResponse,
  type PostCreateRequest,
  type PostUpdateRequest,
  type AICaptionRequest,
  type AICaptionResponse,
  type HashtagRecommendation,
  type PostStatus,
} from '@/lib/api/posts';

// ============== Query Keys ==============

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (shopId: string, status?: PostStatus) =>
    [...postKeys.lists(), shopId, status] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (shopId: string, postId: string) =>
    [...postKeys.details(), shopId, postId] as const,
  stats: (shopId: string) => [...postKeys.all, 'stats', shopId] as const,
  hashtags: (shopId: string) => [...postKeys.all, 'hashtags', shopId] as const,
  optimalTimes: (shopId: string) =>
    [...postKeys.all, 'optimalTimes', shopId] as const,
};

// ============== Post List ==============

export function usePosts(
  shopId: string | null,
  params: { status?: PostStatus; limit?: number; offset?: number } = {}
) {
  return useQuery<PostListResponse>({
    queryKey: postKeys.list(shopId ?? '', params.status),
    queryFn: () => getPosts(shopId!, params),
    enabled: !!shopId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============== Post Detail ==============

export function usePostDetail(shopId: string | null, postId: string | null) {
  return useQuery<Post>({
    queryKey: postKeys.detail(shopId ?? '', postId ?? ''),
    queryFn: () => getPostById(shopId!, postId!),
    enabled: !!shopId && !!postId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============== Post Stats ==============

export function usePostStats(shopId: string | null) {
  return useQuery<PostStatsResponse>({
    queryKey: postKeys.stats(shopId ?? ''),
    queryFn: () => getPostStats(shopId!),
    enabled: !!shopId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============== Create Post ==============

export function useCreatePost(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, PostCreateRequest>({
    mutationFn: (data) => createPost(shopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.stats(shopId) });
    },
  });
}

// ============== Update Post ==============

export function useUpdatePost(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, { postId: string; data: PostUpdateRequest }>({
    mutationFn: ({ postId, data }) => updatePost(shopId, postId, data),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(
        postKeys.detail(shopId, updatedPost.id),
        updatedPost
      );
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    },
  });
}

// ============== Delete Post ==============

export function useDeletePost(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (postId) => deletePost(shopId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.stats(shopId) });
    },
  });
}

// ============== Publish Post ==============

export function usePublishPost(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, string>({
    mutationFn: (postId) => publishPost(shopId, postId),
    onSuccess: (updatedPost) => {
      queryClient.setQueryData(
        postKeys.detail(shopId, updatedPost.id),
        updatedPost
      );
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.stats(shopId) });
    },
  });
}

// ============== Duplicate Post ==============

export function useDuplicatePost(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<Post, Error, string>({
    mutationFn: (postId) => duplicatePost(shopId, postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
      queryClient.invalidateQueries({ queryKey: postKeys.stats(shopId) });
    },
  });
}

// ============== AI Caption Generation ==============

export function useGenerateAICaption(shopId: string) {
  return useMutation<AICaptionResponse, Error, AICaptionRequest>({
    mutationFn: (request) => generateAICaption(shopId, request),
  });
}

// ============== Hashtag Recommendations ==============

export function useHashtagRecommendations(shopId: string | null) {
  return useQuery<HashtagRecommendation>({
    queryKey: postKeys.hashtags(shopId ?? ''),
    queryFn: () => getRecommendedHashtags(shopId!),
    enabled: !!shopId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============== Optimal Times ==============

export function useOptimalTimes(shopId: string | null) {
  return useQuery<{ times: Array<{ day: string; time: string; reason: string }> }>({
    queryKey: postKeys.optimalTimes(shopId ?? ''),
    queryFn: () => getOptimalTimes(shopId!),
    enabled: !!shopId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}
