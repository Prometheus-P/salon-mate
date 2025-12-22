/**
 * Settings API Client
 */

import { fetchWithAuth } from './client';

// ============== Types ==============

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  profileImage: string | null;
  createdAt: string;
}

export interface ProfileUpdateRequest {
  name?: string;
  phone?: string;
  profileImage?: string;
}

export interface NotificationChannels {
  email: boolean;
  push: boolean;
  kakao: boolean;
}

export interface NotificationType {
  email: boolean;
  push: boolean;
  kakao: boolean;
}

export interface NotificationSettings {
  channels: NotificationChannels;
  newReview: NotificationType;
  negativeReview: NotificationType;
  reviewResponseComplete: NotificationType;
  postPublished: NotificationType;
  postFailed: NotificationType;
  weeklyReport: NotificationType;
  monthlyReport: NotificationType;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export type NotificationSettingsUpdate = Partial<NotificationSettings>;

export type IntegrationPlatform = 'google' | 'naver' | 'kakao' | 'instagram' | 'facebook' | 'openai';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'syncing';

export interface Integration {
  id: string;
  platform: IntegrationPlatform;
  status: IntegrationStatus;
  accountName: string | null;
  lastSyncedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export type PlanType = 'free' | 'pro' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanFeatures {
  reviewLimit: number | null;
  aiResponseLimit: number;
  postLimit: number | null;
  teamMemberLimit: number;
  analytics: 'basic' | 'detailed' | 'custom';
  support: 'email' | 'priority' | 'dedicated';
}

export interface Usage {
  aiResponsesUsed: number;
  aiResponsesLimit: number;
  teamMembersUsed: number;
  teamMembersLimit: number;
  shopsCount: number;
}

export interface Subscription {
  id: string;
  plan: PlanType;
  price: number;
  billingCycle: BillingCycle;
  nextBillingDate: string | null;
  features: PlanFeatures;
  usage: Usage;
  paymentMethod: string | null;
  paymentLastFour: string | null;
}

export type PaymentStatus = 'completed' | 'pending' | 'failed';

export interface PaymentHistoryItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  receiptUrl: string | null;
}

export type TeamRole = 'owner' | 'admin' | 'member';

export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: TeamRole;
  shopAccess: string[];
  joinedAt: string;
  isPending: boolean;
}

export interface TeamInviteRequest {
  email: string;
  role: TeamRole;
  shopAccess: string[];
}

export interface TeamMemberUpdateRequest {
  role?: TeamRole;
  shopAccess?: string[];
}

// ============== Profile API ==============

export async function getProfile(): Promise<UserProfile> {
  return fetchWithAuth<UserProfile>('/settings/profile');
}

export async function updateProfile(data: ProfileUpdateRequest): Promise<UserProfile> {
  return fetchWithAuth<UserProfile>('/settings/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============== Notification Settings API ==============

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return fetchWithAuth<NotificationSettings>('/settings/notifications');
}

export async function updateNotificationSettings(
  data: NotificationSettingsUpdate
): Promise<NotificationSettings> {
  return fetchWithAuth<NotificationSettings>('/settings/notifications', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ============== Integrations API ==============

export async function getIntegrations(): Promise<Integration[]> {
  return fetchWithAuth<Integration[]>('/settings/integrations');
}

export async function connectIntegration(platform: IntegrationPlatform): Promise<Integration> {
  return fetchWithAuth<Integration>(`/settings/integrations/${platform}`, {
    method: 'POST',
  });
}

export async function disconnectIntegration(integrationId: string): Promise<void> {
  await fetchWithAuth(`/settings/integrations/${integrationId}`, {
    method: 'DELETE',
  });
}

export async function syncIntegration(integrationId: string): Promise<Integration> {
  return fetchWithAuth<Integration>(`/settings/integrations/${integrationId}/sync`, {
    method: 'POST',
  });
}

// ============== Subscription API ==============

export async function getSubscription(): Promise<Subscription> {
  return fetchWithAuth<Subscription>('/settings/subscription');
}

export async function getPaymentHistory(limit: number = 10): Promise<PaymentHistoryItem[]> {
  return fetchWithAuth<PaymentHistoryItem[]>(`/settings/subscription/history?limit=${limit}`);
}

export async function updateSubscription(plan: PlanType): Promise<Subscription> {
  return fetchWithAuth<Subscription>(`/settings/subscription?plan=${plan}`, {
    method: 'PATCH',
  });
}

// ============== Team API ==============

export async function getTeamMembers(): Promise<TeamMember[]> {
  return fetchWithAuth<TeamMember[]>('/settings/team');
}

export async function inviteTeamMember(data: TeamInviteRequest): Promise<TeamMember> {
  return fetchWithAuth<TeamMember>('/settings/team/invite', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTeamMember(
  memberId: string,
  data: TeamMemberUpdateRequest
): Promise<TeamMember> {
  return fetchWithAuth<TeamMember>(`/settings/team/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function removeTeamMember(memberId: string): Promise<void> {
  await fetchWithAuth(`/settings/team/${memberId}`, {
    method: 'DELETE',
  });
}

export async function resendInvite(memberId: string): Promise<void> {
  await fetchWithAuth(`/settings/team/${memberId}/resend-invite`, {
    method: 'POST',
  });
}
