import React, { useEffect } from 'react';
import { storageService } from '../../services/storageService';

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    storageService.init();
  }, []);

  return <>{children}</>;
};
