#!/usr/bin/env node

const { REPOS, c, runNpmScript, formatSummary, runParallel } = require('./utils');

async function main() {
  console.log(`\n  ${c.cyan('typecheck')} — checking types across ${REPOS.length} repos\n`);

  const results = await runParallel(REPOS, 'typecheck');

  console.log(`\n  ${c.dim('summary:')} ${formatSummary(results)}\n`);

  if (results.some((r) => !r)) process.exit(1);
}

main().catch((err) => {
  console.error(c.red('Fatal:'), err.message);
  process.exit(1);
});
