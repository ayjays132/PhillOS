import React from 'react';
import { MediaLibrary } from './MediaLibrary';
import { PlaylistManager } from './PlaylistManager';

export const MediaSphere: React.FC = () => (
  <div className="grid grid-cols-2 gap-4 h-full">
    <MediaLibrary />
    <PlaylistManager />
  </div>
);

export default MediaSphere;
