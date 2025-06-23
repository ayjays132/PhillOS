import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { useAuth } from '../contexts/AuthContext';

const networks = ['Home Wi-Fi', 'Office Wi-Fi', 'Public Wi-Fi'];

const NetworkWidget: React.FC = () => {
  const [selected, setSelected] = useState(networks[0]);
  return (
    <GlassCard className="mt-4 w-60 text-sm text-center">
      <div className="font-semibold mb-2">Wi-Fi Networks</div>
      <select
        className="w-full rounded bg-transparent border border-white/20 p-1"
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        {networks.map(n => (
          <option key={n} value={n} className="text-gray-900">
            {n}
          </option>
        ))}
      </select>
    </GlassCard>
  );
};

const MediaWidget: React.FC = () => {
  const [state, setState] = useState<'playing' | 'paused' | null>(null);
  useEffect(() => {
    const audio = document.querySelector('audio');
    if (audio) setState(!audio.paused ? 'playing' : 'paused');
  }, []);

  const toggle = () => {
    const audio = document.querySelector('audio') as HTMLMediaElement | null;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setState('playing');
    } else {
      audio.pause();
      setState('paused');
    }
  };

  if (state === null) return null;

  return (
    <GlassCard className="mt-4 w-60 text-sm text-center">
      <div className="font-semibold mb-2">Media Controls</div>
      <button
        className="px-3 py-1 rounded bg-white/20 hover:bg-white/30"
        onClick={toggle}
      >
        {state === 'playing' ? 'Pause' : 'Play'}
      </button>
    </GlassCard>
  );
};

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
      <NetworkWidget />
      <MediaWidget />
    </div>
  );
};

export default LockScreen;
