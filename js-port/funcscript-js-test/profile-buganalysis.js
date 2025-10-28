const fs = require('fs');
const path = require('path');
const { FuncScriptParser, DefaultFsDataProvider } = require('../funcscript-js/src/funcscript');

const expressionPath = path.join(__dirname, '..', '..', 'FuncScript.Test', 'data', 'parse-test-1.fx');
const expression = fs.readFileSync(expressionPath, 'utf8');

const iterations = Number.parseInt(process.env.ITERATIONS || '5', 10);

function runOnce() {
  const provider = new DefaultFsDataProvider();
  const result = FuncScriptParser.parse(provider, expression);
  if (!result || !result.block) {
    throw new Error('Parse returned no block');
  }
}

console.log(`Profiling FuncScriptParser.parse for ${iterations} iteration(s)`);
const start = Date.now();
for (let i = 0; i < iterations; i += 1) {
  runOnce();
}
const elapsed = Date.now() - start;
console.log(`Completed in ${elapsed}ms`);
