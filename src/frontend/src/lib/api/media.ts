/**
 * Media API client functions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// ============== Types ==============

export type MediaType = 'image' | 'video';
export type MediaSource = 'upload' | 'ai' | 'external';

export interface MediaItem {
  id: string;
  shopId: string;
  type: MediaType;
  source: MediaSource;
  url: string;
  thumbnailUrl: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number; // for video, in seconds
  folderId: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaFolder {
  id: string;
  shopId: string;
  name: string;
  parentId: string | null;
  itemCount: number;
  createdAt: string;
}

export interface MediaListResponse {
  items: MediaItem[];
  total: number;
}

export interface MediaFolderListResponse {
  folders: MediaFolder[];
}

export interface MediaUploadRequest {
  file: File;
  folderId?: string;
}

export interface MediaUploadResponse {
  id: string;
  url: string;
  thumbnailUrl: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
}

// ============== Helper ==============

async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ============== API Functions ==============

export async function getMediaList(
  shopId: string,
  params: {
    type?: MediaType;
    source?: MediaSource;
    folderId?: string | null;
    limit?: number;
    offset?: number;
  } = {}
): Promise<MediaListResponse> {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set('type', params.type);
  if (params.source) searchParams.set('source', params.source);
  if (params.folderId !== undefined) {
    searchParams.set('folder_id', params.folderId ?? 'root');
  }
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.offset) searchParams.set('offset', params.offset.toString());

  const queryString = searchParams.toString();
  return fetchWithAuth<MediaListResponse>(
    `${API_BASE_URL}/shops/${shopId}/media${queryString ? `?${queryString}` : ''}`
  );
}

export async function getMediaById(shopId: string, mediaId: string): Promise<MediaItem> {
  return fetchWithAuth<MediaItem>(`${API_BASE_URL}/shops/${shopId}/media/${mediaId}`);
}

export async function uploadMedia(
  shopId: string,
  file: File,
  folderId?: string
): Promise<MediaUploadResponse> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const formData = new FormData();
  formData.append('file', file);
  if (folderId) formData.append('folder_id', folderId);

  const response = await fetch(`${API_BASE_URL}/shops/${shopId}/media/upload`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.detail || error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function deleteMedia(shopId: string, mediaId: string): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/shops/${shopId}/media/${mediaId}`, {
    method: 'DELETE',
  });
}

export async function deleteMediaBulk(shopId: string, mediaIds: string[]): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/shops/${shopId}/media/bulk-delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: mediaIds }),
  });
}

export async function moveMedia(
  shopId: string,
  mediaIds: string[],
  folderId: string | null
): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/shops/${shopId}/media/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: mediaIds, folder_id: folderId }),
  });
}

// ============== Folder API ==============

export async function getFolders(shopId: string): Promise<MediaFolderListResponse> {
  return fetchWithAuth<MediaFolderListResponse>(`${API_BASE_URL}/shops/${shopId}/media/folders`);
}

export async function createFolder(
  shopId: string,
  data: CreateFolderRequest
): Promise<MediaFolder> {
  return fetchWithAuth<MediaFolder>(`${API_BASE_URL}/shops/${shopId}/media/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updateFolder(
  shopId: string,
  folderId: string,
  name: string
): Promise<MediaFolder> {
  return fetchWithAuth<MediaFolder>(`${API_BASE_URL}/shops/${shopId}/media/folders/${folderId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function deleteFolder(shopId: string, folderId: string): Promise<void> {
  await fetchWithAuth(`${API_BASE_URL}/shops/${shopId}/media/folders/${folderId}`, {
    method: 'DELETE',
  });
}
