const assert = require('assert');
const { evaluate, DefaultFsDataProvider } = require('../fs_js/src/FuncScript');
const { FSDataType } = require('../fs_js/src/core/fstypes');

function run() {
  const provider = new DefaultFsDataProvider();

  let result = evaluate('1+2', provider);
  assert.deepStrictEqual(result[0], FSDataType.Integer);
  assert.strictEqual(result[1], 3);

  result = evaluate('1+2*3', provider);
  assert.strictEqual(result[1], 7);

  result = evaluate('If(1=0,10,5)', provider);
  assert.strictEqual(result[0], FSDataType.Integer);
  assert.strictEqual(result[1], 5);

  result = evaluate('"hello"+" "+"world"', provider);
  assert.strictEqual(result[0], FSDataType.String);
  assert.strictEqual(result[1], 'hello world');

  result = evaluate('If(1=1, "yes", "no")', provider);
  assert.strictEqual(result[0], FSDataType.String);
  assert.strictEqual(result[1], 'yes');
}

module.exports = {
  run
};
