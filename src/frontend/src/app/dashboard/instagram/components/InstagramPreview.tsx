'use client';

import { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InstagramPreviewProps {
  imageUrl?: string;
  caption?: string;
  hashtags?: string[];
  accountName?: string;
  accountImage?: string;
  className?: string;
}

export function InstagramPreview({
  imageUrl,
  caption = '',
  hashtags = [],
  accountName = 'your_salon',
  accountImage,
  className,
}: InstagramPreviewProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const hashtagText = hashtags.length > 0
    ? hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ')
    : '';

  const fullCaption = caption + (hashtagText ? `\n\n${hashtagText}` : '');

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Dark/Light Mode Toggle */}
      <div className="flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="gap-2"
        >
          {isDarkMode ? (
            <>
              <Sun className="h-4 w-4" />
              라이트 모드
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              다크 모드
            </>
          )}
        </Button>
      </div>

      {/* Instagram Phone Frame */}
      <div
        className={cn(
          'mx-auto w-full max-w-[375px] rounded-[2.5rem] p-3 shadow-2xl',
          isDarkMode ? 'bg-black' : 'bg-white border border-gray-200'
        )}
      >
        {/* Phone Notch */}
        <div className="flex justify-center mb-2">
          <div
            className={cn(
              'w-24 h-6 rounded-full',
              isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
            )}
          />
        </div>

        {/* Instagram App Content */}
        <div
          className={cn(
            'rounded-2xl overflow-hidden',
            isDarkMode ? 'bg-black' : 'bg-white'
          )}
        >
          {/* Header */}
          <div
            className={cn(
              'flex items-center justify-between px-3 py-2 border-b',
              isDarkMode ? 'border-gray-800' : 'border-gray-100'
            )}
          >
            <div className="flex items-center gap-2">
              {/* Profile Picture */}
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
                  isDarkMode
                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                    : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                )}
              >
                {accountImage ? (
                  <img
                    src={accountImage}
                    alt={accountName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  accountName.charAt(0).toUpperCase()
                )}
              </div>
              <span
                className={cn(
                  'text-sm font-semibold',
                  isDarkMode ? 'text-white' : 'text-black'
                )}
              >
                {accountName}
              </span>
            </div>
            <button>
              <MoreHorizontal
                className={cn(
                  'h-5 w-5',
                  isDarkMode ? 'text-white' : 'text-black'
                )}
              />
            </button>
          </div>

          {/* Image */}
          <div className="aspect-square bg-gray-100 relative">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Post preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className={cn(
                  'w-full h-full flex items-center justify-center',
                  isDarkMode ? 'bg-gray-900' : 'bg-gray-100'
                )}
              >
                <span
                  className={cn(
                    'text-sm',
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  )}
                >
                  이미지를 추가하세요
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div
            className={cn(
              'flex items-center justify-between px-3 py-2',
              isDarkMode ? 'text-white' : 'text-black'
            )}
          >
            <div className="flex items-center gap-4">
              <button onClick={() => setIsLiked(!isLiked)}>
                <Heart
                  className={cn(
                    'h-6 w-6 transition-colors',
                    isLiked ? 'fill-red-500 text-red-500' : ''
                  )}
                />
              </button>
              <button>
                <MessageCircle className="h-6 w-6" />
              </button>
              <button>
                <Send className="h-6 w-6" />
              </button>
            </div>
            <button onClick={() => setIsSaved(!isSaved)}>
              <Bookmark
                className={cn(
                  'h-6 w-6 transition-colors',
                  isSaved ? 'fill-current' : ''
                )}
              />
            </button>
          </div>

          {/* Likes */}
          <div className="px-3 pb-1">
            <span
              className={cn(
                'text-sm font-semibold',
                isDarkMode ? 'text-white' : 'text-black'
              )}
            >
              좋아요 0개
            </span>
          </div>

          {/* Caption */}
          <div className="px-3 pb-3">
            {fullCaption ? (
              <p
                className={cn(
                  'text-sm whitespace-pre-wrap',
                  isDarkMode ? 'text-white' : 'text-black'
                )}
              >
                <span className="font-semibold">{accountName}</span>{' '}
                {fullCaption.split('\n').map((line, i) => (
                  <span key={i}>
                    {i > 0 && <br />}
                    {line.split(' ').map((word, j) => (
                      <span
                        key={j}
                        className={
                          word.startsWith('#')
                            ? 'text-blue-500'
                            : word.startsWith('@')
                            ? 'text-blue-500'
                            : ''
                        }
                      >
                        {j > 0 ? ' ' : ''}
                        {word}
                      </span>
                    ))}
                  </span>
                ))}
              </p>
            ) : (
              <p
                className={cn(
                  'text-sm italic',
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                )}
              >
                캡션을 입력하세요...
              </p>
            )}
          </div>

          {/* Timestamp */}
          <div className="px-3 pb-3">
            <span
              className={cn(
                'text-xs uppercase',
                isDarkMode ? 'text-gray-500' : 'text-gray-400'
              )}
            >
              방금 전
            </span>
          </div>
        </div>

        {/* Home Indicator */}
        <div className="flex justify-center mt-2">
          <div
            className={cn(
              'w-32 h-1 rounded-full',
              isDarkMode ? 'bg-gray-700' : 'bg-gray-300'
            )}
          />
        </div>
      </div>
    </div>
  );
}
