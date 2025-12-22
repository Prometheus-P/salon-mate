'use client';

import { useRouter } from 'next/navigation';
import { Heart, MessageCircle, MoreHorizontal, Copy, Trash, Send, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/common/PlatformBadge';
import { cn } from '@/lib/utils';
import type { Post } from '@/lib/api/posts';

interface PostGridProps {
  posts: Post[];
  onPublish: (postId: string) => void;
  onDuplicate: (postId: string) => void;
  onDelete: (postId: string) => void;
  isPublishing?: boolean;
  publishingPostId?: string;
  className?: string;
}

export function PostGrid({
  posts,
  onPublish,
  onDuplicate,
  onDelete,
  isPublishing = false,
  publishingPostId,
  className,
}: PostGridProps) {
  const router = useRouter();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const formatEngagement = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const getStatusValue = (status: string): 'scheduled' | 'published' | 'failed' | 'draft' => {
    switch (status) {
      case 'scheduled':
        return 'scheduled';
      case 'published':
        return 'published';
      case 'failed':
        return 'failed';
      default:
        return 'draft';
    }
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Pencil className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">포스트가 없습니다</h3>
        <p className="text-sm text-muted-foreground mt-1">
          첫 번째 Instagram 포스트를 만들어보세요
        </p>
        <Button className="mt-4" onClick={() => router.push('/dashboard/instagram/create')}>
          새 포스트 만들기
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {posts.map((post) => (
        <Card
          key={post.id}
          className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => router.push(`/dashboard/instagram/${post.id}/edit`)}
        >
          {/* Image */}
          <div className="relative aspect-square bg-muted">
            <img
              src={post.imageUrl}
              alt={post.captionSnippet || 'Post image'}
              className="h-full w-full object-cover"
            />
            {/* Status Badge Overlay */}
            <div className="absolute top-2 left-2">
              <StatusBadge status={getStatusValue(post.status)} size="sm" />
            </div>
            {/* Action Menu */}
            <div
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {post.status !== 'published' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/instagram/${post.id}/edit`)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        편집
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onPublish(post.id)}
                        disabled={isPublishing && publishingPostId === post.id}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        지금 게시
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onDuplicate(post.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    복제
                  </DropdownMenuItem>
                  {post.status !== 'published' && (
                    <DropdownMenuItem
                      onClick={() => onDelete(post.id)}
                      className="text-red-600"
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-3">
            {post.status === 'published' ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {formatEngagement(post.likesCount)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  {formatEngagement(post.commentsCount)}
                </span>
              </div>
            ) : post.status === 'scheduled' ? (
              <p className="text-sm text-muted-foreground">
                {formatDate(post.scheduledAt)} 예정
              </p>
            ) : (
              <p className="text-sm text-muted-foreground line-clamp-1">
                {post.captionSnippet || '캡션 없음'}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Add New Card */}
      <Card
        className="flex items-center justify-center aspect-square cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
        onClick={() => router.push('/dashboard/instagram/create')}
      >
        <div className="text-center">
          <div className="mx-auto mb-2 rounded-full bg-primary/10 p-3">
            <Pencil className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium">새 포스트</p>
        </div>
      </Card>
    </div>
  );
}
