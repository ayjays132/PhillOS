import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { visionVaultService } from '../../services/visionVaultService';

export const VisionVault: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    visionVaultService.getImages().then(setImages);
  }, []);

  return (
    <AppPanel>
        <h1 className="text-3xl font-bold mb-4">VisionVault</h1>
        <div className="grid grid-cols-2 gap-2 overflow-auto">
          {images.map((src, i) => (
            <img key={i} src={src} alt={`img-${i}`} className="rounded" />
          ))}
        </div>
    </AppPanel>
  );
};

export default VisionVault;
