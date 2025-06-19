
import React from 'react';
import { Brain, Cloud, ShieldCheck } from 'lucide-react';
import { AIModelPreference } from '../../types';

interface AIModelStepProps {
  onNext: () => void;
  onBack: () => void;
  currentPreference: AIModelPreference;
  setPreference: (preference: AIModelPreference) => void;
}

export const AIModelStep: React.FC<AIModelStepProps> = ({ onNext, onBack, currentPreference, setPreference }) => {
  const options = [
    {
      id: 'local' as AIModelPreference,
      icon: ShieldCheck,
      title: 'Local-First AI',
      description: 'Prioritizes on-device processing for maximum privacy and offline capability. Run `./scripts/setup-ollama.sh` to install the Qwen model and start the local service.',
      badge: 'Recommended',
      badgeColor: 'bg-green-600/90',
      borderColor: 'border-green-500',
      bgColor: 'bg-green-500/30'
    },
    {
      id: 'cloud' as AIModelPreference,
      icon: Cloud,
      title: 'Cloud-Enhanced AI',
      description: 'Leverages powerful cloud models (e.g., Gemini via your API key if configured) for advanced features, broader knowledge, and generative capabilities. Requires internet for cloud features.',
      badge: 'Advanced',
      badgeColor: 'bg-blue-600/90',
      borderColor: 'border-blue-500',
      bgColor: 'bg-blue-500/30'
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-8">
        <Brain size={48} className="mx-auto mb-4 text-cyan-300" />
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Choose Your AI Experience</h2>
        <p className="text-white/70 mt-2 max-w-lg mx-auto">
          PhillOS offers flexibility in how AI enhances your system. Your choice affects privacy and feature capabilities.
        </p>
      </div>
      
      <div className="space-y-4 mb-8 flex-grow">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setPreference(option.id)}
            aria-pressed={currentPreference === option.id}
            className={`w-full p-4 sm:p-5 border-2 rounded-xl text-left transition-all duration-200 ease-out flex items-start gap-4 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                        ${currentPreference === option.id 
                            ? `${option.bgColor} ${option.borderColor} shadow-lg shadow-purple-600/30 ring-purple-500` 
                            : 'bg-white/5 border-white/10 hover:border-purple-400/50 hover:bg-purple-900/20 focus:ring-purple-400'
                        }`}
          >
            <option.icon size={28} className={`mt-1 flex-shrink-0 ${currentPreference === option.id ? 'text-purple-300' : 'text-white/70'}`} />
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-lg font-semibold text-white/95">{option.title}</h3>
                {option.badge && (
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full text-white ${option.badgeColor}`}>
                    {option.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/75 leading-relaxed">{option.description}</p>
            </div>
          </button>
        ))}
      </div>

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
          aria-label="Continue to the next step"
          className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-purple-400/80 hover:scale-105 shadow-md hover:shadow-purple-500/40"
        >
          Next
        </button>
      </div>
    </div>
  );
};
