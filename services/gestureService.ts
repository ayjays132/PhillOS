import { agentOrchestrator } from './agentOrchestrator';
import { workspaceSnapService } from './workspaceSnapService';
import { VoiceService } from './voiceService';

export type WorkspaceSwitchListener = (workspace: string) => void;

class GestureService {
  private listeners = new Set<WorkspaceSwitchListener>();
  private touchStartX = 0;
  private voice: VoiceService | null = null;
  private workspaces: string[] = [];
  private current = 0;

  init(workspaces: string[]) {
    this.workspaces = workspaces;
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKey);
      window.addEventListener('touchstart', this.onTouchStart);
      window.addEventListener('touchend', this.onTouchEnd);
    }
    this.voice = new VoiceService('auto');
    this.voice.start((text, final) => {
      if (!final) return;
      if (/next workspace/i.test(text)) this.next();
      if (/previous workspace/i.test(text)) this.prev();
    });
  }

  onSwitch(cb: WorkspaceSwitchListener) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(id: string) {
    this.listeners.forEach(l => l(id));
  }

  private onKey = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.altKey && e.key === 'ArrowRight') this.next();
    if (e.ctrlKey && e.altKey && e.key === 'ArrowLeft') this.prev();
  };

  private onTouchStart = (e: TouchEvent) => {
    this.touchStartX = e.touches[0].clientX;
  };

  private onTouchEnd = (e: TouchEvent) => {
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    if (dx > 50) this.prev();
    if (dx < -50) this.next();
  };

  next() {
    if (this.workspaces.length === 0) return;
    this.current = (this.current + 1) % this.workspaces.length;
    this.emit(this.workspaces[this.current]);
  }

  prev() {
    if (this.workspaces.length === 0) return;
    this.current = (this.current - 1 + this.workspaces.length) % this.workspaces.length;
    this.emit(this.workspaces[this.current]);
  }
}

export const gestureService = new GestureService();

agentOrchestrator.registerAction('workspace.next', () => gestureService.next());
agentOrchestrator.registerAction('workspace.prev', () => gestureService.prev());
agentOrchestrator.registerAction('workspace.list', () => workspaceSnapService.list());
