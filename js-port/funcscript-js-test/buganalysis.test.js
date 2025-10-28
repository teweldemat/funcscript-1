const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const { FuncScriptParser, DefaultFsDataProvider } = require('../funcscript-js/src/funcscript');
const {
  identifierMetrics,
  resetIdentifierMetrics,
  literalMatchMetrics,
  resetLiteralMatchMetrics
} = require('../funcscript-js/src/parser/helpers/utils');

function run() {
  const expressionPath = path.join(__dirname, '..', '..', 'FuncScript.Test', 'data', 'parse-test-1.fx');
  const expression = fs.readFileSync(expressionPath, 'utf8');
  assert.ok(expression && expression.length > 0, 'fixture expression should not be empty');

  const provider = new DefaultFsDataProvider();

  resetIdentifierMetrics();
  resetLiteralMatchMetrics();

  let parsed;
  const start = performance.now();
  try {
    parsed = FuncScriptParser.parse(provider, expression);
  } catch (err) {
    assert.fail(`Parser threw: ${err && err.message ? err.message : err}`);
  }
  const duration = performance.now() - start;
  console.log(`[Parse] duration=${duration.toFixed(2)}ms`);

  const totalNs = Number(identifierMetrics.totalTimeNs);
  const totalMs = Number.isFinite(totalNs) ? totalNs / 1e6 : 0;
  const maxNs = Number(identifierMetrics.maxTimeNs);
  const maxMs = Number.isFinite(maxNs) ? maxNs / 1e6 : 0;
  const avgMs = identifierMetrics.calls === 0 ? 0 : totalMs / identifierMetrics.calls;
  console.log(
    `[IdentifierProfile] calls=${identifierMetrics.calls} total=${totalMs.toFixed(3)}ms avg=${avgMs.toFixed(6)}ms max=${maxMs.toFixed(3)}ms`
  );
  console.log(`{LiteralMatch} calls=${literalMatchMetrics.calls}`);
  const breakdown = Array.from(literalMatchMetrics.attemptsByKey.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [key, value] of breakdown) {
    console.log(`{LiteralMatch} top index|tokens=${key} count=${value}`);
  }

  assert.ok(parsed && parsed.block, 'parser should return a block');
  assert.ok(
    duration < 500,
    `expected parse to finish under 500ms but took ${duration.toFixed(2)}ms`
  );
}

module.exports = {
  run
};
