'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { User, Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUpdateStep } from '../hooks/useOnboarding';

export default function ProfilePage() {
  const router = useRouter();
  const { profileData, setProfileData, setCurrentStep, markStepCompleted } = useOnboardingStore();
  const updateStep = useUpdateStep();

  const [name, setName] = React.useState(profileData?.name || '');
  const [phone, setPhone] = React.useState(profileData?.phone || '');

  const handleNext = async () => {
    if (!name.trim()) return;

    const data = { name: name.trim(), phone: phone.trim() || undefined };
    setProfileData(data);

    try {
      await updateStep.mutateAsync({ step: 'profile', data });
      markStepCompleted('profile');
      setCurrentStep('shop');
      router.push('/onboarding/shop');
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/welcome');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">프로필 설정</h1>
        <p className="text-muted-foreground mt-2">기본 정보를 입력해주세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로필 이미지</CardTitle>
          <CardDescription>선택 사항입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button variant="outline" size="sm">
              이미지 업로드
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              이름 <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">전화번호</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={handleBack}>
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={!name.trim() || updateStep.isPending}
        >
          {updateStep.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          다음
        </Button>
      </div>
    </div>
  );
}
