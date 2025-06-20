import { Command } from 'commander';
import { agentOrchestrator } from '../services/agentOrchestrator.ts';
import { createProtonLauncher, downloadProton } from '../backend/protonLauncher.ts';
import * as android from '../android/controller.ts';
import fs from 'fs';
import path from 'path';
import { sanitizeArgs } from './utils/validate.ts';

export interface CLIOptions {
  defaultModel?: 'local' | 'cloud';
  provider?: 'gemini' | 'openai';
  apiKey?: string;
  phoneBridgeUrl?: string;
}

const SETTINGS_FILE = path.resolve(__dirname, '../backend/protonSettings.json');

function loadSettings(): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveSettings(data: Record<string, any>): void {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
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
        const task = await agentOrchestrator.processIntent(text, pref);
        console.log(JSON.stringify(task?.action || null, null, 2));
      });

    const proton = program.command('proton').description('Manage Proton versions and launch games');

    proton
      .command('launch <exe> [args...]')
      .description('Launch a Windows executable through Proton')
      .option('--version <ver>', 'Proton version')
      .option('--prefix <path>', 'WINE prefix path')
      .option('--proton-dir <dir>', 'directory containing Proton builds')
      .option('--wine <path>', 'fallback Wine binary')
      .action(async (exe: string, args: string[] = [], cmdObj) => {
        sanitizeArgs([exe, ...(args || [])]);
        const settings = loadSettings();
        const key = path.resolve(exe);
        const stored = settings[key] || {};
        const version = cmdObj.version || stored.version;
        const prefix = cmdObj.prefix || stored.prefix;
        const launcher = createProtonLauncher({
          protonDir: cmdObj.protonDir,
          version,
          prefix,
          wineBinary: cmdObj.wine || stored.wineBinary,
        });
        await launcher.launch(exe, args);
        settings[key] = { version, prefix, wineBinary: cmdObj.wine || stored.wineBinary };
        saveSettings(settings);
      });

    proton
      .command('config <exe>')
      .description('Show or set saved Proton options for a game')
      .option('--version <ver>', 'Proton version')
      .option('--prefix <path>', 'WINE prefix path')
      .option('--wine <path>', 'fallback Wine binary')
      .action((exe: string, cmdObj) => {
        sanitizeArgs([exe]);
        const key = path.resolve(exe);
        const settings = loadSettings();
        const cfg = settings[key] || {};
        if (cmdObj.version || cmdObj.prefix || cmdObj.wine) {
          if (cmdObj.version) cfg.version = cmdObj.version;
          if (cmdObj.prefix) cfg.prefix = cmdObj.prefix;
          if (cmdObj.wine) cfg.wineBinary = cmdObj.wine;
          settings[key] = cfg;
          saveSettings(settings);
          console.log('Settings updated');
        } else {
          console.log(JSON.stringify(cfg, null, 2));
        }
      });

    proton
      .command('list')
      .description('List available Proton versions')
      .option('--proton-dir <dir>', 'directory containing Proton builds')
      .action(cmdObj => {
        const dir = cmdObj.protonDir || path.resolve(__dirname, '../dist/proton');
        if (!fs.existsSync(dir)) return console.log('No Proton directory');
        const entries = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
        console.log(entries.join('\n'));
      });

    proton
      .command('download <version>')
      .description('Download a Proton version')
      .option('--proton-dir <dir>', 'directory containing Proton builds')
      .action(async (version: string, cmdObj) => {
        const dir = cmdObj.protonDir || path.resolve(__dirname, '../dist/proton');
        await downloadProton(dir, version);
        console.log('Downloaded', version);
      });

    const androidNs = program.command('android').description('Control Android container and adb');

    androidNs
      .command('start')
      .description('Start the Waydroid container')
      .action(async () => {
        await android.startContainer();
        await android.forwardDisplay();
        await android.forwardInput();
      });

    androidNs
      .command('stop')
      .description('Stop the Waydroid container')
      .action(async () => {
        await android.stopContainer();
      });

    androidNs
      .command('deploy <apk>')
      .description('Install an APK via adb')
      .action(async (apk: string) => {
        sanitizeArgs([apk]);
        await android.deployApk(apk);
      });

    androidNs
      .command('sync <src> <dest>')
      .description('Sync files with the device')
      .option('--pull', 'pull from device')
      .action(async (src: string, dest: string, cmdObj) => {
        sanitizeArgs([src, dest]);
        await android.syncFile(src, dest, !!cmdObj.pull);
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

