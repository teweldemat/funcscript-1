const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { WalyaParser, DefaultFsDataProvider } = require('../walya-js/src/walya');

function run() {
  const expressionPath = path.join(__dirname, '..', '..', 'Walya.Test', 'data', 'parse-test-1.fx');
  const expression = fs.readFileSync(expressionPath, 'utf8');
  assert.ok(expression && expression.length > 0, 'fixture expression should not be empty');

  const provider = new DefaultFsDataProvider();

  let parsed;
  const start = performance.now();
  try {
    parsed = WalyaParser.parse(provider, expression);
  } catch (err) {
    assert.fail(`Parser threw: ${err && err.message ? err.message : err}`);
  }
  const duration = performance.now() - start;

  assert.ok(parsed && parsed.block, 'parser should return a block');
  assert.ok(
    duration < 500,
    `expected parse to finish under 500ms but took ${duration.toFixed(2)}ms`
  );
}

module.exports = {
  run
};
