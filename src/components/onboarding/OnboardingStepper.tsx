import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useOnboarding } from '../../hooks/useOnboarding';
import { WelcomeStep } from './WelcomeStep';
import { AIModelStep } from './AIModelStep';
import { PrivacyStep } from './PrivacyStep';
import { UserProfileStep } from './UserProfileStep';
import { AIPreferencesSurveyStep } from './AIPreferencesSurveyStep';
import { GuidedTourStep } from './GuidedTourStep';
import { GlassCard } from '../GlassCard';
import { Loader2 } from 'lucide-react';

export const OnboardingStepper: React.FC = () => {
  const { 
    currentStep, 
    setStep, 
    completeOnboarding, 
    isOnboardingComplete, 
    modelPreference, 
    setModelPreference,
    userProfile,
    setUserProfile,
    userInterests,
    setUserInterests,
    connectedServices,
    setConnectedServices,
    resetOnboarding,
    TOTAL_ONBOARDING_STEPS
  } = useOnboarding();
  
  const navigate = useNavigate();
  const location = useLocation();

  // The App.tsx component will handle primary redirection logic.
  // This useEffect is a fallback or sanity check if App.tsx's logic is somehow bypassed or delayed.
  useEffect(() => {
    if (isOnboardingComplete && location.pathname === '/onboarding') {
      // Intentionally not navigating here directly to let App.tsx handle it.
      // The loading screen below will show. If App.tsx doesn't redirect, this indicates an issue there.
      console.log("Onboarding complete, OnboardingStepper waiting for App.tsx to redirect from /onboarding.");
    }
  }, [isOnboardingComplete, location.pathname, navigate]);

  const nextStepOrFinish = () => {
    if (currentStep < TOTAL_ONBOARDING_STEPS - 1) {
      setStep(currentStep + 1);
    } else {
      // This is after the last actual step (GuidedTourStep), so mark onboarding as complete.
      // App.tsx will handle navigation based on isOnboardingComplete state.
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };
  
  // If onboarding is complete and current path is /onboarding,
  // display a loading message. App.tsx should then redirect.
  if (isOnboardingComplete && location.pathname === '/onboarding') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950">
        <GlassCard className="w-full max-w-md !p-8 text-center !shadow-2xl !shadow-purple-700/50">
          <Loader2 size={48} className="mx-auto mb-6 text-purple-400 animate-spin" />
          <h2 className="text-2xl font-semibold text-white mb-2">Setup Complete!</h2>
          <p className="text-white/70">Redirecting to your PhillOS dashboard...</p>
        </GlassCard>
         <button 
          onClick={resetOnboarding} 
          className="mt-6 text-xs text-white/50 hover:text-white underline"
          aria-label="Reset onboarding process (for development)"
         >
          Reset Onboarding (Dev)
        </button>
      </div>
    );
  }

  // If App.tsx has already redirected away from /onboarding due to completion, this component shouldn't render.
  if (isOnboardingComplete && location.pathname !== '/onboarding') {
    return null; 
  }


  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={nextStepOrFinish} />;
      case 1:
        return <AIModelStep onNext={nextStepOrFinish} onBack={prevStep} currentPreference={modelPreference} setPreference={setModelPreference} />;
      case 2:
        return <PrivacyStep onNext={nextStepOrFinish} onBack={prevStep} />;
      case 3:
        return <UserProfileStep onNext={nextStepOrFinish} onBack={prevStep} currentUserProfile={userProfile} setUserProfile={setUserProfile} />;
      case 4:
        return <AIPreferencesSurveyStep onNext={nextStepOrFinish} onBack={prevStep} currentInterests={userInterests} setInterests={setUserInterests} currentServices={connectedServices} setServices={setConnectedServices} />;
      case 5: // This is the last actual setup step
        return <GuidedTourStep onNext={nextStepOrFinish} onBack={prevStep} />;
      default:
        // This case should ideally not be reached.
        // If not complete and step is out of bounds, reset to first step.
        setStep(0); 
        return <WelcomeStep onNext={nextStepOrFinish} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950">
      <GlassCard className="w-full max-w-2xl !p-0 overflow-hidden !shadow-2xl !shadow-purple-700/50">
        <div className="p-6 sm:p-8 min-h-[500px] sm:min-h-[550px] flex flex-col justify-center"> {/* Adjusted min-height for more content */}
          {renderStepContent()}
        </div>
        {!isOnboardingComplete && currentStep < TOTAL_ONBOARDING_STEPS && (
          <div className="p-4 bg-black/10 border-t border-white/10">
            <div className="w-full bg-white/10 rounded-full h-2.5">
              <div
                className="bg-cyan-400 h-2.5 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentStep + 1) / TOTAL_ONBOARDING_STEPS) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-center text-white/50 mt-2">
              Step {currentStep + 1} of {TOTAL_ONBOARDING_STEPS}
            </p>
          </div>
        )}
      </GlassCard>
       <button 
        onClick={resetOnboarding} 
        className="mt-6 text-xs text-white/50 hover:text-white underline"
        aria-label="Reset onboarding process (for development)"
       >
        Reset Onboarding (Dev)
      </button>
    </div>
  );
};