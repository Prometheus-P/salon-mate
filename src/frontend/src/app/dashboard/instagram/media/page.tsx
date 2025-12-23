'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Upload,
  Search,
  Folder,
  FolderPlus,
  Image as ImageIcon,
  Video,
  Sparkles,
  Trash2,
  FolderInput,
  Download,
  Plus,
  Check,
  Loader2,
  MoreVertical,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShopStore } from '@/stores/shopStore';
import {
  useMediaList,
  useFolders,
  useUploadMedia,
  useDeleteMediaBulk,
  useMoveMedia,
  useCreateFolder,
} from '../hooks/useMedia';
import { useCreatePost } from '../hooks/usePosts';
import type { MediaType, MediaSource, MediaItem } from '@/lib/api/media';

type FilterType = 'all' | 'image' | 'video' | 'ai';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function MediaLibraryPage() {
  const router = useRouter();
  const { selectedShopId } = useShopStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);

  // Derive API params from filter
  const apiParams: { type?: MediaType; source?: MediaSource; folderId?: string | null } = {};
  if (filter === 'image') apiParams.type = 'image';
  if (filter === 'video') apiParams.type = 'video';
  if (filter === 'ai') apiParams.source = 'ai';
  if (selectedFolderId) apiParams.folderId = selectedFolderId;

  // Queries
  const { data: mediaData, isLoading: isLoadingMedia } = useMediaList(selectedShopId, apiParams);
  const { data: foldersData } = useFolders(selectedShopId);

  // Mutations
  const uploadMutation = useUploadMedia(selectedShopId ?? '');
  const deleteMutation = useDeleteMediaBulk(selectedShopId ?? '');
  const moveMutation = useMoveMedia(selectedShopId ?? '');
  const createFolderMutation = useCreateFolder(selectedShopId ?? '');
  const createPostMutation = useCreatePost(selectedShopId ?? '');

  const mediaItems = mediaData?.items ?? [];
  const folders = foldersData?.folders ?? [];

  // Filter items by search query
  const filteredItems = searchQuery
    ? mediaItems.filter((item) =>
        item.filename.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mediaItems;

  // Selection handlers
  const toggleSelection = useCallback((itemId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map((item) => item.id)));
    }
  }, [filteredItems, selectedItems.size]);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  // File upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedShopId) return;

    for (const file of Array.from(files)) {
      try {
        await uploadMutation.mutateAsync({
          file,
          folderId: selectedFolderId ?? undefined,
        });
      } catch {
        toast.error(`${file.name} 업로드 실패`);
      }
    }

    if (files.length > 0) {
      toast.success(`${files.length}개 파일이 업로드되었습니다`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;

    const confirmed = window.confirm(
      `선택한 ${selectedItems.size}개 항목을 삭제하시겠습니까?`
    );
    if (!confirmed) return;

    try {
      await deleteMutation.mutateAsync(Array.from(selectedItems));
      toast.success(`${selectedItems.size}개 항목이 삭제되었습니다`);
      clearSelection();
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  // Move to folder
  const handleMove = async (targetFolderId: string | null) => {
    if (selectedItems.size === 0) return;

    try {
      await moveMutation.mutateAsync({
        mediaIds: Array.from(selectedItems),
        folderId: targetFolderId,
      });
      toast.success(`${selectedItems.size}개 항목이 이동되었습니다`);
      clearSelection();
      setIsMoveDialogOpen(false);
    } catch {
      toast.error('이동에 실패했습니다');
    }
  };

  // Create folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !selectedShopId) return;

    try {
      await createFolderMutation.mutateAsync({
        name: newFolderName.trim(),
        parentId: selectedFolderId ?? undefined,
      });
      toast.success('폴더가 생성되었습니다');
      setNewFolderName('');
      setIsCreateFolderOpen(false);
    } catch {
      toast.error('폴더 생성에 실패했습니다');
    }
  };

  // Create post from selected
  const handleCreatePost = async () => {
    const selectedItem = mediaItems.find((item) => selectedItems.has(item.id));
    if (!selectedItem || !selectedShopId) return;

    try {
      const post = await createPostMutation.mutateAsync({
        imageUrl: selectedItem.url,
      });
      toast.success('포스트가 생성되었습니다');
      router.push(`/dashboard/instagram/${post.id}/edit`);
    } catch {
      toast.error('포스트 생성에 실패했습니다');
    }
  };

  if (!selectedShopId) {
    return (
      <div className="container max-w-6xl py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/instagram')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">미디어 라이브러리</h1>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          업로드
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="image">
              <ImageIcon className="mr-1.5 h-4 w-4" />
              이미지
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="mr-1.5 h-4 w-4" />
              동영상
            </TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="mr-1.5 h-4 w-4" />
              AI 생성
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar: Folders */}
        <Card className="h-fit">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Folder className="h-4 w-4" />
                폴더
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsCreateFolderOpen(true)}
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
            </div>

            {/* Root folder */}
            <button
              onClick={() => setSelectedFolderId(null)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                selectedFolderId === null
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
            >
              <Folder className="h-4 w-4" />
              전체 파일
            </button>

            {/* Folder list */}
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors',
                  selectedFolderId === folder.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                <span className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  {folder.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({folder.itemCount})
                </span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Main Content: Media Grid */}
        <div className="space-y-4">
          {/* Selection Bar */}
          {selectedItems.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm">
                <strong>{selectedItems.size}</strong>개 선택됨
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMoveDialogOpen(true)}
                >
                  <FolderInput className="mr-2 h-4 w-4" />
                  폴더 이동
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCreatePost}
                  disabled={selectedItems.size !== 1 || createPostMutation.isPending}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  포스트 생성
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  선택 취소
                </Button>
              </div>
            </div>
          )}

          {/* Media Grid */}
          {isLoadingMedia ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">미디어가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-4">
                이미지나 동영상을 업로드해 보세요
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                업로드
              </Button>
            </div>
          ) : (
            <>
              {/* Select All */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <button
                  onClick={selectAll}
                  className="hover:text-foreground transition-colors"
                >
                  {selectedItems.size === filteredItems.length ? '전체 해제' : '전체 선택'}
                </button>
                <span>•</span>
                <span>{filteredItems.length}개 항목</span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredItems.map((item) => (
                  <MediaGridItem
                    key={item.id}
                    item={item}
                    isSelected={selectedItems.has(item.id)}
                    onToggleSelect={() => toggleSelection(item.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Folder Dialog */}
      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 폴더 만들기</DialogTitle>
            <DialogDescription>
              새 폴더의 이름을 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">폴더 이름</Label>
              <Input
                id="folder-name"
                placeholder="폴더 이름"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
            >
              {createFolderMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              만들기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to Folder Dialog */}
      <Dialog open={isMoveDialogOpen} onOpenChange={setIsMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>폴더로 이동</DialogTitle>
            <DialogDescription>
              {selectedItems.size}개 항목을 이동할 폴더를 선택해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-[300px] overflow-y-auto">
            <button
              onClick={() => handleMove(null)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
            >
              <Folder className="h-4 w-4" />
              전체 파일 (루트)
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => handleMove(folder.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors"
              >
                <Folder className="h-4 w-4" />
                {folder.name}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveDialogOpen(false)}>
              취소
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============== MediaGridItem Component ==============

interface MediaGridItemProps {
  item: MediaItem;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function MediaGridItem({ item, isSelected, onToggleSelect }: MediaGridItemProps) {
  return (
    <div
      className={cn(
        'group relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-muted-foreground/30'
      )}
      onClick={onToggleSelect}
    >
      {/* Thumbnail */}
      {item.type === 'video' ? (
        <div className="relative w-full h-full bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.filename}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-8 w-8 text-white" />
          </div>
          {item.duration && (
            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
              {formatDuration(item.duration)}
            </div>
          )}
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={item.thumbnailUrl || item.url}
          alt={item.filename}
          className="w-full h-full object-cover"
        />
      )}

      {/* Type Badge */}
      <div className="absolute top-1 left-1">
        {item.source === 'ai' && (
          <span className="px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            AI
          </span>
        )}
      </div>

      {/* Selection Checkbox */}
      <div
        className={cn(
          'absolute top-1 right-1 w-5 h-5 rounded border-2 transition-all',
          isSelected
            ? 'bg-primary border-primary'
            : 'bg-white/80 border-gray-300 opacity-0 group-hover:opacity-100'
        )}
      >
        {isSelected && <Check className="h-full w-full text-primary-foreground p-0.5" />}
      </div>

      {/* Usage Count */}
      {item.usageCount > 0 && (
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
          사용: {item.usageCount}
        </div>
      )}

      {/* More Menu */}
      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" size="icon" className="h-6 w-6">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>상세 보기</DropdownMenuItem>
            <DropdownMenuItem>다운로드</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">삭제</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
