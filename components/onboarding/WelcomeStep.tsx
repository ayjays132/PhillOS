
import React from 'react';
import { Sparkles } from 'lucide-react'; 

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  return (
    <div className="text-center flex flex-col items-center justify-center h-full">
      <Sparkles size={64} className="mx-auto mb-6 text-purple-400 animate-pulse-slow" />
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Welcome to PhillOS</h1>
      <p className="text-lg text-white/80 mb-8 max-w-md">
        Discover an AI-native operating system designed to be intelligent, proactive, and deeply personalized.
      </p>
      <button
        onClick={onNext}
        aria-label="Get started with PhillOS setup"
        className="w-full sm:w-auto px-10 py-3.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-purple-400/80 hover:scale-105 shadow-lg hover:shadow-purple-500/50"
      >
        Get Started
      </button>
      <p className="text-xs text-white/50 mt-10">
        This is a conceptual prototype.
      </p>
    </div>
  );
};
