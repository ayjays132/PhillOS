#!/usr/bin/env node
import { Command } from 'commander';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { createProtonLauncher } from '../backend/protonLauncher.ts';
import { agentService } from '../services/agentService.ts';
import { sanitizeArgs } from './utils/validate.ts';

export class PhillosTool {
  async run(argv: string[] = process.argv) {
    const program = new Command();
    program.exitOverride();
    program.option('--cloud', 'use cloud AI models');
    program.option('--local', 'force local AI');
    program.option('--provider <provider>', 'cloud AI provider', 'gemini');
    program.option('--api-key <key>', 'cloud provider API key');

    program
      .command('build')
      .description('Build PhillOS image')
      .action(async () => {
        if (process.getuid && process.getuid() !== 0) {
          throw new Error('Build must be run as root');
        }
        const script = new URL('../scripts/build.sh', import.meta.url).pathname;
        await new Promise<void>((resolve, reject) => {
          const child = spawn('sh', [script], { stdio: 'inherit' });
          child.on('error', reject);
          child.on('exit', code => {
            code === 0 ? resolve() : reject(new Error(`build.sh exited with code ${code}`));
          });
        });
      });

    program
      .command('launch <exe> [args...]')
      .description('Launch a Windows executable with Proton')
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
      .command('agent <action>')
      .description('Start or stop the PhillOS Agent service')
      .action(async (action: string) => {
        const opts = program.opts();
        const pref = opts.cloud ? 'cloud' : (opts.local ? 'local' : 'local');
        if (action === 'start') {
          await agentService.start(pref);
          console.log('Agent started');
        } else if (action === 'stop') {
          agentService.stop();
          console.log('Agent stopped');
        } else {
          throw new Error('Unknown action: ' + action);
        }
      });

    await program.parseAsync(argv);
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectRun) {
  new PhillosTool().run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
