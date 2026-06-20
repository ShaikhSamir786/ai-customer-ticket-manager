#!/usr/bin/env node

const { REPOS, BUILD_ORDER, c, runParallel, formatSummary } = require('./utils');

async function main() {
  console.log(`\n  ${c.cyan('build')} — building ${REPOS.length} repos in dependency order\n`);

  let allOk = true;

  for (const phase of BUILD_ORDER) {
    const label = phase.repos.join(', ');
    console.log(`  ${c.dim('→ phase ' + phase.phase)} ${label}\n`);
    const results = await runParallel(phase.repos, 'build');
    const summary = formatSummary(results);
    console.log(`\n  ${c.dim('phase ' + phase.phase + ':')} ${summary}\n`);
    if (results.some((r) => !r)) {
      allOk = false;
      break;
    }
  }

  if (allOk) {
    console.log(`  ${c.green('✓')} ${c.green('all repos built successfully')}\n`);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(c.red('Fatal:'), err.message);
  process.exit(1);
});
