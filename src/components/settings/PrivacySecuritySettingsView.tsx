import React from 'react';
import { GlassCard } from '../GlassCard';
import { Shield } from 'lucide-react';

export const PrivacySecuritySettingsView: React.FC = () => (
  <GlassCard className="h-full flex flex-col gap-4">
    <div className="flex items-center mb-4">
      <Shield size={24} className="text-cyan-300 mr-3" />
      <h1 className="text-xl sm:text-2xl font-bold">Privacy & Security</h1>
    </div>
    <p className="text-sm">Placeholder for permissions and firewall rules.</p>
  </GlassCard>
);

export default PrivacySecuritySettingsView;
