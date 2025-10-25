const assert = require('assert');

const { parse } = require('../fs_js/src/parser');
const { MapDataProvider } = require('../fs_js/src/runtime/dataProvider');
const { wrapFunction } = require('../fs_js/src/runtime/functions');
const { literalNumber, literalString } = require('../fs_js/src/core/values');
const { FSDataType } = require('../fs_js/src/core/constants');

function createTestProvider() {
  const provider = new MapDataProvider();

  provider
    .set('+', wrapFunction('+', ({ args }) => literalNumber(args[0][1] + args[1][1]), { arity: 2 }))
    .set('greet', wrapFunction('greet', ({ args }) => literalString(`Hello ${args[0][1]}`), { arity: 1 }))
    .set('neg', wrapFunction('neg', ({ args }) => literalNumber(-args[0][1]), { arity: 1 }))
    .set('foo', literalNumber(7));

  return provider;
}

{
  const provider = createTestProvider();
  const { expression } = parse(provider, '1 + 2');
  const result = expression.evaluate(provider);
  assert.strictEqual(result.value[0], FSDataType.INTEGER);
  assert.strictEqual(result.value[1], 3);
}

{
  const provider = createTestProvider();
  const { expression } = parse(provider, 'greet("world")');
  const result = expression.evaluate(provider);
  assert.strictEqual(result.value[0], FSDataType.STRING);
  assert.strictEqual(result.value[1], 'Hello world');
}

{
  const provider = createTestProvider();
  const { expression } = parse(provider, '-foo');
  const result = expression.evaluate(provider);
  assert.strictEqual(result.value[0], FSDataType.INTEGER);
  assert.strictEqual(result.value[1], -7);
}

{
  const provider = createTestProvider();
  const { expression } = parse(provider, '((x, y) => x + y)(1, 2)');
  const result = expression.evaluate(provider);
  assert.strictEqual(result.value[0], FSDataType.INTEGER);
  assert.strictEqual(result.value[1], 3);
}

console.log('evaluation tests passed');
