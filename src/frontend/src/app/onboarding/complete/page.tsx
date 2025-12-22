'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Sparkles, MessageSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useCompleteOnboarding } from '../hooks/useOnboarding';
import confetti from 'canvas-confetti';

const nextSteps = [
  {
    icon: MessageSquare,
    title: '리뷰 확인하기',
    description: '연동된 플랫폼의 리뷰를 확인하세요',
    href: '/dashboard/reviews',
  },
  {
    icon: Calendar,
    title: '첫 포스트 만들기',
    description: 'Instagram 콘텐츠를 만들어보세요',
    href: '/dashboard/instagram/create',
  },
  {
    icon: Sparkles,
    title: 'AI 스튜디오 둘러보기',
    description: 'AI로 이미지와 캡션을 생성해보세요',
    href: '/dashboard/instagram/ai-studio',
  },
];

export default function CompletePage() {
  const router = useRouter();
  const { markStepCompleted, reset } = useOnboardingStore();
  const completeOnboarding = useCompleteOnboarding();

  useEffect(() => {
    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Complete onboarding
    markStepCompleted('complete');
    completeOnboarding.mutate();
  }, []);

  const handleGoDashboard = () => {
    reset();
    router.push('/dashboard');
  };

  return (
    <div className="space-y-8 text-center">
      {/* Success Icon */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      {/* Message */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">설정이 완료되었습니다!</h1>
        <p className="text-lg text-muted-foreground">
          SalonMate를 사용할 준비가 되었습니다
        </p>
      </div>

      {/* Next Steps */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">다음 단계</h2>
        <div className="grid gap-3">
          {nextSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-md transition-shadow text-left"
                onClick={() => router.push(step.href)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Button size="lg" onClick={handleGoDashboard}>
        대시보드로 이동
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
