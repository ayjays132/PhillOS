import { storageService } from './storageService';
import { memoryService } from './memoryService';
import { PhoneSettings } from '../src/types';
import { agentOrchestrator } from './agentOrchestrator';

interface CommandPattern {
  regex: RegExp;
  handler: (match: RegExpMatchArray) => Promise<string> | string;
}

class SettingsCommandService {
  private patterns: CommandPattern[];

  constructor() {
    this.patterns = [
      {
        regex: /^(?:toggle\s+)?dark (?:mode|theme)|enable dark mode|switch to dark mode/i,
        handler: () => this.setTheme('dark'),
      },
      {
        regex: /^(?:toggle\s+)?light (?:mode|theme)|enable light mode|switch to light mode/i,
        handler: () => this.setTheme('light'),
      },
      {
        regex: /toggle (?:theme|dark mode)/i,
        handler: () => this.toggleTheme(),
      },
      {
        regex: /vibrat(?:e|ion) (on|off)/i,
        handler: m => this.setPhone({ vibrate: m[1] === 'on' }),
      },
      {
        regex: /auto[- ]?connect (on|off)/i,
        handler: m => this.setPhone({ autoConnect: m[1] === 'on' }),
      },
    ];
  }

  async execute(text: string): Promise<boolean> {
    const trimmed = text.trim();
    if (!trimmed) return false;
    for (const { regex, handler } of this.patterns) {
      const match = trimmed.match(regex);
      if (match) {
        const result = await handler(match);
        memoryService.addMessage({
          id: Date.now().toString(),
          role: 'model',
          text: result,
          timestamp: new Date(),
        });
        return true;
      }
    }
    return false;
  }

  private async setTheme(theme: 'light' | 'dark'): Promise<string> {
    await storageService.setTheme(theme);
    return `Theme set to ${theme}.`;
  }

  private async toggleTheme(): Promise<string> {
    const current = await storageService.getTheme();
    const next: 'light' | 'dark' = current === 'dark' ? 'light' : 'dark';
    await storageService.setTheme(next);
    return `Theme set to ${next}.`;
  }

  private setPhone(partial: Partial<PhoneSettings>): string {
    const current =
      storageService.getPhoneSettings() || {
        bluetoothAddress: '',
        modemDevice: '',
        autoConnect: false,
        ringtone: '',
        vibrate: false,
      };
    storageService.setPhoneSettings({ ...current, ...partial });
    if (partial.vibrate !== undefined) {
      return `Vibration ${partial.vibrate ? 'enabled' : 'disabled'}.`;
    }
    if (partial.autoConnect !== undefined) {
      return `Auto-connect ${partial.autoConnect ? 'enabled' : 'disabled'}.`;
    }
    return 'Phone settings updated.';
  }
}

export const settingsCommandService = new SettingsCommandService();

agentOrchestrator.registerAction('settings.execute_command', params =>
  settingsCommandService.execute(String((params as any)?.text || ''))
);
