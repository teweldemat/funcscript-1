#!/usr/bin/env node
'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../../../..');
const tarballDir = path.resolve(__dirname, '..', 'tarballs');

const packages = [
  {
    name: '@tewelde/funscscript',
    sourceDir: path.join(repoRoot, 'js-port', 'funscscript-js'),
    targetName: 'funscscript-runtime.tgz'
  },
  {
    name: '@tewelde/funscscript-editor',
    sourceDir: path.join(repoRoot, 'js-port', 'funscscript-editor'),
    targetName: 'funscscript-editor.tgz'
  }
];

function ensureCleanDir(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function packPackage(pkg) {
  const { name, sourceDir, targetName } = pkg;
  const tarballName = execSync(`npm pack --pack-destination "${tarballDir}"`, {
    cwd: sourceDir,
    stdio: 'pipe'
  })
    .toString()
    .trim()
    .split('\n')
    .pop();

  if (!tarballName) {
    throw new Error(`npm pack for ${name} did not return a tarball name`);
  }

  const packedPath = path.join(tarballDir, tarballName);
  if (!fs.existsSync(packedPath)) {
    throw new Error(`Expected tarball at ${packedPath}, but it was not found`);
  }

  const targetPath = path.join(tarballDir, targetName);
  fs.rmSync(targetPath, { force: true });
  fs.renameSync(packedPath, targetPath);
  return targetPath;
}

function main() {
  ensureCleanDir(tarballDir);
  for (const pkg of packages) {
    const output = packPackage(pkg);
    console.log(`[prepare-tarballs] Packed ${pkg.name} -> ${path.relative(repoRoot, output)}`);
  }
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('[prepare-tarballs] Failed:', err.message || err);
    process.exitCode = 1;
  }
}
