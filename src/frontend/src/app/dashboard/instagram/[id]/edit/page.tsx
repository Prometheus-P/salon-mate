'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { PostEditor } from '../../components/PostEditor';
import {
  usePostDetail,
  useUpdatePost,
  usePublishPost,
  useGenerateAICaption,
  useHashtagRecommendations,
  useOptimalTimes,
} from '../../hooks/usePosts';
import { useShopStore } from '@/stores/shopStore';

interface PostEditorData {
  media: Array<{ id: string; file?: File; url: string; type: 'image' | 'video' }>;
  caption: string;
  hashtags: string[];
  publishMode: 'now' | 'scheduled';
  scheduledAt: Date | null;
}

interface EditPostPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const { id: postId } = use(params);
  const router = useRouter();
  const { selectedShopId, selectedShop } = useShopStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Queries
  const {
    data: post,
    isLoading: isLoadingPost,
    error: postError,
  } = usePostDetail(selectedShopId, postId);
  const {
    data: hashtagData,
    refetch: refetchHashtags,
    isLoading: isLoadingHashtags,
  } = useHashtagRecommendations(selectedShopId);
  const { data: optimalTimesData } = useOptimalTimes(selectedShopId);

  // Mutations
  const updatePostMutation = useUpdatePost(selectedShopId ?? '');
  const publishPostMutation = usePublishPost(selectedShopId ?? '');
  const generateCaptionMutation = useGenerateAICaption(selectedShopId ?? '');

  // Transform post data to editor format
  const initialData: Partial<PostEditorData> | undefined = post
    ? {
        media: post.imageUrl
          ? [
              {
                id: 'existing-image',
                url: post.imageUrl,
                type: 'image' as const,
              },
            ]
          : [],
        caption: post.caption ?? '',
        hashtags: post.hashtags ?? [],
        publishMode: post.status === 'scheduled' ? 'scheduled' : 'now',
        scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
      }
    : undefined;

  const handleSave = async (data: PostEditorData) => {
    if (!selectedShopId) {
      toast.error('매장을 선택해주세요');
      return;
    }

    setIsSaving(true);
    try {
      const imageUrl = data.media[0]?.url ?? '';

      await updatePostMutation.mutateAsync({
        postId,
        data: {
          imageUrl,
          caption: data.caption,
          hashtags: data.hashtags,
          scheduledAt: data.scheduledAt?.toISOString(),
        },
      });

      toast.success('포스트가 저장되었습니다');
      router.push('/dashboard/instagram');
    } catch (error) {
      toast.error('저장에 실패했습니다');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (data: PostEditorData) => {
    if (!selectedShopId) {
      toast.error('매장을 선택해주세요');
      return;
    }

    setIsPublishing(true);
    try {
      const imageUrl = data.media[0]?.url ?? '';

      // First update the post
      await updatePostMutation.mutateAsync({
        postId,
        data: {
          imageUrl,
          caption: data.caption,
          hashtags: data.hashtags,
          scheduledAt: data.scheduledAt?.toISOString(),
        },
      });

      // If publishing now, trigger publish
      if (data.publishMode === 'now') {
        await publishPostMutation.mutateAsync(postId);
        toast.success('포스트가 게시되었습니다');
      } else {
        toast.success('포스트가 예약되었습니다');
      }

      router.push('/dashboard/instagram');
    } catch (error) {
      toast.error('게시에 실패했습니다');
      console.error(error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleGenerateAICaption = async (options: {
    tone: string;
    length: string;
    includeCta: boolean;
    includeEmoji: boolean;
  }) => {
    try {
      const result = await generateCaptionMutation.mutateAsync({
        prompt: '미용실 포스트 캡션 생성',
        tone: options.tone as 'friendly' | 'professional' | 'trendy' | 'emotional',
        length: options.length as 'short' | 'medium' | 'long',
        includeCta: options.includeCta,
        includeEmoji: options.includeEmoji,
        language: 'ko',
      });
      return result.caption;
    } catch (error) {
      toast.error('AI 캡션 생성에 실패했습니다');
      console.error(error);
      return '';
    }
  };

  const handleRequestHashtags = async () => {
    await refetchHashtags();
  };

  // Transform hashtag recommendations
  const recommendedHashtags = hashtagData
    ? [
        ...hashtagData.industry.map((tag: string) => ({ tag, category: 'industry' as const })),
        ...hashtagData.location.map((tag: string) => ({ tag, category: 'location' as const })),
        ...hashtagData.trending.map((tag: string) => ({ tag, category: 'trending' as const })),
        ...hashtagData.aiRecommended.map((tag: string) => ({ tag, category: 'ai' as const })),
      ]
    : [];

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

  if (postError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>포스트를 불러오는데 실패했습니다.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state only if post is still loading
  if (isLoadingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check if the post is already published
  if (post?.status === 'published') {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            이미 게시된 포스트는 수정할 수 없습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-6">
      <PostEditor
        key={post?.id ?? 'loading'}
        mode="edit"
        initialData={initialData}
        shopName={selectedShop?.name ?? 'your_salon'}
        optimalTimes={optimalTimesData?.times ?? []}
        recommendedHashtags={recommendedHashtags}
        onSave={handleSave}
        onPublish={handlePublish}
        onGenerateAICaption={handleGenerateAICaption}
        onRequestHashtags={handleRequestHashtags}
        isSaving={isSaving}
        isPublishing={isPublishing}
        isGeneratingCaption={generateCaptionMutation.isPending}
        isLoadingHashtags={isLoadingHashtags}
      />
    </div>
  );
}
