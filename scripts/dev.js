#!/usr/bin/env node

const { REPOS, BUILD_ORDER, c, runParallel, formatSummary, runNpmScript } = require('./utils');

const SERVER_REPOS = [
  'ai-ticket-core-server',
  'ai-ticket-main-server',
  'ai-ticket-llm-server',
  'ai-ticket-processor-server',
  'ai-ticket-scheduler-server',
];

async function main() {
  console.log(`\n  ${c.cyan('dev')} — starting all servers\n`);

  console.log(`  ${c.dim('step 1: building shared dependencies...')}\n`);
  for (const phase of BUILD_ORDER) {
    const label = phase.repos.join(', ');
    console.log(`  ${c.dim('→ phase ' + phase.phase)} ${label}`);
    const results = await runParallel(phase.repos, 'build');
    const summary = formatSummary(results);
    console.log(`  ${c.dim('phase ' + phase.phase + ':')} ${summary}`);
    if (results.some((r) => !r)) {
      console.log(`\n  ${c.red('build failed — aborting')}\n`);
      process.exit(1);
    }
  }

  console.log(`\n  ${c.dim('step 2: starting servers...')}\n`);

  const procs = [];
  for (const repo of SERVER_REPOS) {
    const dir = require('./utils').resolveRepoDir(repo);
    const label = `${repo} dev`;
    process.stdout.write(`  ${c.dim('→')} ${label}...`);

    const { spawn } = require('child_process');
    const proc = spawn('npm', ['run', 'dev'], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], shell: true });
    let started = false;
    proc.stdout.on('data', (d) => {
      const text = d.toString();
      process.stdout.write(text);
      if (!started && (text.includes('ready') || text.includes('listening') || text.includes('started') || text.includes('Running') || text.includes('Server'))) {
        started = true;
        process.stdout.write(` ${c.green('✓')}\n`);
      }
    });
    proc.stderr.on('data', (d) => {
      process.stderr.write(d.toString());
    });
    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        process.stdout.write(` ${c.red('✗ exited ' + code)}\n`);
      }
    });
    procs.push(proc);
  }

  const shutdown = () => {
    console.log(`\n  ${c.dim('shutting down servers...')}`);
    for (const proc of procs) proc.kill('SIGTERM');
    setTimeout(() => process.exit(0), 500);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error(c.red('Fatal:'), err.message);
  process.exit(1);
});
