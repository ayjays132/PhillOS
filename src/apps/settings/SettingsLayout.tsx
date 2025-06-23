import React, { useState } from 'react';
import { NavLink, Outlet, Routes, Route, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/GlassCard';
import GeneralSettingsView from './GeneralSettingsView';
import PersonalizationSettingsView from './PersonalizationSettingsView';
import NetworkSettingsView from './NetworkSettingsView';
import PrivacySecuritySettingsView from './PrivacySecuritySettingsView';
import ApplicationsSettingsView from './ApplicationsSettingsView';
import SystemSettingsView from './SystemSettingsView';
import ControlPanel from './ControlPanel';
import NotificationSettingsView from './NotificationSettingsView';

const categories = [
  { id: 'general', name: 'General' },
  { id: 'personalization', name: 'Personalization' },
  { id: 'notifications', name: 'Notifications' },
  { id: 'network', name: 'Network & Connectivity' },
  { id: 'privacy', name: 'Privacy & Security' },
  { id: 'applications', name: 'Applications' },
  { id: 'system', name: 'System' },
  { id: 'control-panel', name: 'Control Panel' },
];

export const SettingsLayout: React.FC = () => {
  const [text, setText] = useState('');
  const navigate = useNavigate();

  const filtered = categories.filter(c =>
    c.name.toLowerCase().includes(text.toLowerCase()) ||
    c.id.toLowerCase().includes(text.toLowerCase())
  );

  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const { settingsCommandService } = await import('../../services/settingsCommandService');
      const ok = await settingsCommandService.execute(text);
      if (ok && filtered.length) {
        navigate(`/settings/${filtered[0].id}`);
      }
    }
  };

  return (
    <div className="flex h-full gap-4">
      <aside className="w-48 flex-shrink-0">
        <GlassCard className="h-full flex flex-col p-2 sm:p-4 gap-1">
          {filtered.map(cat => (
            <NavLink
              key={cat.id}
              to={`/settings/${cat.id}`}
              className={({ isActive }) =>
                `px-2 py-1 rounded-md text-sm transition-colors ${isActive ? 'bg-cyan-600/60 text-white' : 'hover:bg-white/10'}`
              }
            >
              {cat.name}
            </NavLink>
          ))}
        </GlassCard>
      </aside>
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <GlassCard className="p-2 sm:p-3">
          <input
            type="text"
            placeholder="Search settings or type a command..."
            className="w-full bg-transparent focus:outline-none text-sm placeholder-white/60"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
        </GlassCard>
        <div className="flex-1 overflow-auto">
          <Routes>
            <Route path="general" element={<GeneralSettingsView />} />
            <Route path="personalization" element={<PersonalizationSettingsView />} />
            <Route path="notifications" element={<NotificationSettingsView />} />
            <Route path="network" element={<NetworkSettingsView />} />
            <Route path="privacy" element={<PrivacySecuritySettingsView />} />
            <Route path="applications" element={<ApplicationsSettingsView />} />
            <Route path="system" element={<SystemSettingsView />} />
            <Route path="control-panel" element={<ControlPanel />} />
            <Route path="*" element={<Outlet />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
