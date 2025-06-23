import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Bell } from 'lucide-react';
import { settingsService } from '../../../services/settingsService';
import { storageService } from '../../../services/storageService';

export const NotificationSettingsView: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(
    storageService.getNotificationsEnabled() ?? true,
  );
  const [dnd, setDnd] = useState<boolean>(
    storageService.getDoNotDisturb() ?? false,
  );

  useEffect(() => {
    settingsService
      .fetchNotificationsEnabled()
      .then(v => v !== null && setEnabled(v));
    settingsService
      .fetchDoNotDisturb()
      .then(v => v !== null && setDnd(v));
  }, []);

  const updateEnabled = (v: boolean) => {
    setEnabled(v);
    settingsService.setNotificationsEnabled(v);
  };

  const updateDnd = (v: boolean) => {
    setDnd(v);
    settingsService.setDoNotDisturb(v);
  };

  return (
    <GlassCard className="h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <Bell size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Notification Settings</h1>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => updateEnabled(e.target.checked)}
        />
        <span>Enable Notifications</span>
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={dnd}
          onChange={e => updateDnd(e.target.checked)}
        />
        <span>Do Not Disturb</span>
      </label>
    </GlassCard>
  );
};

export default NotificationSettingsView;
