'use client';

import * as React from 'react';
import { User, Mail, Phone, Camera, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useProfile, useUpdateProfile } from './hooks/useSettings';

export default function ProfileSettingsPage() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [showSuccess, setShowSuccess] = React.useState(false);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ name, phone });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Profile update failed:', err);
    }
  };

  const hasChanges =
    profile && (name !== (profile.name || '') || phone !== (profile.phone || ''));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="프로필 설정" description="계정 정보를 관리하세요" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="프로필 설정" description="계정 정보를 관리하세요" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            프로필 정보를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="프로필 설정" description="계정 정보를 관리하세요" />

      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            프로필이 성공적으로 업데이트되었습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Image */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로필 이미지</CardTitle>
          <CardDescription>프로필에 표시될 이미지를 설정하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                {profile?.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-primary" />
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full"
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              <Button variant="outline" size="sm">
                이미지 변경
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG 최대 5MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
          <CardDescription>계정의 기본 정보를 수정하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              이메일
            </label>
            <Input value={profile?.email || ''} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              이메일은 변경할 수 없습니다
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              이름
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              전화번호
            </label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">비밀번호 변경</p>
              <p className="text-xs text-muted-foreground">
                마지막 변경: 30일 전
              </p>
            </div>
            <Button variant="outline" size="sm">
              변경
            </Button>
          </div>
          <div className="flex items-center justify-between py-2 border-t">
            <div>
              <p className="text-sm font-medium text-red-600">계정 삭제</p>
              <p className="text-xs text-muted-foreground">
                모든 데이터가 영구 삭제됩니다
              </p>
            </div>
            <Button variant="destructive" size="sm">
              삭제
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            변경사항 저장
          </Button>
        </div>
      )}
    </div>
  );
}
