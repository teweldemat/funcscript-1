const fs = require('fs');
const path = require('path');

function collectTests(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const tests = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      tests.push(...collectTests(path.join(dir, entry.name)));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.test.js')) {
      tests.push(path.join(dir, entry.name));
    }
  }
  return tests;
}

const testDir = __dirname;
const testFiles = collectTests(testDir);

let passed = 0;
for (const file of testFiles) {
  const mod = require(file);
  if (typeof mod.run !== 'function') {
    throw new Error(`Test file ${file} does not export run()`);
  }
  mod.run();
  passed += 1;
}

console.log(`Executed ${passed} test suites`);
