'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type Platform = 'google' | 'naver' | 'kakao' | 'instagram' | 'facebook';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const platformConfig: Record<
  Platform,
  { label: string; variant: 'google' | 'naver' | 'kakao' | 'instagram' | 'default'; icon?: string }
> = {
  google: {
    label: 'Google',
    variant: 'google',
    icon: '🔵',
  },
  naver: {
    label: 'Naver',
    variant: 'naver',
    icon: '🟢',
  },
  kakao: {
    label: '카카오',
    variant: 'kakao',
    icon: '🟡',
  },
  instagram: {
    label: 'Instagram',
    variant: 'instagram',
    icon: '📸',
  },
  facebook: {
    label: 'Facebook',
    variant: 'default',
    icon: '📘',
  },
};

export function PlatformBadge({
  platform,
  size = 'default',
  showIcon = false,
  className,
}: PlatformBadgeProps) {
  const config = platformConfig[platform];

  return (
    <Badge variant={config.variant} size={size} className={cn(className)}>
      {showIcon && config.icon && (
        <span className="mr-1" role="img" aria-hidden>
          {config.icon}
        </span>
      )}
      {config.label}
    </Badge>
  );
}

// Status badge for reviews/posts
export type Status = 'pending' | 'responded' | 'published' | 'scheduled' | 'failed' | 'draft';

interface StatusBadgeProps {
  status: Status;
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const statusConfig: Record<
  Status,
  { label: string; variant: 'pending' | 'success' | 'warning' | 'error' | 'default' }
> = {
  pending: {
    label: '미응답',
    variant: 'pending',
  },
  responded: {
    label: '응답완료',
    variant: 'success',
  },
  published: {
    label: '게시됨',
    variant: 'success',
  },
  scheduled: {
    label: '예약됨',
    variant: 'warning',
  },
  failed: {
    label: '실패',
    variant: 'error',
  },
  draft: {
    label: '초안',
    variant: 'default',
  },
};

export function StatusBadge({ status, size = 'default', className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} className={cn(className)}>
      {config.label}
    </Badge>
  );
}
