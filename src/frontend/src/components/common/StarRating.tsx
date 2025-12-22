'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  className,
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star
          key={`full-${i}`}
          className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
        />
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <div className="relative">
          <Star className={cn(sizeClasses[size], 'text-gray-200')} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star
              className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')}
            />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={cn(sizeClasses[size], 'text-gray-200')}
        />
      ))}

      {/* Value display */}
      {showValue && (
        <span
          className={cn(
            'ml-1 font-medium text-foreground',
            textSizeClasses[size]
          )}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// Interactive star rating for forms
interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function StarRatingInput({
  value,
  onChange,
  maxRating = 5,
  size = 'md',
  disabled = false,
  className,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = React.useState<number | null>(null);

  const displayValue = hoverValue ?? value;

  return (
    <div
      className={cn(
        'flex items-center gap-0.5',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {Array.from({ length: maxRating }).map((_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= displayValue;

        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => onChange(starValue)}
            onMouseEnter={() => !disabled && setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(null)}
            className={cn(
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded',
              !disabled && 'cursor-pointer hover:scale-110 transition-transform'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-300'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
