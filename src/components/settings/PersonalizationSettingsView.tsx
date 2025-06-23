import React, { useState } from 'react';
import { GlassCard } from '../GlassCard';
import { Palette } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export const PersonalizationSettingsView: React.FC = () => {
  const [wallpaper, setWallpaper] = useState('');
  const { theme, setTheme } = useTheme();

  return (
    <GlassCard className="h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <Palette size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Personalization</h1>
      </div>
      <label className="text-sm flex flex-col gap-1">
        <span>Wallpaper URL</span>
        <input
          type="text"
          value={wallpaper}
          onChange={e => setWallpaper(e.target.value)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        />
      </label>
      <label className="text-sm flex flex-col gap-1">
        <span>Theme</span>
        <select
          value={theme}
          onChange={e => setTheme(e.target.value as any)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>
    </GlassCard>
  );
};

export default PersonalizationSettingsView;
