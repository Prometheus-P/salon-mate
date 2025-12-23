'use client';

/**
 * TanStack Query hooks for media data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMediaList,
  getMediaById,
  uploadMedia,
  deleteMedia,
  deleteMediaBulk,
  moveMedia,
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  type MediaItem,
  type MediaListResponse,
  type MediaFolder,
  type MediaFolderListResponse,
  type MediaType,
  type MediaSource,
  type MediaUploadResponse,
} from '@/lib/api/media';

// ============== Query Keys ==============

export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (shopId: string, filters?: { type?: MediaType; source?: MediaSource; folderId?: string | null }) =>
    [...mediaKeys.lists(), shopId, filters] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (shopId: string, mediaId: string) => [...mediaKeys.details(), shopId, mediaId] as const,
  folders: (shopId: string) => [...mediaKeys.all, 'folders', shopId] as const,
};

// ============== Media List ==============

export function useMediaList(
  shopId: string | null,
  params: {
    type?: MediaType;
    source?: MediaSource;
    folderId?: string | null;
    limit?: number;
    offset?: number;
  } = {}
) {
  return useQuery<MediaListResponse>({
    queryKey: mediaKeys.list(shopId ?? '', { type: params.type, source: params.source, folderId: params.folderId }),
    queryFn: () => getMediaList(shopId!, params),
    enabled: !!shopId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============== Media Detail ==============

export function useMediaDetail(shopId: string | null, mediaId: string | null) {
  return useQuery<MediaItem>({
    queryKey: mediaKeys.detail(shopId ?? '', mediaId ?? ''),
    queryFn: () => getMediaById(shopId!, mediaId!),
    enabled: !!shopId && !!mediaId,
    staleTime: 5 * 60 * 1000,
  });
}

// ============== Upload Media ==============

export function useUploadMedia(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<MediaUploadResponse, Error, { file: File; folderId?: string }>({
    mutationFn: ({ file, folderId }) => uploadMedia(shopId, file, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

// ============== Delete Media ==============

export function useDeleteMedia(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (mediaId) => deleteMedia(shopId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

// ============== Bulk Delete Media ==============

export function useDeleteMediaBulk(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string[]>({
    mutationFn: (mediaIds) => deleteMediaBulk(shopId, mediaIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

// ============== Move Media ==============

export function useMoveMedia(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { mediaIds: string[]; folderId: string | null }>({
    mutationFn: ({ mediaIds, folderId }) => moveMedia(shopId, mediaIds, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

// ============== Folders ==============

export function useFolders(shopId: string | null) {
  return useQuery<MediaFolderListResponse>({
    queryKey: mediaKeys.folders(shopId ?? ''),
    queryFn: () => getFolders(shopId!),
    enabled: !!shopId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFolder(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<MediaFolder, Error, { name: string; parentId?: string }>({
    mutationFn: (data) => createFolder(shopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.folders(shopId) });
    },
  });
}

export function useUpdateFolder(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<MediaFolder, Error, { folderId: string; name: string }>({
    mutationFn: ({ folderId, name }) => updateFolder(shopId, folderId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.folders(shopId) });
    },
  });
}

export function useDeleteFolder(shopId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (folderId) => deleteFolder(shopId, folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.folders(shopId) });
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}
