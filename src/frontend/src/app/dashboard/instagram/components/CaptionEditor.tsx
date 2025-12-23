'use client';

import { useState, useRef, useCallback } from 'react';
import { Smile, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const MAX_CAPTION_LENGTH = 2200;

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😊', '😍', '🥰', '😘', '🤗', '😎', '🤩', '😇', '🥺'],
  'Gestures': ['👍', '👏', '🙌', '💪', '✌️', '🤝', '👋', '💅', '✨', '💖'],
  'Beauty': ['💇', '💇‍♀️', '💅', '💄', '👗', '👠', '👑', '💎', '🌸', '🌺'],
  'Objects': ['📸', '🎨', '🪞', '✂️', '🎀', '🎁', '📱', '💻', '🔥', '⭐'],
};

interface AICaptionOptions {
  tone: 'friendly' | 'professional' | 'trendy' | 'emotional';
  length: 'short' | 'medium' | 'long';
  includeCta: boolean;
  includeEmoji: boolean;
}

interface CaptionEditorProps {
  value: string;
  onChange: (value: string) => void;
  onGenerateAI?: (options: AICaptionOptions) => Promise<void>;
  isGenerating?: boolean;
  placeholder?: string;
  className?: string;
}

export function CaptionEditor({
  value,
  onChange,
  onGenerateAI,
  isGenerating = false,
  placeholder = '무엇을 공유하고 싶으세요?',
  className,
}: CaptionEditorProps) {
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [aiOptions, setAIOptions] = useState<AICaptionOptions>({
    tone: 'friendly',
    length: 'medium',
    includeCta: true,
    includeEmoji: true,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const characterCount = value.length;
  const isOverLimit = characterCount > MAX_CAPTION_LENGTH;

  const insertEmoji = useCallback(
    (emoji: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.slice(0, start) + emoji + value.slice(end);
      onChange(newValue);

      // Move cursor after emoji
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    },
    [value, onChange]
  );

  const handleGenerateAI = async () => {
    if (onGenerateAI) {
      await onGenerateAI(aiOptions);
      setShowAIOptions(false);
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'min-h-[150px] resize-none pr-10',
            isOverLimit && 'border-red-500 focus-visible:ring-red-500'
          )}
        />

        {/* Emoji Picker */}
        <div className="absolute bottom-2 right-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Smile className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-3">
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <div key={category}>
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-muted rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Character Counter */}
      <div className="flex items-center justify-between text-sm">
        <span
          className={cn(
            'tabular-nums',
            isOverLimit ? 'text-red-500 font-medium' : 'text-muted-foreground'
          )}
        >
          {characterCount.toLocaleString()}/{MAX_CAPTION_LENGTH.toLocaleString()}
        </span>

        {/* AI Generation Button */}
        {onGenerateAI && (
          <Popover open={showAIOptions} onOpenChange={setShowAIOptions}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI 캡션 생성
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">AI 캡션 옵션</h4>

                {/* Tone */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">톤</label>
                  <Select
                    value={aiOptions.tone}
                    onValueChange={(value) =>
                      setAIOptions((prev) => ({
                        ...prev,
                        tone: value as AICaptionOptions['tone'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">친근한</SelectItem>
                      <SelectItem value="professional">전문적인</SelectItem>
                      <SelectItem value="trendy">트렌디한</SelectItem>
                      <SelectItem value="emotional">감성적인</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Length */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">길이</label>
                  <Select
                    value={aiOptions.length}
                    onValueChange={(value) =>
                      setAIOptions((prev) => ({
                        ...prev,
                        length: value as AICaptionOptions['length'],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">짧게 (~100자)</SelectItem>
                      <SelectItem value="medium">보통 (~300자)</SelectItem>
                      <SelectItem value="long">길게 (~500자)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">
                    포함 요소
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={aiOptions.includeCta ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setAIOptions((prev) => ({
                          ...prev,
                          includeCta: !prev.includeCta,
                        }))
                      }
                    >
                      CTA
                    </Button>
                    <Button
                      variant={aiOptions.includeEmoji ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        setAIOptions((prev) => ({
                          ...prev,
                          includeEmoji: !prev.includeEmoji,
                        }))
                      }
                    >
                      이모지
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    '생성하기'
                  )}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
