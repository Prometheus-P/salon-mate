'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Store, Scissors, Sparkles, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useUpdateStep } from '../hooks/useOnboarding';
import type { BusinessType } from '@/lib/api/onboarding';

const businessTypes: { type: BusinessType; label: string; icon: React.ReactNode }[] = [
  { type: 'hairsalon', label: '헤어샵', icon: <Scissors className="h-5 w-5" /> },
  { type: 'nailshop', label: '네일샵', icon: <Sparkles className="h-5 w-5" /> },
  { type: 'skincare', label: '피부관리', icon: <User className="h-5 w-5" /> },
  { type: 'barbershop', label: '바버샵', icon: <Scissors className="h-5 w-5" /> },
  { type: 'other', label: '기타', icon: <Store className="h-5 w-5" /> },
];

export default function ShopPage() {
  const router = useRouter();
  const { shopData, setShopData, setCurrentStep, markStepCompleted } = useOnboardingStore();
  const updateStep = useUpdateStep();

  const [name, setName] = React.useState(shopData?.name || '');
  const [businessType, setBusinessType] = React.useState<BusinessType>(
    shopData?.businessType || 'hairsalon'
  );
  const [address, setAddress] = React.useState(shopData?.address || '');
  const [phone, setPhone] = React.useState(shopData?.phone || '');

  const handleNext = async () => {
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      businessType,
      address: address.trim() || undefined,
      phone: phone.trim() || undefined,
    };
    setShopData(data);

    try {
      await updateStep.mutateAsync({ step: 'shop', data });
      markStepCompleted('shop');
      setCurrentStep('integrations');
      router.push('/onboarding/integrations');
    } catch (err) {
      console.error('Failed to create shop:', err);
    }
  };

  const handleBack = () => {
    router.push('/onboarding/profile');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">매장 등록</h1>
        <p className="text-muted-foreground mt-2">매장 정보를 입력해주세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">업종 선택</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {businessTypes.map((bt) => (
              <button
                key={bt.type}
                onClick={() => setBusinessType(bt.type)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
                  businessType === bt.type
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border hover:bg-muted'
                )}
              >
                {bt.icon}
                <span className="text-sm font-medium">{bt.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">매장 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              매장명 <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="매장 이름을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">주소</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="매장 주소를 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">전화번호</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="02-0000-0000"
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
