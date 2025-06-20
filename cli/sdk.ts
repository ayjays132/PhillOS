import { Command } from 'commander';
import { agentService } from '../services/agentService.ts';
import { createProtonLauncher } from '../backend/protonLauncher.ts';
import * as android from '../android/controller.ts';
import { sanitizeArgs } from './utils/validate.ts';

export interface CLIOptions {
  defaultModel?: 'local' | 'cloud';
  provider?: 'gemini' | 'openai';
  apiKey?: string;
  phoneBridgeUrl?: string;
}

export class PhillosCLI {
  constructor(private options: CLIOptions = {}) {}

  async run(argv: string[] = process.argv) {
    const program = new Command();
    program.exitOverride();
    program
      .name('phillos-cli')
      .description('PhillOS command line interface');

    program.option('--cloud', 'use cloud AI models');
    program.option('--local', 'force local AI');
    program.option('--provider <provider>', 'cloud AI provider', 'gemini');
    program.option('--api-key <key>', 'cloud provider API key');
    program.option('--phone-url <url>', 'phone bridge base url',
      this.options.phoneBridgeUrl || process.env.PHONE_BRIDGE_URL || 'http://localhost:3002');

    program
      .command('agent <text>')
      .description('Send a command to the PhillOS agent')
      .action(async (text, cmd) => {
        sanitizeArgs([text]);
        const opts = program.opts();
        const pref = opts.cloud ? 'cloud' : (opts.local ? 'local' : (this.options.defaultModel || 'local'));
        await agentService.init(pref);
        const result = await agentService.processCommand(text, pref);
        console.log(JSON.stringify(result, null, 2));
      });

    program
      .command('proton <exe> [args...]')
      .description('Launch a Windows executable through Proton')
      .option('--version <ver>', 'Proton version')
      .option('--prefix <path>', 'WINE prefix path')
      .option('--proton-dir <dir>', 'directory containing Proton builds')
      .option('--wine <path>', 'fallback Wine binary')
      .action(async (exe: string, args: string[] = [], cmdObj) => {
        sanitizeArgs([exe, ...(args || [])]);
        const launcher = createProtonLauncher({
          protonDir: cmdObj.protonDir,
          version: cmdObj.version,
          prefix: cmdObj.prefix,
          wineBinary: cmdObj.wine,
        });
        await launcher.launch(exe, args);
      });

    program
      .command('android <action>')
      .description('Start or stop the Waydroid container')
      .action(async (action: string) => {
        if (action === 'start') {
          await android.startContainer();
          await android.forwardDisplay();
          await android.forwardInput();
        } else if (action === 'stop') {
          await android.stopContainer();
        } else {
          throw new Error('Unknown action: ' + action);
        }
      });

    const phone = program.command('phone').description('Interact with the phone bridge');

    phone
      .command('connect <address>')
      .description('Connect to a paired device')
      .action(async (address: string) => {
        const url = new URL('/connect', program.opts().phoneUrl);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address }),
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      });

    phone
      .command('disconnect')
      .description('Disconnect the current device')
      .action(async () => {
        const url = new URL('/disconnect', program.opts().phoneUrl);
        const res = await fetch(url, { method: 'POST' });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      });

    phone
      .command('sms <to> <body>')
      .description('Send an SMS via the bridge')
      .action(async (to: string, body: string) => {
        sanitizeArgs([to, body]);
        const url = new URL('/sms', program.opts().phoneUrl);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, body }),
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      });

    phone
      .command('call <number>')
      .description('Make a call via the bridge')
      .action(async (number: string) => {
        sanitizeArgs([number]);
        const url = new URL('/call', program.opts().phoneUrl);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ number }),
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      });

    phone
      .command('status')
      .description('Show phone connection status')
      .action(async () => {
        const url = new URL('/status', program.opts().phoneUrl);
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      });

    await program.parseAsync(argv);
  }
}

