'use client';

import { useState, useCallback, KeyboardEvent } from 'react';
import { X, Hash, Loader2, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const MAX_HASHTAGS = 30;

interface RecommendedHashtag {
  tag: string;
  category: 'industry' | 'location' | 'trending' | 'ai';
}

interface HashtagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  recommendations?: RecommendedHashtag[];
  isLoadingRecommendations?: boolean;
  onRequestRecommendations?: () => void;
  className?: string;
}

export function HashtagInput({
  value,
  onChange,
  recommendations = [],
  isLoadingRecommendations = false,
  onRequestRecommendations,
  className,
}: HashtagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addHashtag = useCallback(
    (tag: string) => {
      // Normalize the tag
      let normalizedTag = tag.trim().toLowerCase();
      if (!normalizedTag) return;

      // Remove # if present
      if (normalizedTag.startsWith('#')) {
        normalizedTag = normalizedTag.slice(1);
      }

      // Validate tag (no spaces, only alphanumeric and Korean characters)
      if (!/^[\w가-힣]+$/u.test(normalizedTag)) {
        return;
      }

      // Check if already exists
      if (value.includes(normalizedTag)) {
        return;
      }

      // Check max limit
      if (value.length >= MAX_HASHTAGS) {
        return;
      }

      onChange([...value, normalizedTag]);
      setInputValue('');
    },
    [value, onChange]
  );

  const removeHashtag = useCallback(
    (tagToRemove: string) => {
      onChange(value.filter((tag) => tag !== tagToRemove));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addHashtag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag when backspace on empty input
      removeHashtag(value[value.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');

    // Split by common delimiters and add each tag
    const tags = pastedText.split(/[\s,#]+/).filter(Boolean);
    const newTags = [...value];

    for (const tag of tags) {
      const normalizedTag = tag.trim().toLowerCase();
      if (
        normalizedTag &&
        /^[\w가-힣]+$/u.test(normalizedTag) &&
        !newTags.includes(normalizedTag) &&
        newTags.length < MAX_HASHTAGS
      ) {
        newTags.push(normalizedTag);
      }
    }

    onChange(newTags);
    setInputValue('');
  };

  const getCategoryColor = (category: RecommendedHashtag['category']) => {
    switch (category) {
      case 'industry':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'location':
        return 'bg-green-100 text-green-700 hover:bg-green-200';
      case 'trending':
        return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'ai':
        return 'bg-amber-100 text-amber-700 hover:bg-amber-200';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
    }
  };

  const getCategoryLabel = (category: RecommendedHashtag['category']) => {
    switch (category) {
      case 'industry':
        return '업종';
      case 'location':
        return '위치';
      case 'trending':
        return '트렌드';
      case 'ai':
        return 'AI 추천';
      default:
        return '';
    }
  };

  // Filter out already used tags from recommendations
  const availableRecommendations = recommendations.filter(
    (rec) => !value.includes(rec.tag.replace('#', '').toLowerCase())
  );

  // Group recommendations by category
  const groupedRecommendations = availableRecommendations.reduce(
    (acc, rec) => {
      if (!acc[rec.category]) {
        acc[rec.category] = [];
      }
      acc[rec.category].push(rec);
      return acc;
    },
    {} as Record<string, RecommendedHashtag[]>
  );

  return (
    <div className={cn('space-y-3', className)}>
      {/* Input area with tags */}
      <div className="flex flex-wrap gap-2 p-3 border rounded-md min-h-[80px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 px-2 py-1 text-sm"
          >
            <Hash className="h-3 w-3" />
            {tag}
            <button
              onClick={() => removeHashtag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={value.length === 0 ? '해시태그를 입력하세요' : ''}
          className="flex-1 min-w-[120px] border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* Counter and recommendations button */}
      <div className="flex items-center justify-between text-sm">
        <span
          className={cn(
            'tabular-nums',
            value.length >= MAX_HASHTAGS
              ? 'text-red-500 font-medium'
              : 'text-muted-foreground'
          )}
        >
          {value.length}/{MAX_HASHTAGS}
        </span>

        {onRequestRecommendations && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestRecommendations}
            disabled={isLoadingRecommendations}
            className="gap-2"
          >
            {isLoadingRecommendations ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="h-4 w-4" />
            )}
            추천 해시태그
          </Button>
        )}
      </div>

      {/* Recommended hashtags */}
      {Object.keys(groupedRecommendations).length > 0 && (
        <div className="space-y-3 pt-2 border-t">
          <p className="text-sm font-medium text-muted-foreground">
            추천 해시태그
          </p>
          {Object.entries(groupedRecommendations).map(([category, tags]) => (
            <div key={category} className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {getCategoryLabel(category as RecommendedHashtag['category'])}
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((rec) => (
                  <button
                    key={rec.tag}
                    onClick={() => addHashtag(rec.tag)}
                    disabled={value.length >= MAX_HASHTAGS}
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium transition-colors',
                      getCategoryColor(rec.category),
                      value.length >= MAX_HASHTAGS && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    #{rec.tag.replace('#', '')}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
