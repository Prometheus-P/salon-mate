'use client';

import { useState } from 'react';
import { Trash2, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { StyleTag } from '@/lib/api/styles';
import { useDeleteStyleTag, useContentSuggestion } from '../hooks/useStyles';
import { toast } from 'sonner';

interface StyleCardProps {
  styleTag: StyleTag;
  shopId: string;
  onClick?: () => void;
}

// 서비스 타입 라벨
const SERVICE_TYPE_LABELS: Record<string, string> = {
  nail: '네일',
  hair: '헤어',
  makeup: '메이크업',
  lash: '속눈썹',
  skin: '피부관리',
};

// 스타일 카테고리 라벨
const STYLE_CATEGORY_LABELS: Record<string, string> = {
  minimal: '미니멀',
  luxury: '럭셔리',
  trendy: '트렌디',
  classic: '클래식',
  natural: '내추럴',
  cute: '큐트',
  chic: '시크',
  elegant: '엘레강스',
};

export function StyleCard({ styleTag, shopId, onClick }: StyleCardProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isSuggestionDialogOpen, setSuggestionDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const deleteMutation = useDeleteStyleTag(shopId);
  const { data: suggestion, isLoading: suggestionLoading } = useContentSuggestion(
    shopId,
    isSuggestionDialogOpen ? styleTag.id : ''
  );

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(styleTag.id);
      setDeleteDialogOpen(false);
      toast.success('스타일이 삭제되었습니다.');
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
  };

  const handleCopyCaption = async () => {
    if (!suggestion) return;

    const fullText = `${suggestion.caption}\n\n${suggestion.hashtags.map((h) => `#${h}`).join(' ')}`;
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('클립보드에 복사되었습니다.');
  };

  const isAnalyzing = styleTag.analysis_status === 'analyzing';
  const isFailed = styleTag.analysis_status === 'failed';

  return (
    <>
      <div
        className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <img
            src={styleTag.thumbnail_url || styleTag.image_url}
            alt={styleTag.ai_description || 'Style image'}
            className="h-full w-full object-cover"
            loading="lazy"
          />

          {/* Status Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="flex items-center gap-2 text-white">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm font-medium">분석 중...</span>
              </div>
            </div>
          )}

          {isFailed && (
            <div className="absolute inset-0 flex items-center justify-center bg-red-500/50">
              <span className="text-sm font-medium text-white">분석 실패</span>
            </div>
          )}

          {/* Hover Actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                setSuggestionDialogOpen(true);
              }}
            >
              <Sparkles className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="destructive"
              className="h-9 w-9"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Tags */}
          <div className="mb-2 flex flex-wrap gap-1">
            {styleTag.service_type && (
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                {SERVICE_TYPE_LABELS[styleTag.service_type] || styleTag.service_type}
              </span>
            )}
            {styleTag.style_category && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {STYLE_CATEGORY_LABELS[styleTag.style_category] || styleTag.style_category}
              </span>
            )}
          </div>

          {/* Colors */}
          {styleTag.dominant_colors.length > 0 && (
            <div className="mb-2 flex gap-1">
              {styleTag.dominant_colors.slice(0, 4).map((color, i) => (
                <div
                  key={i}
                  className="h-4 w-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          )}

          {/* Technique Tags */}
          {styleTag.technique_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {styleTag.technique_tags.slice(0, 3).map((tag, i) => (
                <span
                  key={i}
                  className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                >
                  {tag}
                </span>
              ))}
              {styleTag.technique_tags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{styleTag.technique_tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Confidence Score */}
          {styleTag.confidence_score && (
            <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
              <span>AI 신뢰도:</span>
              <span>{Math.round(styleTag.confidence_score * 100)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>스타일 삭제</DialogTitle>
            <DialogDescription>
              이 스타일을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Content Suggestion Dialog */}
      <Dialog open={isSuggestionDialogOpen} onOpenChange={setSuggestionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI 콘텐츠 제안
            </DialogTitle>
            <DialogDescription>
              이 스타일에 맞는 인스타그램 포스팅용 캡션과 해시태그를 확인하세요.
            </DialogDescription>
          </DialogHeader>

          {suggestionLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg className="h-8 w-8 animate-spin text-purple-500" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : suggestion ? (
            <div className="space-y-4">
              {/* Caption */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">캡션</h4>
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {suggestion.caption || '(캡션 없음)'}
                </p>
              </div>

              {/* Hashtags */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-gray-700">해시태그</h4>
                <div className="flex flex-wrap gap-1.5">
                  {suggestion.hashtags.map((tag, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-gray-500">
              콘텐츠 제안을 불러올 수 없습니다.
            </p>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSuggestionDialogOpen(false)}>
              닫기
            </Button>
            <Button onClick={handleCopyCaption} disabled={!suggestion}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  복사
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
