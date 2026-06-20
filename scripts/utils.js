const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');

const REPOS = [
  'ai-ticket-shared-lib',
  'ai-ticket-shared-schema',
  'ai-ticket-core-server',
  'ai-ticket-main-server',
  'ai-ticket-llm-server',
  'ai-ticket-processor-server',
  'ai-ticket-scheduler-server',
];

const BUILD_ORDER = [
  { phase: 0, repos: ['ai-ticket-shared-lib', 'ai-ticket-shared-schema'] },
  { phase: 1, repos: ['ai-ticket-core-server', 'ai-ticket-main-server', 'ai-ticket-llm-server', 'ai-ticket-processor-server', 'ai-ticket-scheduler-server'] },
];

function colors() {
  const hasColors = process.stdout.isTTY;
  if (!hasColors) return { red: (s) => s, green: (s) => s, yellow: (s) => s, cyan: (s) => s, dim: (s) => s, reset: '' };
  return {
    red: (s) => `\x1b[31m${s}\x1b[39m`,
    green: (s) => `\x1b[32m${s}\x1b[39m`,
    yellow: (s) => `\x1b[33m${s}\x1b[39m`,
    cyan: (s) => `\x1b[36m${s}\x1b[39m`,
    dim: (s) => `\x1b[2m${s}\x1b[22m`,
    reset: '\x1b[0m',
  };
}

const c = colors();

function resolveRepoDir(name) {
  const dir = path.join(ROOT, name);
  if (!fs.existsSync(dir)) throw new Error(`Repository not found: ${name} at ${dir}`);
  return dir;
}

function runNpmScript(repoName, scriptName) {
  const dir = resolveRepoDir(repoName);
  const label = `${repoName} ${scriptName}`;
  process.stdout.write(`  ${c.dim('→')} ${label}...`);
  try {
    execSync(`npm run ${scriptName}`, { cwd: dir, stdio: ['inherit', 'pipe', 'pipe'], encoding: 'utf-8', timeout: 120000 });
    process.stdout.write(` ${c.green('✓')}\n`);
    return true;
  } catch (err) {
    const msg = err.stderr || err.stdout || err.message;
    process.stdout.write(` ${c.red('✗')}\n`);
    process.stderr.write(`${c.dim(`  ${repoName} ${scriptName}`)} stderr:\n${msg}\n`);
    return false;
  }
}

async function runParallel(repos, scriptName) {
  const results = await Promise.allSettled(
    repos.map((name) => {
      return new Promise((resolve) => {
        resolve(runNpmScript(name, scriptName));
      });
    }),
  );
  return results.map((r) => r.status === 'fulfilled' ? r.value : false);
}

function runSequential(repos, scriptName) {
  const results = [];
  for (const name of repos) {
    results.push(runNpmScript(name, scriptName));
  }
  return results;
}

function formatSummary(results) {
  const ok = results.filter(Boolean).length;
  const total = results.length;
  const symbol = ok === total ? c.green('✓') : c.red('✗');
  return `${symbol} ${ok}/${total} passed`;
}

module.exports = {
  ROOT, REPOS, BUILD_ORDER, colors, c,
  runNpmScript, runParallel, runSequential, formatSummary, resolveRepoDir,
};
