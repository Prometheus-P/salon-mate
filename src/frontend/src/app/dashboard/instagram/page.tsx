'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, List, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { PostGrid } from './components/PostGrid';
import {
  usePosts,
  usePostStats,
  usePublishPost,
  useDuplicatePost,
  useDeletePost,
} from './hooks/usePosts';
import { useShopStore } from '@/stores/shopStore';
import type { PostStatus } from '@/lib/api/posts';

type ViewMode = 'grid' | 'list' | 'calendar';

export default function InstagramPage() {
  const router = useRouter();
  const { selectedShopId } = useShopStore();
  const [status, setStatus] = React.useState<PostStatus | 'all'>('all');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [publishingPostId, setPublishingPostId] = React.useState<string | null>(null);

  const statusFilter = status === 'all' ? undefined : status;
  const { data, isLoading, error } = usePosts(selectedShopId, { status: statusFilter });
  const { data: stats } = usePostStats(selectedShopId);

  const publishPost = usePublishPost(selectedShopId || '');
  const duplicatePost = useDuplicatePost(selectedShopId || '');
  const deletePost = useDeletePost(selectedShopId || '');

  const handlePublish = async (postId: string) => {
    setPublishingPostId(postId);
    try {
      await publishPost.mutateAsync(postId);
    } finally {
      setPublishingPostId(null);
    }
  };

  const handleDuplicate = async (postId: string) => {
    await duplicatePost.mutateAsync(postId);
  };

  const handleDelete = async (postId: string) => {
    if (confirm('정말로 이 포스트를 삭제하시겠습니까?')) {
      await deletePost.mutateAsync(postId);
    }
  };

  if (!selectedShopId) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="콘텐츠 스튜디오"
        description="Instagram 콘텐츠를 관리하세요"
        action={
          <Button onClick={() => router.push('/dashboard/instagram/create')}>
            <Plus className="mr-2 h-4 w-4" />새 포스트
          </Button>
        }
      />

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <div className="flex rounded-lg border p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode('calendar')}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs
        value={status}
        onValueChange={(v) => setStatus(v as PostStatus | 'all')}
      >
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            전체
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {stats?.totalPosts || 0}
            </span>
          </TabsTrigger>
          <TabsTrigger value="draft" className="gap-2">
            초안
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
              {stats?.draftCount || 0}
            </span>
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="gap-2">
            예약됨
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              {stats?.scheduledCount || 0}
            </span>
          </TabsTrigger>
          <TabsTrigger value="published" className="gap-2">
            게시됨
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
              {stats?.publishedCount || 0}
            </span>
          </TabsTrigger>
          <TabsTrigger value="failed" className="gap-2">
            실패
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
              {stats?.failedCount || 0}
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            포스트를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      ) : viewMode === 'grid' ? (
        <PostGrid
          posts={data?.posts || []}
          onPublish={handlePublish}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          isPublishing={publishPost.isPending}
          publishingPostId={publishingPostId || undefined}
        />
      ) : viewMode === 'list' ? (
        <div className="text-center py-12 text-muted-foreground">
          리스트 뷰는 곧 제공될 예정입니다.
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          캘린더 뷰는 곧 제공될 예정입니다.
        </div>
      )}
    </div>
  );
}
