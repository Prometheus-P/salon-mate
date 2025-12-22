'use client';

/**
 * TanStack Query hooks for settings data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProfile,
  updateProfile,
  getNotificationSettings,
  updateNotificationSettings,
  getIntegrations,
  connectIntegration,
  disconnectIntegration,
  syncIntegration,
  getSubscription,
  getPaymentHistory,
  updateSubscription,
  getTeamMembers,
  inviteTeamMember,
  updateTeamMember,
  removeTeamMember,
  resendInvite,
  type UserProfile,
  type ProfileUpdateRequest,
  type NotificationSettings,
  type NotificationSettingsUpdate,
  type Integration,
  type IntegrationPlatform,
  type Subscription,
  type PaymentHistoryItem,
  type PlanType,
  type TeamMember,
  type TeamInviteRequest,
  type TeamMemberUpdateRequest,
} from '@/lib/api/settings';

// ============== Query Keys ==============

export const settingsKeys = {
  all: ['settings'] as const,
  profile: () => [...settingsKeys.all, 'profile'] as const,
  notifications: () => [...settingsKeys.all, 'notifications'] as const,
  integrations: () => [...settingsKeys.all, 'integrations'] as const,
  subscription: () => [...settingsKeys.all, 'subscription'] as const,
  paymentHistory: () => [...settingsKeys.all, 'paymentHistory'] as const,
  team: () => [...settingsKeys.all, 'team'] as const,
};

// ============== Profile ==============

export function useProfile() {
  return useQuery<UserProfile>({
    queryKey: settingsKeys.profile(),
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserProfile, Error, ProfileUpdateRequest>({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.profile(), data);
    },
  });
}

// ============== Notifications ==============

export function useNotificationSettings() {
  return useQuery<NotificationSettings>({
    queryKey: settingsKeys.notifications(),
    queryFn: getNotificationSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation<NotificationSettings, Error, NotificationSettingsUpdate>({
    mutationFn: updateNotificationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.notifications(), data);
    },
  });
}

// ============== Integrations ==============

export function useIntegrations() {
  return useQuery<Integration[]>({
    queryKey: settingsKeys.integrations(),
    queryFn: getIntegrations,
    staleTime: 2 * 60 * 1000,
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation<Integration, Error, IntegrationPlatform>({
    mutationFn: connectIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.integrations() });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: disconnectIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.integrations() });
    },
  });
}

export function useSyncIntegration() {
  const queryClient = useQueryClient();

  return useMutation<Integration, Error, string>({
    mutationFn: syncIntegration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.integrations() });
    },
  });
}

// ============== Subscription ==============

export function useSubscription() {
  return useQuery<Subscription>({
    queryKey: settingsKeys.subscription(),
    queryFn: getSubscription,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePaymentHistory(limit: number = 10) {
  return useQuery<PaymentHistoryItem[]>({
    queryKey: [...settingsKeys.paymentHistory(), limit],
    queryFn: () => getPaymentHistory(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation<Subscription, Error, PlanType>({
    mutationFn: updateSubscription,
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.subscription(), data);
    },
  });
}

// ============== Team ==============

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: settingsKeys.team(),
    queryFn: getTeamMembers,
    staleTime: 2 * 60 * 1000,
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation<TeamMember, Error, TeamInviteRequest>({
    mutationFn: inviteTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team() });
    },
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation<TeamMember, Error, { memberId: string; data: TeamMemberUpdateRequest }>({
    mutationFn: ({ memberId, data }) => updateTeamMember(memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team() });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: removeTeamMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.team() });
    },
  });
}

export function useResendInvite() {
  return useMutation<void, Error, string>({
    mutationFn: resendInvite,
  });
}
