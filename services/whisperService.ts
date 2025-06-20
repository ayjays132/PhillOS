import { pipeline } from '@xenova/transformers';

let transcriberPromise: Promise<any> | null = null;

async function getTranscriber() {
  if (!transcriberPromise) {
    transcriberPromise = pipeline('automatic-speech-recognition', 'Xenova/whisper-small');
  }
  return transcriberPromise;
}

export async function transcribe(audio: Blob): Promise<string> {
  const transcriber = await getTranscriber();
  const result = await transcriber(audio);
  return typeof result === 'string' ? result : result.text || '';
}
