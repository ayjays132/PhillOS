import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';

const NetworkSetup: React.FC = () => {
  const [networks, setNetworks] = useState<string[]>([]);
  const [selected, setSelected] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const scan = async () => {
    try {
      const res = await fetch('/api/wifi/networks');
      if (!res.ok) throw new Error('scan failed');
      const data = await res.json();
      if (Array.isArray(data.networks)) {
        setNetworks(data.networks);
        if (data.networks.length) setSelected(data.networks[0]);
      }
    } catch {
      setNetworks([]);
    }
  };

  const connect = async () => {
    if (!selected) return;
    try {
      const res = await fetch('/api/wifi/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid: selected, password }),
      });
      const data = await res.json();
      if (data && data.success) {
        setStatus('Connected');
      } else {
        setStatus('Failed');
      }
    } catch {
      setStatus('Failed');
    }
  };

  useEffect(() => { scan(); }, []);

  return (
    <GlassCard className="mt-4 w-60 text-sm text-center">
      <div className="font-semibold mb-2">Wi-Fi</div>
      <div className="flex mb-1">
        <select
          className="flex-grow rounded bg-transparent border border-white/20 p-1 text-gray-900"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          {networks.map(n => (
            <option key={n} value={n} className="text-gray-900">
              {n}
            </option>
          ))}
        </select>
        <button
          className="ml-2 px-2 rounded bg-white/20 hover:bg-white/30"
          onClick={scan}
        >
          Scan
        </button>
      </div>
      <input
        type="password"
        className="w-full rounded p-1 text-gray-900"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button
        className="mt-2 px-3 py-1 rounded bg-white/20 hover:bg-white/30"
        onClick={connect}
      >
        Connect
      </button>
      {status && <div className="mt-1">{status}</div>}
    </GlassCard>
  );
};

export default NetworkSetup;
