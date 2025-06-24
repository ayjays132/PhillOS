import React from 'react';
import { ShieldAlert, CheckCircle2, DatabaseZap, UserCheck } from 'lucide-react';

interface PrivacyStepProps {
  onNext: () => void;
  onBack: () => void;
}

export const PrivacyStep: React.FC<PrivacyStepProps> = ({ onNext, onBack }) => {
  return (
    <div className="text-left flex flex-col h-full">
      <div className="text-center mb-8">
        <ShieldAlert size={48} className="mx-auto mb-4 text-green-400" />
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Your Privacy Matters</h2>
      </div>
      <p className="text-white/80 mb-6 leading-relaxed text-center max-w-lg mx-auto">
        PhillOS is built with privacy as a fundamental principle. We believe in transparency and empowering you with control over your data.
      </p>
      
      <ul className="space-y-4 mb-8 text-white/80 flex-grow">
        <li className="flex items-start p-3 bg-black/10 rounded-lg">
          <CheckCircle2 size={24} className="text-green-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-white/95 block">On-Device Processing First:</strong> 
            Sensitive data and core AI functionalities primarily run locally, especially when you choose the 'Local-First' AI model, ensuring your personal information stays with you.
          </div>
        </li>
        <li className="flex items-start p-3 bg-black/10 rounded-lg">
          <DatabaseZap size={24} className="text-purple-300 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-white/95 block">Transparent Cloud Usage:</strong> 
            If you opt for 'Cloud-Enhanced' AI, we'll clearly indicate when data is processed by services like Gemini (using your API key). You manage your subscriptions and their privacy policies apply.
          </div>
        </li>
        <li className="flex items-start p-3 bg-black/10 rounded-lg">
          <UserCheck size={24} className="text-cyan-300 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <strong className="text-white/95 block">User Control & Transparency:</strong> 
            You will have access to dashboards to understand data usage and manage your privacy preferences effectively.
          </div>
        </li>
      </ul>
      
      <p className="text-sm text-white/60 mb-8 text-center">
        Full privacy settings can be configured in detail after setup. By continuing, you acknowledge these core privacy principles.
      </p>

      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-auto">
        <button
          onClick={onBack}
          aria-label="Go back to the previous step"
          className="w-full sm:w-auto px-8 py-3 bg-white/10 hover:bg-white/20 text-white/80 font-semibold rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-1 focus:ring-cyan-400/80"
        >
          Back
        </button>
        <button
          onClick={onNext}
          aria-label="Continue to user profile setup"
          className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-green-400/80 hover:scale-105 shadow-md hover:shadow-green-500/40"
        >
          Next: Set Up Profile
        </button>
      </div>
    </div>
  );
};