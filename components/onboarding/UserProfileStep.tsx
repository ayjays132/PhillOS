import React, { useState, useEffect } from 'react';
import { UserCog, Image as ImageIcon, Check } from 'lucide-react';
import { UserProfile } from '../../types';

interface UserProfileStepProps {
  onNext: () => void;
  onBack: () => void;
  currentUserProfile: UserProfile; // Comes from useOnboarding, includes defaults
  setUserProfile: (profile: UserProfile) => void;
}

const avatarOptions = [
  { id: 'phillosDefault', name: 'Nebula', seed: 'phillosNebula' },
  { id: 'cyberOrb', name: 'Cyber Orb', seed: 'cyberOrbArt' },
  { id: 'crystalWave', name: 'Crystal Wave', seed: 'crystalWaveUI' },
  { id: 'geoMind', name: 'Geo Mind', seed: 'geometricMind' },
  { id: 'abstractFlow', name: 'Abstract Flow', seed: 'abstractFlowPattern' },
  { id: 'userInitials', name: 'Initials', seed: 'userInitialsExample' }, 
];


export const UserProfileStep: React.FC<UserProfileStepProps> = ({ onNext, onBack, currentUserProfile, setUserProfile }) => {
  const [username, setUsername] = useState(currentUserProfile.username);
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(currentUserProfile.avatarSeed);
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    setUsername(currentUserProfile.username);
    setSelectedAvatarSeed(currentUserProfile.avatarSeed);
  }, [currentUserProfile]);

  const handleNext = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setUsernameError('Username cannot be empty.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
      return;
    }
    setUsernameError('');
    setUserProfile({ username: trimmedUsername, avatarSeed: selectedAvatarSeed });
    onNext();
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (usernameError && e.target.value.trim().length >= 3) {
      setUsernameError('');
    }
  };
  
  const handleAvatarSelect = (seed: string) => {
    setSelectedAvatarSeed(seed);
    // Optimistically update, or wait for next button? Let's update immediately.
    setUserProfile({ username: username.trim() || currentUserProfile.username, avatarSeed: seed });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-center mb-6 sm:mb-8">
        <UserCog size={48} className="mx-auto mb-4 text-purple-300" />
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Personalize Your Profile</h2>
        <p className="text-white/70 mt-2 max-w-lg mx-auto">
          Set up your username and choose an avatar. This helps PhillOS make your experience unique.
        </p>
      </div>
      
      <div className="space-y-5 sm:space-y-6 mb-6 sm:mb-8 flex-grow">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-1.5">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="E.g., Alex Ryder"
            className={`w-full p-3 bg-white/5 border rounded-lg text-sm placeholder-white/40 focus:outline-none focus:ring-1 transition-shadow duration-200 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)] ${usernameError ? 'border-red-500 ring-red-500' : 'border-white/10 focus:ring-cyan-400/80'}`}
          />
          {usernameError && <p className="text-xs text-red-400 mt-1.5">{usernameError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Choose Your Avatar Style
          </label>
          <div className="grid grid-cols-3 gap-3">
            {avatarOptions.map((avatar) => (
              <button
                key={avatar.id}
                type="button"
                onClick={() => handleAvatarSelect(avatar.seed)}
                aria-pressed={selectedAvatarSeed === avatar.seed}
                className={`relative p-1.5 border-2 rounded-lg transition-all duration-150 ease-out aspect-[4/5] flex flex-col items-center justify-center focus:outline-none group
                            ${selectedAvatarSeed === avatar.seed 
                                ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-600/40 ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-900' 
                                : 'border-white/10 bg-white/5 hover:border-purple-400/50 focus:border-purple-400'
                            }`}
              >
                <img 
                  src={`https://picsum.photos/seed/${avatar.seed}/80/80`} 
                  alt={avatar.name}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-md object-cover mb-1.5 group-hover:opacity-80 transition-opacity" 
                />
                <span className="block text-[10px] sm:text-xs text-center text-white/70 group-hover:text-white/90 truncate w-full px-0.5">{avatar.name}</span>
                {selectedAvatarSeed === avatar.seed && (
                  <div className="absolute top-1.5 right-1.5 bg-purple-500 text-white rounded-full p-0.5 shadow-md">
                    <Check size={12} />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
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
          onClick={handleNext}
          aria-label="Continue to AI personalization"
          className="w-full sm:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-purple-400/80 hover:scale-105 shadow-md hover:shadow-purple-500/40"
        >
          Next: Personalize AI
        </button>
      </div>
    </div>
  );
};