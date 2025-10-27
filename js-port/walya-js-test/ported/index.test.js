const fs = require('fs');
const path = require('path');

function run() {
  const suiteFiles = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith('.suite.js'))
    .sort();

  for (const file of suiteFiles) {
    const fullPath = path.join(__dirname, file);
    const suite = require(fullPath);
    if (!suite || typeof suite.run !== 'function') {
      throw new Error(`Ported test suite ${file} does not export run()`);
    }
    suite.run();
  }
}

module.exports = {
  run
};
