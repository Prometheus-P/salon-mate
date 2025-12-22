'use client';

import { useRouter } from 'next/navigation';
import { Link2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUpdateStep } from '../hooks/useOnboarding';
import type { IntegrationPlatform } from '@/lib/api/onboarding';

const platforms: {
  platform: IntegrationPlatform;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    platform: 'google',
    name: 'Google 비즈니스',
    description: 'Google 지도 리뷰를 자동으로 수집합니다',
    icon: '🔍',
  },
  {
    platform: 'naver',
    name: '네이버 플레이스',
    description: '네이버 플레이스 리뷰를 수집합니다',
    icon: '🟢',
  },
  {
    platform: 'instagram',
    name: 'Instagram',
    description: '인스타그램 비즈니스 계정을 연동합니다',
    icon: '📷',
  },
];

export default function IntegrationsPage() {
  const router = useRouter();
  const { integrations, toggleIntegration, setCurrentStep, markStepCompleted } = useOnboardingStore();
  const updateStep = useUpdateStep();

  const handleNext = async () => {
    const selectedIntegrations = integrations.filter((i) => i.selected);
    const skipAll = selectedIntegrations.length === 0;

    try {
      await updateStep.mutateAsync({
        step: 'integrations',
        data: { integrations, skipAll },
      });
      markStepCompleted('integrations');
      setCurrentStep('complete');
      router.push('/onboarding/complete');
    } catch (err) {
      console.error('Failed to save integrations:', err);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/shop');
  };

  const handleSkip = async () => {
    try {
      await updateStep.mutateAsync({
        step: 'integrations',
        data: { integrations: [], skipAll: true },
      });
      markStepCompleted('integrations');
      setCurrentStep('complete');
      router.push('/onboarding/complete');
    } catch (err) {
      console.error('Failed to skip:', err);
    }
  };

  const selectedCount = integrations.filter((i) => i.selected).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">플랫폼 연동</h1>
        <p className="text-muted-foreground mt-2">
          리뷰를 수집할 플랫폼을 선택하세요
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            연동 플랫폼 선택
          </CardTitle>
          <CardDescription>
            나중에 설정에서 추가하거나 변경할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {platforms.map((platform) => {
            const isSelected = integrations.find(
              (i) => i.platform === platform.platform
            )?.selected;

            return (
              <button
                key={platform.platform}
                onClick={() => toggleIntegration(platform.platform)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted'
                )}
              >
                <span className="text-2xl">{platform.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {platform.description}
                  </p>
                </div>
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full border transition-colors',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-muted-foreground'
                  )}
                >
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        {selectedCount > 0
          ? `${selectedCount}개 플랫폼 선택됨`
          : '플랫폼을 선택하지 않아도 계속 진행할 수 있습니다'}
      </p>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleBack}>
          이전
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSkip}>
            건너뛰기
          </Button>
          <Button onClick={handleNext} disabled={updateStep.isPending}>
            {updateStep.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {selectedCount > 0 ? '연동하기' : '완료'}
          </Button>
        </div>
      </div>
    </div>
  );
}
