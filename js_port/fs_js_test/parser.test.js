const assert = require('assert');

const { parse } = require('../fs_js/src/parser');
const { FSDataType } = require('../fs_js/src/core/constants');
const { literalNumber, literalString } = require('../fs_js/src/core/values');
const { LiteralBlock } = require('../fs_js/src/ast/literalBlock');
const { FunctionCallExpression } = require('../fs_js/src/ast/functionCallExpression');
const { ListExpression } = require('../fs_js/src/ast/listExpression');
const { ReferenceBlock } = require('../fs_js/src/ast/referenceBlock');
const { KvcExpression } = require('../fs_js/src/ast/kvcExpression');

class TestProvider {
  constructor() {
    this.functions = new Map([
      ['+', [FSDataType.FUNCTION, { symbol: '+', arity: 2 }]],
      ['-', [FSDataType.FUNCTION, { symbol: '-', arity: 2 }]],
      ['neg', [FSDataType.FUNCTION, { symbol: 'neg', arity: 1 }]],
      ['not', [FSDataType.FUNCTION, { symbol: 'not', arity: 1 }]],
    ]);
  }

  getData(symbol) {
    return this.functions.get(symbol);
  }
}

function assertLiteral(block, expectedValue) {
  assert(block instanceof LiteralBlock);
  assert.deepStrictEqual(block.value, expectedValue);
}

{
  const provider = new TestProvider();
  const { expression, errors } = parse(provider, '1 + 2');
  assert.strictEqual(errors.length, 0);
  assert(expression);
  assert(expression.parameters.length === 2);
  assertLiteral(expression.parameters[0], literalNumber(1));
  assertLiteral(expression.parameters[1], literalNumber(2));
}

{
  const provider = new TestProvider();
  const { expression, errors } = parse(provider, 'greet("hi")');
  assert.strictEqual(errors.length, 0);
  assert(expression.function);
  assert(expression.parameters.length === 1);
  assertLiteral(expression.parameters[0], literalString('hi'));
}

{
  const provider = new TestProvider();
  const { expression, errors } = parse(provider, 'f"hello {1}"');
  assert.strictEqual(errors.length, 0);
  assert(expression instanceof FunctionCallExpression);
  assert(expression.parameters.length === 2);
  assertLiteral(expression.parameters[0], literalString('hello '));
  assertLiteral(expression.parameters[1], literalNumber(1));
}

{
  const provider = new TestProvider();
  const { expression, errors } = parse(provider, '[1, 2, 3]');
  assert.strictEqual(errors.length, 0);
  assert(expression instanceof ListExpression);
  assert(expression.valueExpressions.length === 3);
  expression.valueExpressions.forEach((item, idx) => {
    assertLiteral(item, literalNumber(idx + 1));
  });
}

{
  const provider = new TestProvider();
  const { expression, errors } = parse(provider, '{ foo: 1, bar: "hi" }');
  assert.strictEqual(errors.length, 0);
  assert(expression instanceof KvcExpression);
  assert.strictEqual(expression.keyValues.length, 2);
  assert.strictEqual(expression.keyValues[0].key, 'foo');
  assertLiteral(expression.keyValues[0].valueExpression, literalNumber(1));
  assert.strictEqual(expression.keyValues[1].key, 'bar');
  assertLiteral(expression.keyValues[1].valueExpression, literalString('hi'));
}

{
  const provider = new TestProvider();
  const { expression, errors } = parse(provider, 'alpha: 10, return beta');
  assert.strictEqual(errors.length, 0);
  assert(expression instanceof KvcExpression);
  assert.strictEqual(expression.keyValues.length, 1);
  assert.strictEqual(expression.keyValues[0].key, 'alpha');
  assertLiteral(expression.keyValues[0].valueExpression, literalNumber(10));
  assert(expression.returnExpression);
}

{
  const provider = new TestProvider();
  const { expression, errors } = parse(provider, '-7');
  assert.strictEqual(errors.length, 0);
  assert(expression instanceof LiteralBlock);
  assertLiteral(expression, literalNumber(-7));
}

{
  const provider = new TestProvider();
  const { expression, errors } = parse(provider, '-foo');
  assert.strictEqual(errors.length, 0);
  assert(expression instanceof FunctionCallExpression);
  assert(expression.parameters.length === 1);
  assert(expression.parameters[0] instanceof ReferenceBlock);
  assert.strictEqual(expression.parameters[0].identifier, 'foo');
}

console.log('parser tests passed');
