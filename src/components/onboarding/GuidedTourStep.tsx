import React, { useState, useEffect } from 'react';
import { Lightbulb, BotMessageSquare, Layers, CheckCircle } from 'lucide-react'; // Using Layers for 'Living Glass'

interface GuidedTourStepProps {
  onNext: () => void; // This will trigger completeOnboarding in the stepper
  onBack: () => void;
}

const tourFeatures = [
  {
    icon: Lightbulb,
    title: "Proactive Intelligence",
    description: "PhillOS anticipates your needs, surfacing relevant information and actions before you even ask. It learns and adapts to you.",
    color: "text-yellow-300",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/30"
  },
  {
    icon: BotMessageSquare,
    title: "Conversational Control",
    description: "Interact with your OS naturally. Simply tell PhillOS what you want to do, using voice or text, for a seamless experience.",
    color: "text-purple-300",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30"
  },
  {
    icon: Layers,
    title: "Living Glass UI",
    description: "Experience a stunningly fluid and adaptive interface. The 'Living Glass' design is both beautiful and intuitive, responding to your context.",
    color: "text-cyan-300",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30"
  }
];

export const GuidedTourStep: React.FC<GuidedTourStepProps> = ({ onNext, onBack }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % tourFeatures.length);
    }, 4000); // Auto-advance every 4 seconds
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const CurrentIcon = tourFeatures[activeIndex].icon;

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6 sm:mb-8">
        <CheckCircle size={48} className="mx-auto mb-4 text-green-400" />
        <h2 className="text-2xl sm:text-3xl font-bold text-white">One Last Step: Discover PhillOS</h2>
        <p className="text-white/70 mt-2 max-w-lg mx-auto">
          Here are some core philosophies that make PhillOS unique. Get ready for a new era of interaction!
        </p>
      </div>
      
      <div className="flex-grow flex flex-col items-center justify-center p-4 rounded-xl glass-card-style !bg-black/10 shadow-lg mb-6 sm:mb-8">
        {tourFeatures.map((feature, index) => (
          <div
            key={feature.title}
            className={`w-full transition-all duration-700 ease-in-out ${index === activeIndex ? 'opacity-100 translate-y-0 max-h-[300px]' : 'opacity-0 -translate-y-5 max-h-0 absolute invisible'}`}
          >
            {index === activeIndex && (
              <div className={`p-4 rounded-lg text-center flex flex-col items-center justify-center ${feature.bgColor} border ${feature.borderColor}`}>
                 <feature.icon size={40} className={`mb-3 ${feature.color} transition-all duration-500 transform group-hover:scale-110`} />
                <h3 className={`text-xl font-semibold mb-2 ${feature.color}`}>{feature.title}</h3>
                <p className="text-sm text-white/80 leading-relaxed">{feature.description}</p>
              </div>
            )}
          </div>
        ))}
        <div className="flex justify-center space-x-2 mt-4">
            {tourFeatures.map((_, index) => (
                <button
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    aria-label={`Show feature ${index + 1}`}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                        index === activeIndex ? 'bg-cyan-400 scale-125' : 'bg-white/30 hover:bg-white/50'
                    }`}
                />
            ))}
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
          onClick={onNext} // This will call completeOnboarding in the stepper
          aria-label="Finish setup and explore PhillOS"
          className="w-full sm:w-auto px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-green-400/80 hover:scale-105 shadow-md hover:shadow-green-500/40"
        >
          Finish Setup & Explore PhillOS
        </button>
      </div>
    </div>
  );
};