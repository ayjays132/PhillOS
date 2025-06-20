import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { readTextFile } from '@tauri-apps/api/fs';
import { fileTagService } from '../../services/fileTagService';
import { predictSyncService } from '../../services/predictSyncService';
import { AppPanel } from '../../components/layout/AppPanel';

interface FsEntry {
  name: string;
  path: string;
  isDir: boolean;
}

interface FileNode extends FsEntry {
  children?: FileNode[];
}

async function fetchDir(path: string): Promise<FileNode[]> {
  const entries: FsEntry[] = await invoke('list_dir', { path });
  return entries.sort((a, b) => Number(b.isDir) - Number(a.isDir)).map(e => ({ ...e }));
}

const FileTree: React.FC<{
  nodes: FileNode[];
  onSelect: (node: FileNode) => void;
}> = ({ nodes, onSelect }) => (
  <ul className="pl-4">
    {nodes.map(node => (
      <li key={node.path}>
        <button
          className="text-left w-full hover:underline"
          onClick={() => onSelect(node)}
        >
          {node.isDir ? '📁' : '📄'} {node.name}
        </button>
        {node.children && <FileTree nodes={node.children} onSelect={onSelect} />}
      </li>
    ))}
  </ul>
);

export const Vault: React.FC = () => {
  const [root, setRoot] = useState<FileNode | null>(null);
  const [selected, setSelected] = useState<FileNode | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    fetchDir('.').then(children => setRoot({ name: '.', path: '.', isDir: true, children }));
    const preload = async () => {
      await predictSyncService.prefetchRecent();
    };
    preload();
    const id = setInterval(preload, 60000);
    return () => clearInterval(id);
  }, []);

  const handleSelect = async (node: FileNode) => {
    setSelected(node);
    setTags([]);
    if (node.isDir) {
      if (!node.children) {
        const children = await fetchDir(node.path);
        node.children = children;
        setRoot(r => (r ? { ...r } : r));
      }
    } else {
      await predictSyncService.recordAccess(node.path);
      try {
        const text = await readTextFile(node.path);
        setPreview(text.slice(0, 200));
      } catch {
        setPreview('Unable to preview file');
      }
    }
  };

  const handleCopy = async () => {
    if (selected) {
      const dest = prompt('Copy to path:');
      if (dest) await invoke('copy_file', { src: selected.path, dest });
    }
  };
  const handleMove = async () => {
    if (selected) {
      const dest = prompt('Move to path:');
      if (dest) await invoke('move_file', { src: selected.path, dest });
    }
  };

  const handleSmartTags = async () => {
    if (selected && !selected.isDir) {
      const t = await fileTagService.tagFile(selected.path);
      setTags(t);
    }
  };

  if (!root) return <div>Loading...</div>;

  return (
    <AppPanel className="!p-0">
      <div className="grid grid-cols-2 gap-4 h-full">
      <GlassCard className="overflow-auto">
        <FileTree nodes={root.children || []} onSelect={handleSelect} />
      </GlassCard>
      <GlassCard className="flex flex-col">
        {selected && (
          <div className="mb-2 font-bold border-b border-white/10 pb-2">
            {selected.name}
          </div>
        )}
        {selected && !selected.isDir && (
          <pre className="flex-grow overflow-auto text-sm whitespace-pre-wrap">
            {preview}
          </pre>
        )}
        {selected && (
          <div className="mt-2 space-x-2">
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded"
              onClick={handleCopy}
            >
              Copy
            </button>
            <button
              className="px-3 py-1 bg-green-500 text-white rounded"
              onClick={handleMove}
            >
              Move
            </button>
            {!selected.isDir && (
              <button
                className="px-3 py-1 bg-purple-500 text-white rounded"
                onClick={handleSmartTags}
              >
                SmartTags
              </button>
            )}
          </div>
        )}
        {tags.length > 0 && (
          <div className="mt-2 text-xs">Tags: {tags.join(', ')}</div>
        )}
      </GlassCard>
      </div>
    </AppPanel>
  );
};

export default Vault;
