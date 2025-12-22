'use client';

/**
 * TanStack Query hooks for onboarding
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOnboardingStatus,
  updateOnboardingStep,
  skipOnboarding,
  sendVerificationEmail,
  confirmEmailVerification,
  completeOnboarding,
  type OnboardingStatus,
  type OnboardingStep,
  type EmailVerificationResponse,
  type OnboardingCompleteResponse,
} from '@/lib/api/onboarding';

// ============== Query Keys ==============

export const onboardingKeys = {
  all: ['onboarding'] as const,
  status: () => [...onboardingKeys.all, 'status'] as const,
};

// ============== Status ==============

export function useOnboardingStatus() {
  return useQuery<OnboardingStatus>({
    queryKey: onboardingKeys.status(),
    queryFn: getOnboardingStatus,
    staleTime: 5 * 60 * 1000,
  });
}

// ============== Step Update ==============

export function useUpdateStep() {
  const queryClient = useQueryClient();

  return useMutation<
    OnboardingStatus,
    Error,
    { step: OnboardingStep; data?: Record<string, unknown> }
  >({
    mutationFn: ({ step, data }) => updateOnboardingStep(step, data),
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.status(), data);
    },
  });
}

// ============== Skip ==============

export function useSkipOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<OnboardingStatus, Error>({
    mutationFn: skipOnboarding,
    onSuccess: (data) => {
      queryClient.setQueryData(onboardingKeys.status(), data);
    },
  });
}

// ============== Email Verification ==============

export function useSendVerificationEmail() {
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: sendVerificationEmail,
  });
}

export function useConfirmEmailVerification() {
  return useMutation<EmailVerificationResponse, Error, { email: string; code: string }>({
    mutationFn: ({ email, code }) => confirmEmailVerification(email, code),
  });
}

// ============== Complete ==============

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<OnboardingCompleteResponse, Error>({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}
