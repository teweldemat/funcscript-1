const fs = require('fs');
const path = require('path');
const { FunscScriptParser, DefaultFsDataProvider } = require('../funscscript-js/src/funscscript');

const expressionPath = path.join(__dirname, '..', '..', 'FunscScript.Test', 'data', 'parse-test-1.fx');
const expression = fs.readFileSync(expressionPath, 'utf8');

const iterations = Number.parseInt(process.env.ITERATIONS || '5', 10);

function runOnce() {
  const provider = new DefaultFsDataProvider();
  const result = FunscScriptParser.parse(provider, expression);
  if (!result || !result.block) {
    throw new Error('Parse returned no block');
  }
}

console.log(`Profiling FunscScriptParser.parse for ${iterations} iteration(s)`);
const start = Date.now();
for (let i = 0; i < iterations; i += 1) {
  runOnce();
}
const elapsed = Date.now() - start;
console.log(`Completed in ${elapsed}ms`);
