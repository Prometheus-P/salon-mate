'use client';

import * as React from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../hooks/useSettings';
import type { NotificationSettings } from '@/lib/api/settings';

type NotificationKey = keyof Omit<
  NotificationSettings,
  'channels' | 'quietHoursEnabled' | 'quietHoursStart' | 'quietHoursEnd'
>;

const notificationTypes: { key: NotificationKey; label: string; description: string }[] = [
  {
    key: 'newReview',
    label: '새 리뷰',
    description: '새로운 리뷰가 등록되면 알림',
  },
  {
    key: 'negativeReview',
    label: '부정적 리뷰',
    description: '낮은 평점의 리뷰 알림',
  },
  {
    key: 'reviewResponseComplete',
    label: '응답 완료',
    description: 'AI 응답이 생성되면 알림',
  },
  {
    key: 'postPublished',
    label: '포스트 발행',
    description: '예약 포스트가 발행되면 알림',
  },
  {
    key: 'postFailed',
    label: '포스트 실패',
    description: '포스트 발행 실패 시 알림',
  },
  {
    key: 'weeklyReport',
    label: '주간 리포트',
    description: '매주 성과 요약 리포트',
  },
  {
    key: 'monthlyReport',
    label: '월간 리포트',
    description: '매월 상세 분석 리포트',
  },
];

export default function NotificationsSettingsPage() {
  const { data: settings, isLoading, error } = useNotificationSettings();
  const updateSettings = useUpdateNotificationSettings();

  const [localSettings, setLocalSettings] = React.useState<NotificationSettings | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleChannelToggle = (channel: 'email' | 'push' | 'kakao') => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      channels: {
        ...localSettings.channels,
        [channel]: !localSettings.channels[channel],
      },
    });
    setHasChanges(true);
  };

  const handleNotificationToggle = (
    type: NotificationKey,
    channel: 'email' | 'push' | 'kakao'
  ) => {
    if (!localSettings) return;
    const current = localSettings[type];
    if (typeof current === 'object' && 'email' in current) {
      setLocalSettings({
        ...localSettings,
        [type]: {
          ...current,
          [channel]: !current[channel],
        },
      });
      setHasChanges(true);
    }
  };

  const handleQuietHoursToggle = () => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      quietHoursEnabled: !localSettings.quietHoursEnabled,
    });
    setHasChanges(true);
  };

  const handleQuietHoursChange = (field: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      [field]: value,
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localSettings) return;
    try {
      await updateSettings.mutateAsync(localSettings);
      setShowSuccess(true);
      setHasChanges(false);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update notification settings:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="알림 설정" description="알림 수신 방법을 설정하세요" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !localSettings) {
    return (
      <div className="space-y-6">
        <PageHeader title="알림 설정" description="알림 수신 방법을 설정하세요" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            알림 설정을 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="알림 설정" description="알림 수신 방법을 설정하세요" />

      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            알림 설정이 저장되었습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* Channels */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">알림 채널</CardTitle>
          <CardDescription>알림을 받을 채널을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={localSettings.channels.email}
                onCheckedChange={() => handleChannelToggle('email')}
              />
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">이메일</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={localSettings.channels.push}
                onCheckedChange={() => handleChannelToggle('push')}
              />
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">푸시 알림</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={localSettings.channels.kakao}
                onCheckedChange={() => handleChannelToggle('kakao')}
              />
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">카카오톡</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Notification Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">알림 유형</CardTitle>
          <CardDescription>각 알림 유형별 수신 채널을 선택하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-3 text-left text-sm font-medium">알림 유형</th>
                  <th className="py-3 px-4 text-center text-sm font-medium">
                    <Mail className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium">
                    <Smartphone className="h-4 w-4 mx-auto" />
                  </th>
                  <th className="py-3 px-4 text-center text-sm font-medium">
                    <MessageSquare className="h-4 w-4 mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {notificationTypes.map((type) => {
                  const setting = localSettings[type.key];
                  if (typeof setting !== 'object' || !('email' in setting)) return null;
                  return (
                    <tr key={type.key} className="border-b last:border-0">
                      <td className="py-3">
                        <div>
                          <p className="text-sm font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {type.description}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Checkbox
                          checked={setting.email}
                          onCheckedChange={() =>
                            handleNotificationToggle(type.key, 'email')
                          }
                          disabled={!localSettings.channels.email}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Checkbox
                          checked={setting.push}
                          onCheckedChange={() =>
                            handleNotificationToggle(type.key, 'push')
                          }
                          disabled={!localSettings.channels.push}
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Checkbox
                          checked={setting.kakao}
                          onCheckedChange={() =>
                            handleNotificationToggle(type.key, 'kakao')
                          }
                          disabled={!localSettings.channels.kakao}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            방해 금지 시간
          </CardTitle>
          <CardDescription>
            설정된 시간에는 알림을 보내지 않습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={localSettings.quietHoursEnabled}
              onCheckedChange={handleQuietHoursToggle}
            />
            <span className="text-sm">방해 금지 시간 사용</span>
          </label>
          {localSettings.quietHoursEnabled && (
            <div className="flex items-center gap-4 pl-6">
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={localSettings.quietHoursStart}
                  onChange={(e) =>
                    handleQuietHoursChange('quietHoursStart', e.target.value)
                  }
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">부터</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={localSettings.quietHoursEnd}
                  onChange={(e) =>
                    handleQuietHoursChange('quietHoursEnd', e.target.value)
                  }
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">까지</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateSettings.isPending}>
            {updateSettings.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            변경사항 저장
          </Button>
        </div>
      )}
    </div>
  );
}
