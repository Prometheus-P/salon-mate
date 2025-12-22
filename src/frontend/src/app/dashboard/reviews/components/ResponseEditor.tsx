'use client';

import { Sparkles, Save, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface AIOptions {
  tone: 'friendly' | 'formal' | 'casual';
  length: 'short' | 'medium' | 'long';
  emphasis: 'thanks' | 'revisit' | 'apology';
}

interface ResponseEditorProps {
  response: string;
  onResponseChange: (value: string) => void;
  aiOptions: AIOptions;
  onAIOptionsChange: (options: AIOptions) => void;
  onGenerateAI: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  isGeneratingAI?: boolean;
  isSaving?: boolean;
  isPublishing?: boolean;
  maxLength?: number;
  className?: string;
}

export function ResponseEditor({
  response,
  onResponseChange,
  aiOptions,
  onAIOptionsChange,
  onGenerateAI,
  onSaveDraft,
  onPublish,
  isGeneratingAI = false,
  isSaving = false,
  isPublishing = false,
  maxLength = 1000,
  className,
}: ResponseEditorProps) {
  const charCount = response.length;
  const isOverLimit = charCount > maxLength;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <label className="text-sm font-medium">응답 작성</label>
        <Textarea
          placeholder="고객님께 감사의 마음을 전해보세요..."
          value={response}
          onChange={(e) => onResponseChange(e.target.value)}
          rows={6}
          className={cn(isOverLimit && 'border-red-500 focus-visible:ring-red-500')}
        />
        <div className="flex justify-end">
          <span
            className={cn(
              'text-xs',
              isOverLimit ? 'text-red-500' : 'text-muted-foreground'
            )}
          >
            {charCount}/{maxLength}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="secondary"
          onClick={onGenerateAI}
          disabled={isGeneratingAI}
        >
          {isGeneratingAI ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          AI 응답 생성
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSaving || !response.trim()}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            임시저장
          </Button>
          <Button
            onClick={onPublish}
            disabled={isPublishing || !response.trim() || isOverLimit}
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            게시
          </Button>
        </div>
      </div>

      {/* AI Options */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="text-sm font-medium mb-3">AI 응답 옵션</h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">톤</label>
            <Select
              value={aiOptions.tone}
              onValueChange={(v) =>
                onAIOptionsChange({ ...aiOptions, tone: v as AIOptions['tone'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friendly">친근한</SelectItem>
                <SelectItem value="formal">공손한</SelectItem>
                <SelectItem value="casual">전문적인</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">길이</label>
            <Select
              value={aiOptions.length}
              onValueChange={(v) =>
                onAIOptionsChange({ ...aiOptions, length: v as AIOptions['length'] })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">짧게</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="long">길게</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">강조</label>
            <Select
              value={aiOptions.emphasis}
              onValueChange={(v) =>
                onAIOptionsChange({
                  ...aiOptions,
                  emphasis: v as AIOptions['emphasis'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thanks">감사</SelectItem>
                <SelectItem value="revisit">재방문 유도</SelectItem>
                <SelectItem value="apology">사과</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
