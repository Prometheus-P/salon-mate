/**
 * Onboarding API Client
 */

import { fetchWithAuth } from './client';

// ============== Types ==============

export type OnboardingStep = 'welcome' | 'profile' | 'shop' | 'integrations' | 'complete';

export interface OnboardingStatus {
  userId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isCompleted: boolean;
  startedAt: string;
  completedAt: string | null;
}

export interface ProfileStepData {
  name: string;
  phone?: string;
  profileImage?: string;
}

export type BusinessType = 'hairsalon' | 'nailshop' | 'skincare' | 'barbershop' | 'other';

export interface ShopStepData {
  name: string;
  businessType: BusinessType;
  address?: string;
  phone?: string;
  operatingHours?: string;
}

export interface ShopResponse {
  id: string;
  name: string;
  businessType: string;
  address: string | null;
  phone: string | null;
}

export type IntegrationPlatform = 'google' | 'naver' | 'instagram';

export interface IntegrationSelection {
  platform: IntegrationPlatform;
  selected: boolean;
}

export interface IntegrationStepData {
  integrations: IntegrationSelection[];
  skipAll?: boolean;
}

export interface EmailVerificationResponse {
  email: string;
  isVerified: boolean;
  verifiedAt: string | null;
}

export interface OnboardingCompleteResponse {
  userId: string;
  shopId: string;
  profileCompleted: boolean;
  shopCreated: boolean;
  integrationsConnected: number;
  completedAt: string;
}

// ============== API Functions ==============

export async function getOnboardingStatus(): Promise<OnboardingStatus> {
  return fetchWithAuth<OnboardingStatus>('/onboarding/status');
}

export async function updateOnboardingStep(
  step: OnboardingStep,
  data?: Record<string, unknown>
): Promise<OnboardingStatus> {
  return fetchWithAuth<OnboardingStatus>('/onboarding/step', {
    method: 'POST',
    body: JSON.stringify({ step, data }),
  });
}

export async function skipOnboarding(): Promise<OnboardingStatus> {
  return fetchWithAuth<OnboardingStatus>('/onboarding/skip', {
    method: 'POST',
  });
}

export async function sendVerificationEmail(email: string): Promise<{ success: boolean }> {
  return fetchWithAuth('/onboarding/verify-email/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function confirmEmailVerification(
  email: string,
  code: string
): Promise<EmailVerificationResponse> {
  return fetchWithAuth<EmailVerificationResponse>('/onboarding/verify-email/confirm', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function completeOnboarding(): Promise<OnboardingCompleteResponse> {
  return fetchWithAuth<OnboardingCompleteResponse>('/onboarding/complete', {
    method: 'POST',
  });
}
