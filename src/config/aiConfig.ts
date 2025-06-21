import { CloudProvider } from '../services/cloudAIService';

export interface AIConfig {
  localModel: string;
  cloudProvider: CloudProvider;
  summarizerModel: string;
  classifierModel: string;
}

export const defaultAIConfig: AIConfig = {
  localModel: 'qwen3:1.7b',
  cloudProvider: 'gemini',
  summarizerModel: 'Xenova/distilbart-cnn-6-6',
  classifierModel: 'Xenova/mobilebert-uncased-mnli',
};

let currentConfig: AIConfig = { ...defaultAIConfig };

export const getAIConfig = () => currentConfig;

export async function loadAIConfig() {
  try {
    const res = await fetch('/api/aiconfig');
    if (res.ok) {
      const data = await res.json();
      if (data && data.config) {
        currentConfig = { ...currentConfig, ...data.config };
      }
    }
  } catch {}
  return currentConfig;
}

export async function saveAIConfig(config: AIConfig) {
  currentConfig = { ...config };
  try {
    await fetch('/api/aiconfig', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config }),
    });
  } catch {}
}
