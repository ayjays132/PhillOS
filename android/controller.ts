import { spawn } from 'child_process';
import { sanitizeArgs } from '../cli/utils/validate.ts';

/**
 * Run a command and stream stdio. Resolves when the process exits
 * successfully, rejects otherwise.
 */
function run(cmd: string, args: string[] = []): Promise<void> {
  sanitizeArgs([cmd, ...args]);

  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', code => {
      code === 0
        ? resolve()
        : reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

/**
 * Minimal controller for the experimental Android container.
 * Uses Waydroid to spawn an Android environment and forward
 * its display and input back to the host.
 */

/**
 * Start the Waydroid container.
 */
export async function startContainer(): Promise<void> {
  console.log('Starting Android container...');
  await run('waydroid', ['container', 'start']);
  await run('waydroid', ['session', 'start']);
}

/**
 * Stop the Waydroid container.
 */
export async function stopContainer(): Promise<void> {
  console.log('Stopping Android container...');
  await run('waydroid', ['session', 'stop']);
  await run('waydroid', ['container', 'stop']);
}

/**
 * Start the display and input bridge using Waydroid's session service.
 */
export async function forwardDisplay(): Promise<void> {
  console.log('Opening Waydroid UI window...');
  await run('waydroid', ['show-full-ui']);
}

/**
 * Input events are automatically forwarded by the Waydroid session.
 * This helper exists for API completeness.
 */
export async function forwardInput(): Promise<void> {
  console.log('Input forwarding active (handled by Waydroid UI)');
}

/**
 * Install an APK inside the container using adb.
 */
export async function deployApk(apkPath: string): Promise<void> {
  console.log(`Deploying ${apkPath}...`);
  await run('adb', ['install', '-r', apkPath]);
}

/**
 * Sync files with the Android container via adb.
 * When `pull` is true the remote path is read and written locally.
 */
export async function syncFile(src: string, dest: string, pull = false): Promise<void> {
  const args = pull ? ['pull', src, dest] : ['push', src, dest];
  console.log(`${pull ? 'Pulling' : 'Pushing'} ${src} ${pull ? 'to' : 'from'} ${dest}`);
  await run('adb', args);
}

if (require.main === module) {
  const command = process.argv[2];
  (async () => {
    switch (command) {
      case 'start':
        await startContainer();
        await forwardDisplay();
        await forwardInput();
        break;
      case 'stop':
        await stopContainer();
        break;
      default:
        console.log('Usage: ts-node controller.ts <start|stop>');
    }
  })().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
