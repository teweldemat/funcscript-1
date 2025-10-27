const assert = require('assert');
const { evaluate, DefaultFsDataProvider } = require('../fs-js/src/func-script');
const { FSDataType } = require('../fs-js/src/core/fstypes');
const { ensureTyped, typeOf, valueOf } = require('../fs-js/src/core/value');

function expectNumber(expression, expectedType, expectedValue, provider) {
  const result = ensureTyped(evaluate(expression, provider));
  assert.strictEqual(typeOf(result), expectedType, `Type mismatch for ${expression}`);
  assert.strictEqual(valueOf(result), expectedValue, `Value mismatch for ${expression}`);
}

function run() {
  const provider = new DefaultFsDataProvider();

  expectNumber('5/6', FSDataType.Integer, 0, provider);
  expectNumber('10/3', FSDataType.Integer, 3, provider);
  expectNumber('10/3.0', FSDataType.Float, 10 / 3, provider);
  expectNumber('10.0/3', FSDataType.Float, 10 / 3, provider);
  expectNumber('10l/3', FSDataType.BigInteger, BigInt(3), provider);
  expectNumber('10l/3l', FSDataType.BigInteger, BigInt(3), provider);

  expectNumber('5+2', FSDataType.Integer, 7, provider);
  expectNumber('5+2.5', FSDataType.Float, 7.5, provider);
  expectNumber('5-8', FSDataType.Integer, -3, provider);
  expectNumber('5*2', FSDataType.Integer, 10, provider);
  expectNumber('5%2', FSDataType.Integer, 1, provider);

  expectNumber('negate(5)', FSDataType.Integer, -5, provider);
  expectNumber('negate(5.5)', FSDataType.Float, -5.5, provider);
  expectNumber('negate(5l)', FSDataType.BigInteger, BigInt(-5), provider);

  expectNumber('sin(0)', FSDataType.Float, Math.sin(0), provider);
  expectNumber('cos(0)', FSDataType.Float, Math.cos(0), provider);
}

module.exports = {
  run
};
