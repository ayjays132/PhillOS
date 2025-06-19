export type VoiceTranscriptionCallback = (text: string, isFinal: boolean) => void;

export class VoiceService {
  private recognition: SpeechRecognition | null = null;

  constructor() {
    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionImpl) {
      this.recognition = new SpeechRecognitionImpl();
      this.recognition.lang = 'en-US';
      this.recognition.interimResults = true;
    }
  }

  start(onResult: VoiceTranscriptionCallback) {
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
  }

  stop() {
    this.recognition?.stop();
  }
}

export const speakText = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
};
