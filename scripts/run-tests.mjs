import { spawn } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const testRoot = new URL('../test/', import.meta.url);

async function collectTests(directoryUrl, accumulator) {
  let entries;
  try {
    entries = await readdir(directoryUrl, { withFileTypes: true });
  } catch (error) {
    if ((error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')) {
      return accumulator;
    }
    throw error;
  }

  for (const entry of entries) {
    const childUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
    if (entry.isDirectory()) {
      await collectTests(childUrl, accumulator);
    } else if (/\.test\.(ts|js)$/.test(entry.name)) {
      accumulator.push(childUrl);
    }
  }
  return accumulator;
}

const testFiles = await collectTests(testRoot, []);

if (testFiles.length === 0) {
  console.error('No test files found under ./test');
  process.exit(1);
}

const resolvedFiles = testFiles.map((fileUrl) => fileURLToPath(fileUrl));

const child = spawn(
  process.execPath,
  ['--import', 'tsx', '--test', ...resolvedFiles],
  {
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
