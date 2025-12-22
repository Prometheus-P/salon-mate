'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { OnboardingStep } from '@/lib/api/onboarding';

const steps: { step: OnboardingStep; label: string; path: string }[] = [
  { step: 'welcome', label: '시작', path: '/onboarding/welcome' },
  { step: 'profile', label: '프로필', path: '/onboarding/profile' },
  { step: 'shop', label: '매장 등록', path: '/onboarding/shop' },
  { step: 'integrations', label: '연동', path: '/onboarding/integrations' },
  { step: 'complete', label: '완료', path: '/onboarding/complete' },
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const currentStepIndex = steps.findIndex((s) => s.path === pathname);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.step}>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                      index < currentStepIndex
                        ? 'bg-primary text-primary-foreground'
                        : index === currentStepIndex
                        ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {index < currentStepIndex ? '✓' : index + 1}
                  </div>
                  <span
                    className={cn(
                      'mt-1 text-xs',
                      index <= currentStepIndex
                        ? 'text-foreground font-medium'
                        : 'text-muted-foreground'
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}
