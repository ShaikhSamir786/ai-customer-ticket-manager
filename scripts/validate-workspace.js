#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { REPOS, ROOT, c } = require('./utils');

let exitCode = 0;

function check(label, ok, detail) {
  if (ok) {
    console.log(`  ${c.green('✓')} ${label}`);
  } else {
    console.log(`  ${c.red('✗')} ${label}${detail ? c.dim(' — ' + detail) : ''}`);
    exitCode = 1;
  }
}

function loadPkg(repo) {
  const p = path.join(ROOT, repo, 'package.json');
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function main() {
  console.log(`\n  ${c.cyan('validate-workspace')} — dependency & consistency checks\n`);

  const pkgs = {};
  for (const repo of REPOS) {
    pkgs[repo] = loadPkg(repo);
  }

  check('All repos have package.json',
    REPOS.every((r) => !!pkgs[r]));

  check('All package names use @ai-ticket scope',
    REPOS.every((r) => pkgs[r].name && pkgs[r].name.startsWith('@ai-ticket/')));

  check('All repos have build, lint, typecheck, clean scripts',
    REPOS.every((r) => {
      const s = pkgs[r].scripts || {};
      return s.build && s.lint && s.typecheck && s.clean;
    }));

  check('All TypeScript configs exist',
    REPOS.every((r) => fs.existsSync(path.join(ROOT, r, 'tsconfig.json'))));

  const externalDeps = {};
  const internalDeps = {};

  for (const repo of REPOS) {
    const deps = { ...pkgs[repo].dependencies, ...pkgs[repo].devDependencies };
    for (const [name, ver] of Object.entries(deps || {})) {
      if (name.startsWith('@ai-ticket/')) {
        (internalDeps[name] = internalDeps[name] || []).push({ repo, ver });
      } else if (!name.startsWith('@types/')) {
        (externalDeps[name] = externalDeps[name] || []).push({ repo, ver });
      }
    }
  }

  for (const [dep, refs] of Object.entries(externalDeps)) {
    const versions = [...new Set(refs.map((r) => r.ver))];
    if (versions.length > 1) {
      check(`Dependency ${dep} version mismatch (${versions.join(', ')})`, false, refs.map((r) => `${r.repo}@${r.ver}`).join(', '));
    } else {
      check(`Dependency ${dep}@${versions[0]} is consistent`, true);
    }
  }

  for (const [dep, refs] of Object.entries(internalDeps)) {
    const versions = [...new Set(refs.map((r) => r.ver))];
    if (versions.length > 1) {
      check(`Internal ${dep} version mismatch (${versions.join(', ')})`, false);
    } else {
      check(`Internal ${dep}@${versions[0]} is consistent`, true);
    }
  }

  const missingBuildDirs = REPOS.filter((r) => {
    const dist = path.join(ROOT, r, 'dist');
    return !fs.existsSync(dist);
  });
  if (missingBuildDirs.length > 0) {
    check(`All repos have dist/`, false, `missing: ${missingBuildDirs.join(', ')}`);
  } else {
    check('All repos have dist/ built', true);
  }

  console.log(`\n  ${c.dim('summary:')} ${exitCode === 0 ? c.green('✓ all checks passed') : c.red('✗ some checks failed')}\n`);
  process.exit(exitCode);
}

main();
