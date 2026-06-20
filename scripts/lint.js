#!/usr/bin/env node

const { REPOS, c, runParallel, formatSummary } = require('./utils');

async function main() {
  console.log(`\n  ${c.cyan('lint')} — linting ${REPOS.length} repos\n`);

  const results = await runParallel(REPOS, 'lint');

  console.log(`\n  ${c.dim('summary:')} ${formatSummary(results)}\n`);

  if (results.some((r) => !r)) process.exit(1);
}

main().catch((err) => {
  console.error(c.red('Fatal:'), err.message);
  process.exit(1);
});
