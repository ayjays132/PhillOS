import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { readTextFile } from '@tauri-apps/api/fs';
import { fileTagService } from '../../../services/fileTagService';
import { predictSyncService } from '../../../services/predictSyncService';
import { AppPanel } from '../../components/layout/AppPanel';
import { GlassCard } from '../../components/GlassCard';
import { autoCleanService } from '../../../services/autoCleanService';

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
  const [tagInput, setTagInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

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
    setTagInput('');
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
      const existing = await fileTagService.getTags(node.path);
      setTags(existing);
      setTagInput(existing.join(', '));
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
      setTagInput(t.join(', '));
    }
  };

  const saveTags = async () => {
    if (selected && !selected.isDir) {
      const parts = tagInput.split(',').map(t => t.trim()).filter(Boolean);
      await fileTagService.setTags(selected.path, parts);
      setTags(parts);
    }
  };

  const handleAutoClean = async () => {
    const files = await autoCleanService.getSuggestions();
    setSuggestions(files);
  };

  const archiveFile = async (p: string) => {
    await autoCleanService.archive(p);
    setSuggestions(s => s.filter(f => f !== p));
  };

  const deleteFile = async (p: string) => {
    await autoCleanService.delete(p);
    setSuggestions(s => s.filter(f => f !== p));
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
        <div className="mt-2 space-x-2">
          <button
            className="px-3 py-1 bg-orange-500 text-white rounded"
            onClick={handleAutoClean}
          >
            AutoClean
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="mt-4 text-xs space-y-1">
            <div className="font-bold">Stale files:</div>
            <ul>
              {suggestions.map(p => (
                <li key={p} className="flex justify-between items-center gap-2">
                  <span className="truncate">{p}</span>
                  <span className="space-x-1">
                    <button
                      className="px-2 py-0.5 bg-yellow-600 text-white rounded text-xs"
                      onClick={() => archiveFile(p)}
                    >
                      Archive
                    </button>
                    <button
                      className="px-2 py-0.5 bg-red-600 text-white rounded text-xs"
                      onClick={() => deleteFile(p)}
                    >
                      Delete
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {selected && !selected.isDir && (
          <div className="mt-2 text-xs space-y-1">
            <div>
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                placeholder="tag1, tag2"
                className="px-1 py-0.5 rounded text-black text-xs"
              />
              <button
                onClick={saveTags}
                className="ml-1 px-2 py-0.5 bg-blue-600 text-white rounded text-xs"
              >
                Save
              </button>
            </div>
            {tags.length > 0 && <div>Tags: {tags.join(', ')}</div>}
          </div>
        )}
      </GlassCard>
      </div>
    </AppPanel>
  );
};

export default Vault;
