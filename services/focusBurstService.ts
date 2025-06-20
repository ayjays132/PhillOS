import { agentOrchestrator } from './agentOrchestrator';

export type FocusPhase = 'work' | 'break' | 'idle';

class FocusBurstService {
  private interval: number | null = null;
  private phase: FocusPhase = 'idle';
  private secondsLeft = 0;
  private workSeconds = 25 * 60;
  private breakSeconds = 5 * 60;
  private listeners = new Set<(p: FocusPhase, s: number) => void>();

  private emit() {
    this.listeners.forEach(h => h(this.phase, this.secondsLeft));
  }

  private tick = () => {
    this.secondsLeft -= 1;
    if (this.secondsLeft <= 0) {
      if (this.phase === 'work') {
        this.phase = 'break';
        this.secondsLeft = this.breakSeconds;
      } else {
        this.phase = 'work';
        this.secondsLeft = this.workSeconds;
      }
    }
    this.emit();
  };

  start(workMinutes = 25, breakMinutes = 5) {
    this.stop();
    this.workSeconds = Math.round(workMinutes * 60);
    this.breakSeconds = Math.round(breakMinutes * 60);
    this.phase = 'work';
    this.secondsLeft = this.workSeconds;
    this.emit();
    this.interval = window.setInterval(this.tick, 1000);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.phase = 'idle';
    this.secondsLeft = 0;
    this.emit();
  }

  subscribe(handler: (p: FocusPhase, s: number) => void) {
    this.listeners.add(handler);
    handler(this.phase, this.secondsLeft);
    return () => this.listeners.delete(handler);
  }

  getState() {
    return { phase: this.phase, secondsLeft: this.secondsLeft };
  }
}

export const focusBurstService = new FocusBurstService();

agentOrchestrator.registerAction('timeai.focus_burst', params => {
  const cmd = String(params?.command || 'start');
  const work = Number(params?.work ?? 25);
  const brk = Number(params?.break ?? 5);
  if (cmd === 'start') {
    focusBurstService.start(work, brk);
  } else {
    focusBurstService.stop();
  }
  return focusBurstService.getState();
});

