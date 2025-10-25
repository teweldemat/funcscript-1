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

  result = evaluate('1=1', provider);
  assert.strictEqual(result[0], FSDataType.Boolean);
  assert.strictEqual(result[1], true);

  result = evaluate('[1,2,3]', provider);
  assert.strictEqual(result[0], FSDataType.List);
  const list = result[1];
  assert.strictEqual(list.length, 3);
  assert.strictEqual(list.get(1)[1], 2);

  result = evaluate('{x:5; y:x+1;}', provider);
  assert.strictEqual(result[0], FSDataType.KeyValueCollection);
  const collection = result[1];
  assert.strictEqual(collection.get('x')[1], 5);
  assert.strictEqual(collection.get('y')[1], 6);

  result = evaluate('{value:[10,20,30]; return value(2);}', provider);
  assert.strictEqual(result[0], FSDataType.Integer);
  assert.strictEqual(result[1], 30);
}

module.exports = {
  run
};
