'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Camera,
  Video,
  FileText,
  Palette,
  Sparkles,
  RefreshCw,
  Plus,
  Download,
  Check,
  Loader2,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useShopStore } from '@/stores/shopStore';
import { useGenerateAIImage, useCreatePost } from '../hooks/usePosts';
import type {
  AIContentType,
  AITone,
  AIMood,
  AIColorScheme,
  AIGeneratedImage,
} from '@/lib/api/posts';

// Content type options
const CONTENT_TYPES: Array<{
  value: AIContentType;
  label: string;
  icon: typeof Camera;
  description: string;
}> = [
  { value: 'image', label: '이미지', icon: Camera, description: '피드 이미지 포스트' },
  { value: 'reels', label: '릴스', icon: Video, description: '짧은 영상 콘텐츠' },
  { value: 'caption', label: '캡션만', icon: FileText, description: '텍스트 캡션만 생성' },
  { value: 'story', label: '스토리', icon: Palette, description: '24시간 스토리 콘텐츠' },
];

// Style options
const TONE_OPTIONS: Array<{ value: AITone; label: string }> = [
  { value: 'professional', label: '전문적' },
  { value: 'trendy', label: '트렌디' },
  { value: 'emotional', label: '감성적' },
  { value: 'humorous', label: '유머러스' },
];

const MOOD_OPTIONS: Array<{ value: AIMood; label: string }> = [
  { value: 'bright', label: '밝은' },
  { value: 'calm', label: '차분한' },
  { value: 'luxury', label: '럭셔리' },
  { value: 'casual', label: '캐주얼' },
];

const COLOR_OPTIONS: Array<{ value: AIColorScheme; label: string }> = [
  { value: 'warm', label: '따뜻한' },
  { value: 'cool', label: '시원한' },
  { value: 'monochrome', label: '모노톤' },
  { value: 'vivid', label: '비비드' },
];

// Suggested prompts
const SUGGESTED_PROMPTS = [
  '겨울 헤어케어',
  '신규 스타일',
  '이벤트 안내',
  '헤어 트렌드',
  '고객 변신',
  '신상품 소개',
];

export default function AIStudioPage() {
  const router = useRouter();
  const { selectedShopId } = useShopStore();

  // Wizard state
  const [contentType, setContentType] = useState<AIContentType>('image');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<AITone>('trendy');
  const [mood, setMood] = useState<AIMood>('bright');
  const [colorScheme, setColorScheme] = useState<AIColorScheme>('warm');

  // Results state
  const [generatedImages, setGeneratedImages] = useState<AIGeneratedImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [suggestedCaption, setSuggestedCaption] = useState('');
  const [suggestedHashtags, setSuggestedHashtags] = useState<string[]>([]);

  // Mutations
  const generateImageMutation = useGenerateAIImage(selectedShopId ?? '');
  const createPostMutation = useCreatePost(selectedShopId ?? '');

  const handleGenerate = async () => {
    if (!selectedShopId) {
      toast.error('매장을 선택해주세요');
      return;
    }

    if (!prompt.trim()) {
      toast.error('콘텐츠 주제를 입력해주세요');
      return;
    }

    try {
      const result = await generateImageMutation.mutateAsync({
        prompt: prompt.trim(),
        contentType,
        tone,
        mood,
        colorScheme,
        count: 4,
      });

      setGeneratedImages(result.images);
      setSuggestedCaption(result.suggestedCaption);
      setSuggestedHashtags(result.suggestedHashtags);

      if (result.images.length > 0) {
        setSelectedImageId(result.images[0].id);
      }

      toast.success('콘텐츠가 생성되었습니다');
    } catch {
      toast.error('콘텐츠 생성에 실패했습니다');
    }
  };

  const handleCreatePost = async () => {
    const selectedImage = generatedImages.find((img) => img.id === selectedImageId);
    if (!selectedImage || !selectedShopId) return;

    try {
      const post = await createPostMutation.mutateAsync({
        imageUrl: selectedImage.url,
        caption: suggestedCaption,
        hashtags: suggestedHashtags,
      });

      toast.success('포스트가 생성되었습니다');
      router.push(`/dashboard/instagram/${post.id}/edit`);
    } catch {
      toast.error('포스트 생성에 실패했습니다');
    }
  };

  const handleSuggestedPrompt = (suggested: string) => {
    setPrompt(suggested);
  };

  const selectedImage = generatedImages.find((img) => img.id === selectedImageId);

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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/dashboard/instagram')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">AI 콘텐츠 스튜디오</h1>
          <p className="text-sm text-muted-foreground">
            AI가 맞춤형 콘텐츠를 생성해 드립니다
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Wizard Steps */}
        <div className="space-y-6">
          {/* Step 1: Content Type */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                  1
                </span>
                콘텐츠 유형 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CONTENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setContentType(type.value)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors',
                        contentType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      )}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                  2
                </span>
                콘텐츠 주제
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">어떤 콘텐츠를 만들고 싶으세요?</Label>
                <Input
                  id="prompt"
                  placeholder="예: 새로운 펌 스타일 홍보, 20대 여성 타겟"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4" />
                  추천 주제
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((suggested) => (
                    <button
                      key={suggested}
                      onClick={() => handleSuggestedPrompt(suggested)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full border transition-colors',
                        prompt === suggested
                          ? 'border-primary bg-primary/5'
                          : 'border-muted hover:border-muted-foreground/30'
                      )}
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Style Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">
                  3
                </span>
                스타일 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>톤</Label>
                  <Select value={tone} onValueChange={(value: AITone) => setTone(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>분위기</Label>
                  <Select value={mood} onValueChange={(value: AIMood) => setMood(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MOOD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>색감</Label>
                  <Select
                    value={colorScheme}
                    onValueChange={(value: AIColorScheme) => setColorScheme(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COLOR_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={!prompt.trim() || generateImageMutation.isPending}
          >
            {generateImageMutation.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" />
            )}
            AI 콘텐츠 생성
          </Button>
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {generatedImages.length > 0 ? (
            <>
              {/* Generated Images Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    생성 결과 ({generatedImages.length}개)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {generatedImages.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageId(image.id)}
                        className={cn(
                          'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                          selectedImageId === image.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-muted hover:border-muted-foreground/30'
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.url}
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                        />
                        {selectedImageId === image.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Image Caption */}
              {selectedImage && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">선택한 이미지의 캡션</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm whitespace-pre-wrap">{suggestedCaption}</p>
                    {suggestedHashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {suggestedHashtags.map((tag) => (
                          <span
                            key={tag}
                            className="text-sm text-primary"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleGenerate}
                  disabled={generateImageMutation.isPending}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  다시 생성
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={!selectedImage}
                >
                  <Download className="mr-2 h-4 w-4" />
                  저장
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCreatePost}
                  disabled={!selectedImage || createPostMutation.isPending}
                >
                  {createPostMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  포스트 작성
                </Button>
              </div>
            </>
          ) : (
            /* Empty State */
            <Card className="flex flex-col items-center justify-center min-h-[400px] text-center">
              <CardContent className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">AI 콘텐츠 생성</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    콘텐츠 유형, 주제, 스타일을 선택하고 &quot;AI 콘텐츠 생성&quot; 버튼을 클릭하면
                    AI가 맞춤형 이미지와 캡션을 생성합니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
