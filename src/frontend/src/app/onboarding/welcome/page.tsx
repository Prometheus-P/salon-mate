'use client';

import { useRouter } from 'next/navigation';
import { Sparkles, MessageSquare, Calendar, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOnboardingStore } from '@/stores/onboardingStore';

const features = [
  {
    icon: MessageSquare,
    title: '리뷰 자동 관리',
    description: 'AI가 리뷰에 맞춤 응답을 생성합니다',
  },
  {
    icon: Calendar,
    title: '콘텐츠 예약 발행',
    description: 'Instagram 포스트를 예약하고 관리하세요',
  },
  {
    icon: BarChart3,
    title: '성과 분석',
    description: '리뷰와 포스트 성과를 한눈에 파악하세요',
  },
  {
    icon: Sparkles,
    title: 'AI 콘텐츠 생성',
    description: 'AI가 캡션과 이미지를 생성합니다',
  },
];

export default function WelcomePage() {
  const router = useRouter();
  const { setCurrentStep, markStepCompleted } = useOnboardingStore();

  const handleStart = () => {
    markStepCompleted('welcome');
    setCurrentStep('profile');
    router.push('/onboarding/profile');
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="space-y-8 text-center">
      {/* Hero */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold">SalonMate에 오신 것을 환영합니다</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          AI 기반 리뷰 관리와 마케팅 자동화로 더 많은 고객을 만나보세요
        </p>
      </div>

      {/* Features */}
      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <Card key={index} className="text-left">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <Button size="lg" className="w-full sm:w-auto" onClick={handleStart}>
          시작하기
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-sm text-muted-foreground">
          이미 계정이 있으신가요?{' '}
          <button onClick={handleSkip} className="text-primary hover:underline">
            건너뛰기
          </button>
        </p>
      </div>
    </div>
  );
}
