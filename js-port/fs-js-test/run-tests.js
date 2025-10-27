const fs = require('fs');
const path = require('path');

const testDir = __dirname;
const files = fs.readdirSync(testDir).filter((f) => f.endsWith('.test.js'));

let passed = 0;
for (const file of files) {
  const mod = require(path.join(testDir, file));
  if (typeof mod.run !== 'function') {
    throw new Error(`Test file ${file} does not export run()`);
  }
  mod.run();
  passed += 1;
}

console.log(`Executed ${passed} test suites`);
