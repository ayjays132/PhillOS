import React from 'react';
import { Mail, Bell, Settings } from 'lucide-react';
import { useOnboarding } from '../../hooks/useOnboarding'; // Import useOnboarding

export const UserProfileWidget: React.FC = () => {
  const { userProfile } = useOnboarding(); // Get userProfile from the hook

  // Use a default or fall back if userProfile is somehow null, though useOnboarding provides a default
  const username = userProfile?.username || 'PhillOS User';
  const avatarSeed = userProfile?.avatarSeed || 'phillosuser';
  const avatarUrl = `https://picsum.photos/seed/${avatarSeed}/100/100`;
  const email = `${username.toLowerCase().replace(/\s+/g, '.')}@phillos.concept`;


  return (
    <div className="flex flex-col items-center text-center p-2">
      <img 
        src={avatarUrl} 
        alt={`${username}'s Avatar`}
        className="w-20 h-20 rounded-full mb-3 border-2 border-purple-400/50 shadow-lg object-cover"
      />
      <h4 className="text-xl font-semibold text-white/90 truncate max-w-full px-2">{username}</h4>
      <p className="text-sm text-white/60 mb-3 truncate max-w-full px-2">{email}</p>
      <div className="flex space-x-3 mb-4">
        <button aria-label="Mail" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400">
          <Mail size={18} className="text-blue-300" />
        </button>
        <button aria-label="Notifications" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400">
          <Bell size={18} className="text-yellow-300" />
        </button>
        <button aria-label="Settings" className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400">
          <Settings size={18} className="text-gray-300" />
        </button>
      </div>
      <button className="w-full p-2.5 text-sm bg-purple-600/70 hover:bg-purple-500/70 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-purple-300">
        View Full Profile
      </button>
    </div>
  );
};