import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { GlassCard } from '../../components/GlassCard';

interface MediaItem {
  path: string;
  name: string;
}

export const MediaLibrary: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    invoke<MediaItem[]>('list_media').then(setItems).catch(() => setItems([]));
  }, []);

  return (
    <GlassCard className="overflow-auto h-full space-y-2">
      {items.map(item => (
        <div key={item.path} className="p-2 border-b border-white/10">
          {item.name}
        </div>
      ))}
      {items.length === 0 && <div>No media found.</div>}
    </GlassCard>
  );
};

export default MediaLibrary;
