import { transcribe as whisperTranscribe } from './whisperService';

export type VoiceTranscriptionCallback = (text: string, isFinal: boolean) => void;

export type VoiceMode = 'auto' | 'web' | 'whisper';

const PREF_KEY = 'phillos_voice_mode';

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mode: 'web' | 'whisper';

  constructor(preference: VoiceMode = 'auto') {
    const stored = (typeof localStorage !== 'undefined'
      ? (localStorage.getItem(PREF_KEY) as VoiceMode | null)
      : null) || null;
    if (stored) preference = stored;

    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const webAvailable = !!SpeechRecognitionImpl;

    if (preference === 'whisper') {
      this.mode = 'whisper';
    } else if (preference === 'web') {
      this.mode = webAvailable ? 'web' : 'whisper';
    } else {
      this.mode = webAvailable ? 'web' : 'whisper';
    }

    if (this.mode === 'web' && webAvailable) {
      this.recognition = new SpeechRecognitionImpl();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = true;
    }
  }

  start(onResult: VoiceTranscriptionCallback) {
    if (this.mode === 'web') {
      if (!this.recognition) return;
      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            onResult(transcript.trim(), true);
            transcript = '';
          } else {
            onResult(transcript.trim(), false);
          }
        }
      };
      this.recognition.start();
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        this.recorder = new MediaRecorder(stream);
        this.chunks = [];
        this.recorder.ondataavailable = async e => {
          this.chunks.push(e.data);
          if (this.recorder && this.recorder.state === 'recording') {
            const text = await whisperTranscribe(e.data);
            if (text) onResult(text.trim(), false);
          }
        };
        this.recorder.onstop = async () => {
          const blob = new Blob(this.chunks, { type: 'audio/webm' });
          const text = await whisperTranscribe(blob);
          if (text) onResult(text.trim(), true);
          this.chunks = [];
        };
        this.recorder.start(2000);
      }).catch(() => {});
    }
  }

  stop() {
    if (this.mode === 'web') {
      this.recognition?.stop();
    } else {
      this.recorder?.stop();
    }
  }
}

export const speakText = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
};
