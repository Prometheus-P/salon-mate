'use client';

import * as React from 'react';
import {
  Users,
  Plus,
  Mail,
  MoreHorizontal,
  Pencil,
  Trash2,
  Send,
  Crown,
  Shield,
  User,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useTeamMembers,
  useInviteTeamMember,
  useRemoveTeamMember,
  useResendInvite,
} from '../hooks/useSettings';
import type { TeamRole } from '@/lib/api/settings';

const roleConfig: Record<TeamRole, { label: string; icon: React.ReactNode; color: string }> = {
  owner: { label: '소유자', icon: <Crown className="h-3.5 w-3.5" />, color: 'bg-yellow-100 text-yellow-800' },
  admin: { label: '관리자', icon: <Shield className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-800' },
  member: { label: '멤버', icon: <User className="h-3.5 w-3.5" />, color: 'bg-gray-100 text-gray-800' },
};

export default function TeamSettingsPage() {
  const { data: members, isLoading, error } = useTeamMembers();
  const inviteMember = useInviteTeamMember();
  const removeMember = useRemoveTeamMember();
  const resendInvite = useResendInvite();

  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRole, setInviteRole] = React.useState<TeamRole>('member');
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [resendingId, setResendingId] = React.useState<string | null>(null);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    try {
      await inviteMember.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
        shopAccess: [],
      });
      setInviteEmail('');
      setInviteRole('member');
      setIsInviteOpen(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Invite failed:', err);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (confirm('정말로 이 팀원을 제거하시겠습니까?')) {
      await removeMember.mutateAsync(memberId);
    }
  };

  const handleResend = async (memberId: string) => {
    setResendingId(memberId);
    try {
      await resendInvite.mutateAsync(memberId);
    } finally {
      setResendingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="팀 관리" description="팀원을 초대하고 관리하세요" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="팀 관리" description="팀원을 초대하고 관리하세요" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            팀원 정보를 불러오는 중 오류가 발생했습니다.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const activeMembers = members?.filter((m) => !m.isPending) || [];
  const pendingMembers = members?.filter((m) => m.isPending) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="팀 관리"
        description="팀원을 초대하고 관리하세요"
        action={
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                팀원 초대
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>팀원 초대</DialogTitle>
                <DialogDescription>
                  이메일로 새 팀원을 초대하세요
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">이메일</label>
                  <Input
                    type="email"
                    placeholder="team@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">역할</label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as TeamRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">관리자</SelectItem>
                      <SelectItem value="member">멤버</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  취소
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteMember.isPending}
                >
                  {inviteMember.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  초대하기
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            초대 이메일이 발송되었습니다.
          </AlertDescription>
        </Alert>
      )}

      {/* Active Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            팀원 ({activeMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeMembers.map((member) => {
              const role = roleConfig[member.role];
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{member.name}</p>
                        <Badge className={`gap-1 ${role.color}`}>
                          {role.icon}
                          {role.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(member.joinedAt)} 가입
                    </span>
                    {member.role !== 'owner' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Pencil className="mr-2 h-4 w-4" />
                            권한 수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleRemove(member.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            제거
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" />
              대기중인 초대 ({pendingMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingMembers.map((member) => {
                const role = roleConfig[member.role];
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{member.email}</p>
                          <Badge variant="secondary" className="gap-1">
                            {role.icon}
                            {role.label}
                          </Badge>
                          <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                            대기중
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(member.joinedAt)} 초대됨
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(member.id)}
                        disabled={resendingId === member.id}
                      >
                        {resendingId === member.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        재발송
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                        onClick={() => handleRemove(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
