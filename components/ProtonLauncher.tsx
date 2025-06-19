import React, { useState } from 'react';

export const ProtonLauncher: React.FC = () => {
  const [exePath, setExePath] = useState('');
  const [protonVersion, setProtonVersion] = useState('');
  const [prefix, setPrefix] = useState('');
  const [message, setMessage] = useState('');

  const launch = async () => {
    setMessage('Launching...');
    try {
      // In a full implementation this would call a backend API which runs
      // the executable using the Proton service. For now we simply log the
      // selected options.
      console.log('Launch', { exePath, protonVersion, prefix });
      setMessage('Launch command sent');
    } catch (err: any) {
      console.error(err);
      setMessage('Failed to launch game');
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
        <button
          onClick={launch}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Launch
        </button>
      </div>
      {message && <p className="text-sm text-white/80">{message}</p>}
    </div>
  );
};
