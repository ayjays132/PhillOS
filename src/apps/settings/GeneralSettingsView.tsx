import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Cog } from 'lucide-react';
import { systemSettingsService } from '../../services/systemSettingsService';

export const GeneralSettingsView: React.FC = () => {
  const [time, setTime] = useState('');
  const [region, setRegion] = useState('US');
  const [language, setLanguage] = useState('en');
  const [dnd, setDnd] = useState(false);

  useEffect(() => {
    systemSettingsService.getTime().then(t => t && setTime(t.slice(0, 16)));
    systemSettingsService.getLocale().then(loc => {
      if (loc) {
        setRegion(loc.region);
        setLanguage(loc.language);
      }
    });
  }, []);

  const applyTime = () => {
    systemSettingsService.setTime(new Date(time).toISOString());
  };

  const applyLocale = () => {
    systemSettingsService.setLocale({ region, language });
  };

  return (
    <GlassCard className="h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <Cog size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">General Settings</h1>
      </div>
      <label className="text-sm flex flex-col gap-1">
        <span>Date & Time</span>
        <input
          type="datetime-local"
          value={time}
          onChange={e => setTime(e.target.value)}
          onBlur={applyTime}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        />
      </label>
      <label className="text-sm flex flex-col gap-1">
        <span>Region</span>
        <input
          type="text"
          value={region}
          onChange={e => setRegion(e.target.value)}
          onBlur={applyLocale}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        />
      </label>
      <label className="text-sm flex flex-col gap-1">
        <span>Language</span>
        <input
          type="text"
          value={language}
          onChange={e => setLanguage(e.target.value)}
          onBlur={applyLocale}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={dnd}
          onChange={e => setDnd(e.target.checked)}
        />
        <span>Do Not Disturb</span>
      </label>
    </GlassCard>
  );
};

export default GeneralSettingsView;
