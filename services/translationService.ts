import { agentOrchestrator } from './agentOrchestrator';
import { pipeline } from '@xenova/transformers';

async function loadWasmTranslator() {
  try {
    const mod = await import('@/wasm/translator');
    return await mod.loadTranslator();
  } catch {
    return null;
  }
}

let translator: any = null;

export const translate = async (text: string, to: string): Promise<string> => {
  if (!translator) {
    translator = await loadWasmTranslator();
    if (!translator) {
      translator = await pipeline('translation', 'Xenova/mbart-large-50-many-to-one-mmt');
    }
  }
  const result = await translator(text, { tgt_lang: to });
  return Array.isArray(result) ? result[0].translation_text : result.translation_text;
};

agentOrchestrator.registerAction('converse.translate', params =>
  translate(String(params?.text || ''), String(params?.to || 'en'))
);

export const translationService = { translate };
