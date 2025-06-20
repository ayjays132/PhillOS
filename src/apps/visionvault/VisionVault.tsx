import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { visionVaultService } from '../../services/visionVaultService';

export const VisionVault: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    visionVaultService.getImages().then(setImages);
  }, []);

  return (
    <div className="p-4 h-full">
      <GlassCard className="h-full flex flex-col">
        <h1 className="text-3xl font-bold mb-4">VisionVault</h1>
        <div className="grid grid-cols-2 gap-2 overflow-auto">
          {images.map((src, i) => (
            <img key={i} src={src} alt={`img-${i}`} className="rounded" />
          ))}
        </div>
      </GlassCard>
    </div>
  );
};

export default VisionVault;
