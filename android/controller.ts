import { spawn } from 'child_process';

/**
 * Run a command and stream stdio. Resolves when the process exits
 * successfully, rejects otherwise.
 */
function run(cmd: string, args: string[] = []): Promise<void> {
  const unsafe = /[;&|`$><]/;
  if (unsafe.test(cmd) || args.some(a => unsafe.test(a))) {
    return Promise.reject(new Error('Unsafe command or arguments'));
  }

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
}

/**
 * Stop the Waydroid container.
 */
export async function stopContainer(): Promise<void> {
  console.log('Stopping Android container...');
  await run('waydroid', ['container', 'stop']);
}

/**
 * Start the display and input bridge using Waydroid's session service.
 */
export async function forwardDisplay(): Promise<void> {
  console.log('Starting display forwarding...');
  await run('waydroid', ['session', 'start']);
}

/**
 * Input events are automatically forwarded by the Waydroid session.
 * This helper exists for API completeness.
 */
export async function forwardInput(): Promise<void> {
  console.log('Input forwarding active (handled by Waydroid session)');
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
