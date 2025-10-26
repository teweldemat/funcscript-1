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

  result = evaluate('{a:5}.a', provider);
  assert.strictEqual(result[0], FSDataType.Integer);
  assert.strictEqual(result[1], 5);

  result = evaluate('{value:[10,20,30]; return value(2);}', provider);
  assert.strictEqual(result[0], FSDataType.Integer);
  assert.strictEqual(result[1], 30);

  result = evaluate('[{a:1},{a:2}] { return a; }', provider);
  assert.strictEqual(result[0], FSDataType.List);
  const projected = result[1];
  assert.strictEqual(projected.length, 2);
  assert.strictEqual(projected.get(0)[1], 1);
  assert.strictEqual(projected.get(1)[1], 2);

  result = evaluate('{item:{a:5}; return item { return a; };}', provider);
  assert.strictEqual(result[0], FSDataType.Integer);
  assert.strictEqual(result[1], 5);

  result = evaluate('((x)=>x+1)(5)', provider);
  assert.strictEqual(result[0], FSDataType.Integer);
  assert.strictEqual(result[1], 6);

  result = evaluate('case false: "none"; 1=0: "one"; true: "fallback"', provider);
  assert.strictEqual(result[1], 'fallback');

  result = evaluate('switch 2, 1:"one", 2:"two", "other"', provider);
  assert.strictEqual(result[1], 'two');

  result = evaluate('! (1 = 0)', provider);
  assert.strictEqual(result[1], true);

  result = evaluate('- -5', provider);
  assert.strictEqual(result[1], 5);
}

module.exports = {
  run
};
