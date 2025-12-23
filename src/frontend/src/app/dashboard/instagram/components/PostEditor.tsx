'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InstagramPreview } from './InstagramPreview';
import { MediaUploader } from './MediaUploader';
import { CaptionEditor } from './CaptionEditor';
import { HashtagInput } from './HashtagInput';
import { SchedulePicker } from './SchedulePicker';
import { cn } from '@/lib/utils';

interface MediaItem {
  id: string;
  file?: File;
  url: string;
  type: 'image' | 'video';
  isUploading?: boolean;
  error?: string;
}

interface PostEditorData {
  media: MediaItem[];
  caption: string;
  hashtags: string[];
  publishMode: 'now' | 'scheduled';
  scheduledAt: Date | null;
}

interface OptimalTime {
  day: string;
  time: string;
  reason: string;
}

interface RecommendedHashtag {
  tag: string;
  category: 'industry' | 'location' | 'trending' | 'ai';
}

interface PostEditorProps {
  initialData?: Partial<PostEditorData>;
  shopName?: string;
  shopImage?: string;
  optimalTimes?: OptimalTime[];
  recommendedHashtags?: RecommendedHashtag[];
  onSave: (data: PostEditorData) => Promise<void>;
  onPublish: (data: PostEditorData) => Promise<void>;
  onGenerateAICaption?: (options: {
    tone: string;
    length: string;
    includeCta: boolean;
    includeEmoji: boolean;
  }) => Promise<string>;
  onRequestHashtags?: () => Promise<void>;
  isLoading?: boolean;
  isSaving?: boolean;
  isPublishing?: boolean;
  isGeneratingCaption?: boolean;
  isLoadingHashtags?: boolean;
  mode?: 'create' | 'edit';
  className?: string;
}

const defaultData: PostEditorData = {
  media: [],
  caption: '',
  hashtags: [],
  publishMode: 'scheduled',
  scheduledAt: null,
};

export function PostEditor({
  initialData,
  shopName = 'your_salon',
  shopImage,
  optimalTimes = [],
  recommendedHashtags = [],
  onSave,
  onPublish,
  onGenerateAICaption,
  onRequestHashtags,
  isLoading = false,
  isSaving = false,
  isPublishing = false,
  isGeneratingCaption = false,
  isLoadingHashtags = false,
  mode = 'create',
  className,
}: PostEditorProps) {
  const router = useRouter();

  // Initialize state with the initial data merged with defaults
  // Use a key prop on the parent to reset this component when initialData changes
  const [data, setData] = useState<PostEditorData>(() => ({
    ...defaultData,
    ...initialData,
  }));

  const updateData = useCallback(<K extends keyof PostEditorData>(
    key: K,
    value: PostEditorData[K]
  ) => {
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleSave = async () => {
    await onSave(data);
  };

  const handlePublish = async () => {
    await onPublish(data);
  };

  const handleGenerateAICaption = async (options: {
    tone: 'friendly' | 'professional' | 'trendy' | 'emotional';
    length: 'short' | 'medium' | 'long';
    includeCta: boolean;
    includeEmoji: boolean;
  }) => {
    if (onGenerateAICaption) {
      const caption = await onGenerateAICaption(options);
      updateData('caption', caption);
    }
  };

  const canPublish =
    data.media.length > 0 &&
    data.media.every((m) => !m.error && !m.isUploading) &&
    (data.publishMode === 'now' ||
      (data.publishMode === 'scheduled' && data.scheduledAt && data.scheduledAt > new Date()));

  const isProcessing = isSaving || isPublishing;

  // Get preview image URL (first media item)
  const previewImageUrl = data.media.length > 0 ? data.media[0].url : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
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
          <h1 className="text-xl font-semibold">
            {mode === 'create' ? '새 포스트 작성' : '포스트 편집'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            임시저장
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!canPublish || isProcessing}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {data.publishMode === 'now' ? '지금 게시' : '예약하기'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">미디어</CardTitle>
            </CardHeader>
            <CardContent>
              <MediaUploader
                value={data.media}
                onChange={(media) => updateData('media', media)}
                onOpenLibrary={() => router.push('/dashboard/instagram/media')}
                onOpenAIStudio={() => router.push('/dashboard/instagram/ai-studio')}
              />
            </CardContent>
          </Card>

          {/* Caption */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">캡션</CardTitle>
            </CardHeader>
            <CardContent>
              <CaptionEditor
                value={data.caption}
                onChange={(caption) => updateData('caption', caption)}
                onGenerateAI={onGenerateAICaption ? handleGenerateAICaption : undefined}
                isGenerating={isGeneratingCaption}
              />
            </CardContent>
          </Card>

          {/* Hashtags */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">해시태그</CardTitle>
            </CardHeader>
            <CardContent>
              <HashtagInput
                value={data.hashtags}
                onChange={(hashtags) => updateData('hashtags', hashtags)}
                recommendations={recommendedHashtags}
                isLoadingRecommendations={isLoadingHashtags}
                onRequestRecommendations={onRequestHashtags}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Preview & Schedule */}
        <div className="space-y-6">
          {/* Instagram Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instagram 미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <InstagramPreview
                imageUrl={previewImageUrl}
                caption={data.caption}
                hashtags={data.hashtags}
                accountName={shopName}
                accountImage={shopImage}
              />
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">발행 설정</CardTitle>
            </CardHeader>
            <CardContent>
              <SchedulePicker
                mode={data.publishMode}
                scheduledAt={data.scheduledAt}
                onModeChange={(mode) => updateData('publishMode', mode)}
                onScheduleChange={(scheduledAt) => updateData('scheduledAt', scheduledAt)}
                optimalTimes={optimalTimes}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:hidden">
        <div className="flex gap-2 max-w-screen-lg mx-auto">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSave}
            disabled={isProcessing}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            임시저장
          </Button>
          <Button
            className="flex-1"
            onClick={handlePublish}
            disabled={!canPublish || isProcessing}
          >
            {isPublishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {data.publishMode === 'now' ? '게시' : '예약'}
          </Button>
        </div>
      </div>

      {/* Spacer for mobile bottom bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
