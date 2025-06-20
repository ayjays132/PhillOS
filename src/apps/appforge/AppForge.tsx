import React, { useState } from 'react';
import { appForgeService } from '../../services/appForgeService';
import { GlassCard } from '../../components/GlassCard';

export const AppForge: React.FC = () => {
  const [repo, setRepo] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [usage, setUsage] = useState<Record<string, number>>({});

  const load = async () => {
    setMessage('Loading...');
    try {
      const t = await appForgeService.listTags(repo);
      setTags(t);
      setMessage('');
      const u = await appForgeService.usage();
      setUsage(u);
    } catch (err: any) {
      setMessage(err.message || 'Failed to load');
    }
  };

  const install = async (tag: string) => {
    setMessage('Installing...');
    try {
      await appForgeService.install(`${repo}:${tag}`);
      const u = await appForgeService.usage();
      setUsage(u);
      setMessage('Installed');
    } catch (err: any) {
      setMessage(err.message || 'Install failed');
    }
  };

  const uninstall = async (tag: string) => {
    setMessage('Uninstalling...');
    try {
      await appForgeService.uninstall(`${repo}:${tag}`);
      const u = await appForgeService.usage();
      setUsage(u);
      setMessage('Uninstalled');
    } catch (err: any) {
      setMessage(err.message || 'Uninstall failed');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-2">AppForge</h1>
      <div className="space-y-2 max-w-md">
        <input
          className="w-full p-2 rounded text-black"
          value={repo}
          onChange={e => setRepo(e.target.value)}
          placeholder="registry/repo"
        />
        <button
          onClick={load}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Load
        </button>
      </div>
      {message && <p className="text-sm">{message}</p>}
      {tags.length > 0 && (
        <GlassCard className="p-2 space-y-2 max-w-md">
          {tags.map(tag => (
            <div key={tag} className="flex items-center justify-between">
              <span>{tag}</span>
              <div className="space-x-2">
                <button
                  className="px-2 py-1 bg-green-600 text-white rounded"
                  onClick={() => install(tag)}
                >
                  Install
                </button>
                <button
                  className="px-2 py-1 bg-red-600 text-white rounded"
                  onClick={() => uninstall(tag)}
                >
                  Uninstall
                </button>
                {usage[`${repo}:${tag}`] && (
                  <span className="text-xs ml-2">used {usage[`${repo}:${tag}`]}</span>
                )}
              </div>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
};

export default AppForge;
