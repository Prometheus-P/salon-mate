'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Image, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useCreatePost, useGenerateAICaption, useOptimalTimes } from '../hooks/usePosts';
import { useShopStore } from '@/stores/shopStore';

export default function CreatePostPage() {
  const router = useRouter();
  const { selectedShopId } = useShopStore();

  const [imageUrl, setImageUrl] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [hashtags, setHashtags] = React.useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = React.useState('');
  const [scheduleDate, setScheduleDate] = React.useState('');
  const [scheduleTime, setScheduleTime] = React.useState('');
  const [publishNow, setPublishNow] = React.useState(true);
  const [aiPrompt, setAiPrompt] = React.useState('');

  const createPost = useCreatePost(selectedShopId || '');
  const generateCaption = useGenerateAICaption(selectedShopId || '');
  const { data: optimalTimes } = useOptimalTimes(selectedShopId);

  const handleAddHashtag = () => {
    if (hashtagInput.trim() && hashtags.length < 30) {
      const tag = hashtagInput.trim().startsWith('#')
        ? hashtagInput.trim()
        : `#${hashtagInput.trim()}`;
      if (!hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
      }
      setHashtagInput('');
    }
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(hashtags.filter((t) => t !== tag));
  };

  const handleGenerateCaption = async () => {
    if (!aiPrompt.trim()) return;
    try {
      const result = await generateCaption.mutateAsync({
        prompt: aiPrompt,
        tone: 'trendy',
        length: 'medium',
        includeCta: true,
        includeEmoji: true,
      });
      setCaption(result.caption);
      setHashtags([...new Set([...hashtags, ...result.hashtags])]);
    } catch (err) {
      console.error('Caption generation failed:', err);
    }
  };

  const handleSaveDraft = async () => {
    if (!imageUrl) return;
    try {
      await createPost.mutateAsync({
        imageUrl,
        caption,
        hashtags,
      });
      router.push('/dashboard/instagram');
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handlePublish = async () => {
    if (!imageUrl) return;
    try {
      let scheduledAt: string | undefined;
      if (!publishNow && scheduleDate && scheduleTime) {
        scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }

      await createPost.mutateAsync({
        imageUrl,
        caption,
        hashtags,
        scheduledAt,
      });
      router.push('/dashboard/instagram');
    } catch (err) {
      console.error('Publish failed:', err);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.push('/dashboard/instagram')}
        >
          <ArrowLeft className="h-4 w-4" />
          목록
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={!imageUrl || createPost.isPending}
          >
            {createPost.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            임시저장
          </Button>
          <Button onClick={handlePublish} disabled={!imageUrl || createPost.isPending}>
            {createPost.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {publishNow ? '게시하기' : '예약하기'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Editor */}
        <div className="space-y-6">
          {/* Media Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">미디어</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  placeholder="이미지 URL을 입력하세요"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                {imageUrl && (
                  <div className="relative aspect-square max-w-[300px] rounded-lg overflow-hidden bg-muted">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Image className="mr-2 h-4 w-4" />
                    라이브러리
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/instagram/ai-studio')}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI 생성
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Caption Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">캡션</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="무엇을 공유하고 싶으세요?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{caption.length}/2,200</span>
              </div>

              {/* AI Caption Generator */}
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="AI 캡션 생성 프롬프트..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                  />
                  <Button
                    variant="secondary"
                    onClick={handleGenerateCaption}
                    disabled={!aiPrompt.trim() || generateCaption.isPending}
                  >
                    {generateCaption.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hashtags Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">해시태그</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="해시태그 입력"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
                />
                <Button variant="outline" onClick={handleAddHashtag}>
                  추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveHashtag(tag)}
                      className="hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{hashtags.length}/30</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview & Schedule */}
        <div className="space-y-6">
          {/* Instagram Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instagram 미리보기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mx-auto max-w-[320px] rounded-xl border bg-white p-4 shadow-sm">
                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
                  <span className="text-sm font-medium">your_salon</span>
                </div>
                {/* Image */}
                <div className="aspect-square bg-muted rounded mb-3">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-full w-full object-cover rounded"
                    />
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-4 mb-2 text-lg">
                  <span>❤️</span>
                  <span>💬</span>
                  <span>📤</span>
                  <span className="ml-auto">🔖</span>
                </div>
                {/* Caption */}
                <p className="text-sm">
                  <span className="font-medium">your_salon</span>{' '}
                  {caption || '캡션을 입력하세요...'}
                </p>
                {/* Hashtags */}
                {hashtags.length > 0 && (
                  <p className="text-sm text-blue-500 mt-1">
                    {hashtags.join(' ')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">발행 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={publishNow}
                    onChange={() => setPublishNow(true)}
                  />
                  <span className="text-sm">지금 게시</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={!publishNow}
                    onChange={() => setPublishNow(false)}
                  />
                  <span className="text-sm">예약 게시</span>
                </label>
              </div>

              {!publishNow && (
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              )}

              {optimalTimes?.times && optimalTimes.times.length > 0 && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    💡 최적 시간 추천
                  </p>
                  <div className="space-y-1">
                    {optimalTimes.times.map((time, i) => (
                      <p key={i} className="text-sm">
                        {time.day} {time.time} - {time.reason}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
