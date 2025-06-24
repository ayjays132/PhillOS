import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const ProtonLauncher: React.FC = () => {
  const [exePath, setExePath] = useState('');
  const [protonVersion, setProtonVersion] = useState('');
  const [prefix, setPrefix] = useState('');
  const [useWine, setUseWine] = useState(false);
  const [message, setMessage] = useState('');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const launch = async () => {
    setMessage('Launching...');
    try {
      const res = await fetch('/api/launch-proton', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: exePath, version: protonVersion, prefix, wine: useWine ? 'wine' : undefined })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to launch');
      setMessage('Proton launched successfully');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Failed to launch game');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Proton Launcher</h1>
      <div className="space-y-2 max-w-md">
        <label className="block">
          <span className="text-sm">Executable Path</span>
          <input
            className="w-full mt-1 p-2 rounded text-black"
            value={exePath}
            onChange={e => setExePath(e.target.value)}
            placeholder="/path/to/game.exe"
          />
        </label>
        <label className="block">
          <span className="text-sm">Proton Version</span>
          <input
            className="w-full mt-1 p-2 rounded text-black"
            value={protonVersion}
            onChange={e => setProtonVersion(e.target.value)}
            placeholder="e.g. Proton-9.0"
          />
        </label>
        <label className="block">
          <span className="text-sm">Prefix Path</span>
          <input
            className="w-full mt-1 p-2 rounded text-black"
            value={prefix}
            onChange={e => setPrefix(e.target.value)}
            placeholder="~/.local/share/proton-prefixes/game"
          />
        </label>
        <label className="inline-flex items-center space-x-2">
          <input
            type="checkbox"
            checked={useWine}
            onChange={e => setUseWine(e.target.checked)}
          />
          <span className="text-sm">Use Wine if Proton missing</span>
        </label>
        <button
          onClick={launch}
          className={`${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'} px-4 py-2 rounded`}
        >
          Launch
        </button>
      </div>
      {message && <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-800/80'}`}>{message}</p>}
    </div>
  );
};
