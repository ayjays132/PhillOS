import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { useAuth } from '../contexts/AuthContext';
import NetworkSetup from './NetworkSetup';
import LockScreenMedia from './LockScreenMedia';

export const LockScreen: React.FC = () => {
  const { login, faceLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleFace = async () => {
    await faceLogin();
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
        </form>
        <button className="mt-3 text-sm underline" onClick={handleFace}>
          Use Face Login
        </button>
      </GlassCard>
      <NetworkSetup />
      <LockScreenMedia />
    </div>
  );
};

export default LockScreen;
