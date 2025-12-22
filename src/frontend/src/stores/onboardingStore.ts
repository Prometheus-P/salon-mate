/**
 * Onboarding Store
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  OnboardingStep,
  ProfileStepData,
  ShopStepData,
  IntegrationSelection,
} from '@/lib/api/onboarding';

interface OnboardingState {
  // Current step
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  isCompleted: boolean;

  // Step data
  profileData: ProfileStepData | null;
  shopData: ShopStepData | null;
  integrations: IntegrationSelection[];

  // Email verification
  emailVerified: boolean;

  // Actions
  setCurrentStep: (step: OnboardingStep) => void;
  markStepCompleted: (step: OnboardingStep) => void;
  setProfileData: (data: ProfileStepData) => void;
  setShopData: (data: ShopStepData) => void;
  setIntegrations: (integrations: IntegrationSelection[]) => void;
  toggleIntegration: (platform: string) => void;
  setEmailVerified: (verified: boolean) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 'welcome' as OnboardingStep,
  completedSteps: [] as OnboardingStep[],
  isCompleted: false,
  profileData: null,
  shopData: null,
  integrations: [
    { platform: 'google' as const, selected: false },
    { platform: 'naver' as const, selected: false },
    { platform: 'instagram' as const, selected: false },
  ],
  emailVerified: false,
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentStep: (step) => set({ currentStep: step }),

      markStepCompleted: (step) =>
        set((state) => ({
          completedSteps: state.completedSteps.includes(step)
            ? state.completedSteps
            : [...state.completedSteps, step],
          isCompleted: step === 'complete',
        })),

      setProfileData: (data) => set({ profileData: data }),

      setShopData: (data) => set({ shopData: data }),

      setIntegrations: (integrations) => set({ integrations }),

      toggleIntegration: (platform) =>
        set((state) => ({
          integrations: state.integrations.map((i) =>
            i.platform === platform ? { ...i, selected: !i.selected } : i
          ),
        })),

      setEmailVerified: (verified) => set({ emailVerified: verified }),

      reset: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        isCompleted: state.isCompleted,
        profileData: state.profileData,
        shopData: state.shopData,
      }),
    }
  )
);
