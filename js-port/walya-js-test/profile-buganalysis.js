const fs = require('fs');
const path = require('path');
const { WalyaParser, DefaultFsDataProvider } = require('../walya-js/src/walya');

const expressionPath = path.join(__dirname, '..', '..', 'Walya.Test', 'data', 'parse-test-1.fx');
const expression = fs.readFileSync(expressionPath, 'utf8');

const iterations = Number.parseInt(process.env.ITERATIONS || '5', 10);

function runOnce() {
  const provider = new DefaultFsDataProvider();
  const result = WalyaParser.parse(provider, expression);
  if (!result || !result.block) {
    throw new Error('Parse returned no block');
  }
}

console.log(`Profiling WalyaParser.parse for ${iterations} iteration(s)`);
const start = Date.now();
for (let i = 0; i < iterations; i += 1) {
  runOnce();
}
const elapsed = Date.now() - start;
console.log(`Completed in ${elapsed}ms`);
