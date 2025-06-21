import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { AIConfig, getAIConfig, loadAIConfig, saveAIConfig } from '../../config/aiConfig';

export const Settings: React.FC = () => {
  const [config, setConfig] = useState<AIConfig>(getAIConfig());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAIConfig().then(setConfig);
  }, []);

  const updateField = (k: keyof AIConfig, v: string) => {
    setConfig(prev => ({ ...prev, [k]: v }));
  };

  const save = async () => {
    setSaving(true);
    await saveAIConfig(config);
    setSaving(false);
  };

  return (
    <AppPanel className="space-y-4">
      <h1 className="text-xl font-bold">AI Settings</h1>
      <label className="block">
        <span className="text-sm">Local Model</span>
        <input
          className="w-full p-2 bg-white/10 rounded"
          value={config.localModel}
          onChange={e => updateField('localModel', e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm">Cloud Provider</span>
        <select
          className="w-full p-2 bg-white/10 rounded"
          value={config.cloudProvider}
          onChange={e => updateField('cloudProvider', e.target.value as any)}
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm">Summarizer Model</span>
        <input
          className="w-full p-2 bg-white/10 rounded"
          value={config.summarizerModel}
          onChange={e => updateField('summarizerModel', e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm">Classifier Model</span>
        <input
          className="w-full p-2 bg-white/10 rounded"
          value={config.classifierModel}
          onChange={e => updateField('classifierModel', e.target.value)}
        />
      </label>
      <button
        onClick={save}
        disabled={saving}
        className="px-4 py-2 rounded bg-purple-600 text-white"
      >
        {saving ? 'Saving...' : 'Save'}
      </button>
    </AppPanel>
  );
};

export default Settings;
