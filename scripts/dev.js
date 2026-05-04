/**
 * ForageFlow — Dev Server Launcher
 *
 * Starts PocketBase and Next.js dev server together.
 * PocketBase runs in the background; Next.js runs in the foreground.
 * When the process exits (Ctrl+C), PocketBase is cleaned up automatically.
 */

const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const pbExe = isWindows ? 'pocketbase.exe' : './pocketbase';
const pbPath = path.resolve(__dirname, '..', pbExe);

// Start PocketBase
console.log('\x1b[36m[dev]\x1b[0m Starting PocketBase...');
const pb = spawn(pbPath, ['serve'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: false,
});

pb.stdout.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.log(`\x1b[35m[pocketbase]\x1b[0m ${line}`);
});

pb.stderr.on('data', (data) => {
  const line = data.toString().trim();
  if (line) console.error(`\x1b[35m[pocketbase]\x1b[0m ${line}`);
});

pb.on('error', (err) => {
  console.error(`\x1b[31m[dev]\x1b[0m Failed to start PocketBase: ${err.message}`);
  console.error(`\x1b[31m[dev]\x1b[0m Make sure pocketbase.exe exists in the project root.`);
});

pb.on('exit', (code) => {
  if (code !== null && code !== 0) {
    console.error(`\x1b[31m[dev]\x1b[0m PocketBase exited with code ${code}`);
  }
});

// Give PocketBase a moment to start, then launch Next.js
setTimeout(() => {
  console.log('\x1b[36m[dev]\x1b[0m Starting Next.js dev server...');
  const next = spawn('npx', ['next', 'dev'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    shell: true,
  });

  next.on('exit', (code) => {
    // When Next.js exits, kill PocketBase too
    pb.kill();
    process.exit(code ?? 0);
  });
}, 1500);

// Clean up PocketBase on exit
function cleanup() {
  if (!pb.killed) {
    pb.kill();
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);
