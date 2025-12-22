'use client';

import * as React from 'react';
import {
  CreditCard,
  Check,
  Crown,
  Building2,
  Loader2,
  Download,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  useSubscription,
  usePaymentHistory,
  useUpdateSubscription,
} from '../hooks/useSettings';
import type { PlanType } from '@/lib/api/settings';
import { cn } from '@/lib/utils';

const plans: {
  type: PlanType;
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}[] = [
  {
    type: 'free',
    name: 'Free',
    price: 0,
    description: '소규모 비즈니스를 위한 기본 기능',
    features: [
      '월 50개 리뷰 수집',
      'AI 응답 10개/월',
      '포스트 5개/월',
      '1명 사용자',
      '기본 분석',
      '이메일 지원',
    ],
    icon: <CreditCard className="h-6 w-6" />,
  },
  {
    type: 'pro',
    name: 'Pro',
    price: 29000,
    description: '성장하는 비즈니스를 위한 전문 기능',
    features: [
      '무제한 리뷰 수집',
      'AI 응답 500개/월',
      '무제한 포스트',
      '5명 사용자',
      '상세 분석',
      '우선 지원',
    ],
    icon: <Crown className="h-6 w-6" />,
    popular: true,
  },
  {
    type: 'enterprise',
    name: 'Enterprise',
    price: 99000,
    description: '대규모 비즈니스를 위한 맞춤 솔루션',
    features: [
      '무제한 리뷰 수집',
      '무제한 AI 응답',
      '무제한 포스트',
      '50명 사용자',
      '맞춤 분석',
      '전담 매니저',
    ],
    icon: <Building2 className="h-6 w-6" />,
  },
];

export default function BillingSettingsPage() {
  const { data: subscription, isLoading, error } = useSubscription();
  const { data: paymentHistory } = usePaymentHistory(5);
  const updateSubscription = useUpdateSubscription();

  const [changingPlan, setChangingPlan] = React.useState<PlanType | null>(null);

  const handleChangePlan = async (plan: PlanType) => {
    if (subscription?.plan === plan) return;
    setChangingPlan(plan);
    try {
      await updateSubscription.mutateAsync(plan);
    } finally {
      setChangingPlan(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="구독 & 결제" description="플랜과 결제 정보를 관리하세요" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="구독 & 결제" description="플랜과 결제 정보를 관리하세요" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            구독 정보를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="구독 & 결제" description="플랜과 결제 정보를 관리하세요" />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">현재 플랜</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                {subscription?.plan === 'enterprise' ? (
                  <Building2 className="h-6 w-6 text-primary" />
                ) : subscription?.plan === 'pro' ? (
                  <Crown className="h-6 w-6 text-primary" />
                ) : (
                  <CreditCard className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold capitalize">
                    {subscription?.plan} 플랜
                  </h3>
                  <Badge>활성</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscription?.billingCycle === 'yearly' ? '연간' : '월간'} 결제
                  {subscription?.nextBillingDate &&
                    ` · 다음 결제일: ${formatDate(subscription.nextBillingDate)}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">
                ₩{formatPrice(subscription?.price || 0)}
                <span className="text-sm font-normal text-muted-foreground">/월</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      {subscription?.usage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">사용량</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>AI 응답</span>
                <span>
                  {subscription.usage.aiResponsesUsed} /{' '}
                  {subscription.usage.aiResponsesLimit}
                </span>
              </div>
              <Progress
                value={
                  (subscription.usage.aiResponsesUsed /
                    subscription.usage.aiResponsesLimit) *
                  100
                }
              />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>팀원</span>
                <span>
                  {subscription.usage.teamMembersUsed} /{' '}
                  {subscription.usage.teamMembersLimit}
                </span>
              </div>
              <Progress
                value={
                  (subscription.usage.teamMembersUsed /
                    subscription.usage.teamMembersLimit) *
                  100
                }
              />
            </div>
            <div className="flex justify-between text-sm pt-2 border-t">
              <span>등록된 샵</span>
              <span>{subscription.usage.shopsCount}개</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">플랜 선택</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.type}
              className={cn(
                'relative',
                plan.popular && 'border-primary shadow-md',
                subscription?.plan === plan.type && 'ring-2 ring-primary'
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-2.5 left-4">인기</Badge>
              )}
              <CardHeader>
                <div className="flex items-center gap-2">
                  {plan.icon}
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
                <div className="pt-2">
                  <span className="text-2xl font-bold">
                    ₩{formatPrice(plan.price)}
                  </span>
                  <span className="text-sm text-muted-foreground">/월</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={subscription?.plan === plan.type ? 'secondary' : 'default'}
                  className="w-full"
                  onClick={() => handleChangePlan(plan.type)}
                  disabled={
                    subscription?.plan === plan.type ||
                    changingPlan !== null
                  }
                >
                  {changingPlan === plan.type ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : subscription?.plan === plan.type ? (
                    '현재 플랜'
                  ) : (
                    '선택'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">결제 수단</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {subscription?.paymentMethod === 'card'
                    ? '신용카드'
                    : '미등록'}
                </p>
                {subscription?.paymentLastFour && (
                  <p className="text-xs text-muted-foreground">
                    **** **** **** {subscription.paymentLastFour}
                  </p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm">
              변경
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      {paymentHistory && paymentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">결제 내역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(item.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ₩{formatPrice(item.amount)}
                      </p>
                      <Badge
                        variant={
                          item.status === 'completed'
                            ? 'success'
                            : item.status === 'pending'
                            ? 'pending'
                            : 'error'
                        }
                        className="text-xs"
                      >
                        {item.status === 'completed'
                          ? '완료'
                          : item.status === 'pending'
                          ? '대기중'
                          : '실패'}
                      </Badge>
                    </div>
                    {item.receiptUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4">
              전체 내역 보기
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
