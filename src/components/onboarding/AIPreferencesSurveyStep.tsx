import React from 'react';
import { Check, SlidersHorizontal, Share2, Palette, Cpu, Plane, Dumbbell, BookOpen, Newspaper } from 'lucide-react';
import { UserInterest, ConnectedService } from '../../types';

interface AIPreferencesSurveyStepProps {
  onNext: () => void;
  onBack: () => void;
  currentInterests: UserInterest[];
  setInterests: (interests: UserInterest[]) => void;
  currentServices: ConnectedService[];
  setServices: (services: ConnectedService[]) => void;
}

const interestOptions: { id: UserInterest; name: string; icon: React.ElementType }[] = [
  { id: 'technology', name: 'Technology', icon: Cpu },
  { id: 'art', name: 'Art & Design', icon: Palette },
  { id: 'productivity', name: 'Productivity', icon: SlidersHorizontal },
  { id: 'wellness', name: 'Wellness', icon: Dumbbell },
  { id: 'gaming', name: 'Gaming', icon: Plane }, // Using Plane for Gaming as Gamepad2 used elsewhere
  { id: 'science', name: 'Science', icon: BookOpen },
  { id: 'news', name: 'News', icon: Newspaper },
];

const serviceOptions: { id: ConnectedService; name: string; icon: React.ElementType }[] = [
  { id: 'calendar', name: 'Calendar', icon: SlidersHorizontal }, // Lucide doesn't have a direct Calendar icon, adjust as needed
  { id: 'contacts', name: 'Contacts', icon: SlidersHorizontal }, // Lucide doesn't have a direct Contacts icon
  { id: 'cloudStorage', name: 'Cloud Storage', icon: SlidersHorizontal }, // Lucide doesn't have a direct Cloud icon for this context
  { id: 'email', name: 'Email', icon: SlidersHorizontal }, // Lucide doesn't have a direct Email icon
];


export const AIPreferencesSurveyStep: React.FC<AIPreferencesSurveyStepProps> = ({ 
  onNext, onBack, currentInterests, setInterests, currentServices, setServices 
}) => {

  const toggleInterest = (interest: UserInterest) => {
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest];
    setInterests(newInterests);
  };

  const toggleService = (service: ConnectedService) => {
    const newServices = currentServices.includes(service)
      ? currentServices.filter(s => s !== service)
      : [...currentServices, service];
    setServices(newServices);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6 sm:mb-8">
        <SlidersHorizontal size={48} className="mx-auto mb-4 text-yellow-300" />
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Kickstart Your AI</h2>
        <p className="text-white/70 mt-2 max-w-lg mx-auto">
          Help PhillOS understand what matters to you for a more personalized experience from day one.
        </p>
      </div>
      
      <div className="space-y-6 mb-6 sm:mb-8 flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-3">Select Your Interests:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {interestOptions.map((item) => (
              <button
                key={item.id}
                onClick={() => toggleInterest(item.id)}
                aria-pressed={currentInterests.includes(item.id)}
                className={`relative p-3 border-2 rounded-lg transition-all duration-150 ease-out flex flex-col items-center justify-center text-center focus:outline-none group aspect-[4/3]
                            ${currentInterests.includes(item.id)
                                ? 'border-yellow-500 bg-yellow-500/10 shadow-md shadow-yellow-600/30 ring-1 ring-yellow-400' 
                                : 'border-white/10 bg-white/5 hover:border-yellow-400/50 focus:border-yellow-400'
                            }`}
              >
                <item.icon size={28} className={`mb-1.5 transition-colors ${currentInterests.includes(item.id) ? 'text-yellow-400' : 'text-white/70 group-hover:text-yellow-300'}`} />
                <span className="text-xs sm:text-sm text-white/80 group-hover:text-white/95">{item.name}</span>
                {currentInterests.includes(item.id) && (
                  <div className="absolute top-1.5 right-1.5 bg-yellow-500 text-black rounded-full p-0.5 shadow-sm">
                    <Check size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white/90 mb-3">Connect Services (Optional):</h3>
           <p className="text-xs text-white/60 mb-3">Simulated: No actual data connections are made in this prototype.</p>
          <div className="space-y-3">
            {serviceOptions.map((service) => (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                aria-pressed={currentServices.includes(service.id)}
                className={`w-full p-3 border-2 rounded-lg text-left transition-all duration-150 ease-out flex items-center justify-between focus:outline-none group
                            ${currentServices.includes(service.id)
                                ? 'border-cyan-500 bg-cyan-500/10 shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400' 
                                : 'border-white/10 bg-white/5 hover:border-cyan-400/50 focus:border-cyan-400'
                            }`}
              >
                <div className="flex items-center">
                  <service.icon size={22} className={`mr-2.5 transition-colors ${currentServices.includes(service.id) ? 'text-cyan-400' : 'text-white/70 group-hover:text-cyan-300'}`} />
                  <span className="text-sm text-white/80 group-hover:text-white/95">{service.name}</span>
                </div>
                <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all ${currentServices.includes(service.id) ? 'bg-cyan-500 border-cyan-400' : 'border-white/30 group-hover:border-cyan-400'}`}>
                  {currentServices.includes(service.id) && <Check size={14} className="text-black" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3 mt-auto pt-4 border-t border-white/5">
        <button
          onClick={onBack}
          aria-label="Go back to the previous step"
          className="w-full sm:w-auto px-8 py-3 bg-white/10 hover:bg-white/20 text-white/80 font-semibold rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-1 focus:ring-cyan-400/80"
        >
          Back
        </button>
        <button
          onClick={onNext}
          aria-label="Continue to guided tour"
          className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-purple-400/80 hover:scale-105 shadow-md hover:shadow-purple-500/40"
        >
          Next: Guided Tour
        </button>
      </div>
    </div>
  );
};