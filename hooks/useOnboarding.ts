import { useState, useEffect, useCallback } from 'react';
import { OnboardingState, AIModelPreference, UserProfile, UserInterest, ConnectedService } from '../types';

const ONBOARDING_STORAGE_KEY = 'phillos_onboarding_state_v3'; // Incremented version for new structure

const defaultUserProfile: UserProfile = {
  username: 'PhillOS User',
  avatarSeed: 'phillosuser',
};

const getDefaultState = (): OnboardingState => ({
  currentStep: 0,
  isComplete: false,
  modelPreference: 'local', // Default to local as per PhillOS document
  userProfile: null, 
  userInterests: [],
  connectedServices: [],
});

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(() => {
    try {
      const storedState = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (storedState) {
        const parsedState = JSON.parse(storedState) as OnboardingState;
        // Basic validation for the new structure
        if (
          typeof parsedState.isComplete === 'boolean' &&
          typeof parsedState.currentStep === 'number' &&
          (parsedState.modelPreference === 'local' || parsedState.modelPreference === 'cloud') &&
          (parsedState.userProfile === null || (typeof parsedState.userProfile === 'object' && parsedState.userProfile && typeof parsedState.userProfile.username === 'string' && typeof parsedState.userProfile.avatarSeed === 'string')) &&
          Array.isArray(parsedState.userInterests) &&
          Array.isArray(parsedState.connectedServices)
        ) {
           return parsedState;
        }
      }
    } catch (error) {
      console.error("Error reading onboarding state from localStorage:", error);
    }
    return getDefaultState();
  });

  useEffect(() => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(onboardingState));
    } catch (error) {
      console.error("Error saving onboarding state to localStorage:", error);
    }
  }, [onboardingState]);

  const setStep = useCallback((step: number) => {
    setOnboardingState(prev => ({ ...prev, currentStep: step, isComplete: prev.isComplete && step >= prev.currentStep ? prev.isComplete : false }));
  }, []);

  // Total steps: Welcome (0), AI Model (1), Privacy (2), User Profile (3), AI Prefs (4), Guided Tour (5)
  const TOTAL_ONBOARDING_STEPS = 6;

  const completeOnboarding = useCallback(() => {
    setOnboardingState(prev => ({
       ...prev, 
       isComplete: true, 
       currentStep: Math.max(prev.currentStep, TOTAL_ONBOARDING_STEPS), // Mark as past the last step
       userProfile: prev.userProfile || defaultUserProfile // Ensure userProfile is not null
    }));
  }, []);

  const setModelPreference = useCallback((preference: AIModelPreference) => {
    setOnboardingState(prev => ({ ...prev, modelPreference: preference }));
  }, []);

  const setUserProfile = useCallback((profile: UserProfile) => {
    setOnboardingState(prev => ({ ...prev, userProfile: profile }));
  }, []);

  const setUserInterests = useCallback((interests: UserInterest[]) => {
    setOnboardingState(prev => ({ ...prev, userInterests: interests }));
  }, []);

  const setConnectedServices = useCallback((services: ConnectedService[]) => {
    setOnboardingState(prev => ({ ...prev, connectedServices: services }));
  }, []);
  
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    setOnboardingState(getDefaultState());
    window.location.reload();
  }, []);


  return {
    currentStep: onboardingState.currentStep,
    isOnboardingComplete: onboardingState.isComplete,
    modelPreference: onboardingState.modelPreference,
    userProfile: onboardingState.userProfile || defaultUserProfile,
    userInterests: onboardingState.userInterests,
    connectedServices: onboardingState.connectedServices,
    setStep,
    completeOnboarding,
    setModelPreference,
    setUserProfile,
    setUserInterests,
    setConnectedServices,
    resetOnboarding,
    TOTAL_ONBOARDING_STEPS
  };
}