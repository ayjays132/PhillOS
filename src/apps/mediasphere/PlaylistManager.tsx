import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { GlassCard } from '../../components/GlassCard';

interface Playlist {
  name: string;
  items: string[];
}

export const PlaylistManager: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState('');

  const load = () => {
    invoke<Playlist[]>('get_playlists').then(setPlaylists).catch(() => setPlaylists([]));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!name) return;
    await invoke('save_playlist', { name });
    setName('');
    load();
  };

  const del = async (n: string) => {
    await invoke('delete_playlist', { name: n });
    load();
  };

  return (
    <GlassCard className="space-y-2">
      <div className="flex space-x-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="New playlist"
          className="flex-grow bg-transparent border p-1 rounded"
        />
        <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={save}>
          Save
        </button>
      </div>
      {playlists.map(pl => (
        <div key={pl.name} className="border-b border-white/10 py-1 flex justify-between items-center">
          <span>{pl.name}</span>
          <button className="text-sm text-red-500" onClick={() => del(pl.name)}>
            Delete
          </button>
        </div>
      ))}
      {playlists.length === 0 && <div>No playlists</div>}
    </GlassCard>
  );
};

export default PlaylistManager;
