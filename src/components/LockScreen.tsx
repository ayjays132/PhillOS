import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { useAuth } from '../contexts/AuthContext';
import NetworkSetup from './NetworkSetup';
import LockScreenMedia from './LockScreenMedia';
import LockScreenNotifications from './LockScreenNotifications';
import { offlineService } from '../../services/offlineService';

export const LockScreen: React.FC = () => {
  const { login, faceLogin, fingerprintLogin, voiceLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [offline, setOffline] = useState(offlineService.isOffline());

  useEffect(() => offlineService.subscribe(setOffline), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleFace = async () => {
    await faceLogin();
  };

  const handleFingerprint = async () => {
    await fingerprintLogin();
  };

  const handleVoice = async () => {
    await voiceLogin();
  };

  const handleGuest = async () => {
    await login('', '');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950 text-white">
      <GlassCard className="w-60 text-center">
        <form onSubmit={handleLogin} className="flex flex-col gap-2">
          <input
            className="rounded p-1 text-gray-900"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            className="rounded p-1 text-gray-900"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        <button type="submit" className="bg-white/20 rounded py-1 mt-1 hover:bg-white/30">
          Login
        </button>
        {offline && (
          <button
            type="button"
            className="bg-white/20 rounded py-1 mt-1 hover:bg-white/30"
            onClick={handleGuest}
          >
            Guest Login
          </button>
        )}
      </form>
      <button className="mt-3 text-sm underline" onClick={handleFace}>
        Use Face Login
      </button>
      <button className="mt-1 text-sm underline" onClick={handleFingerprint}>
        Use Fingerprint
      </button>
      <button className="mt-1 text-sm underline" onClick={handleVoice}>
        Use Voice Login
      </button>
      </GlassCard>
      <NetworkSetup />
      <LockScreenNotifications />
      <LockScreenMedia />
    </div>
  );
};

export default LockScreen;
