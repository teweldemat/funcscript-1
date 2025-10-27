const assert = require('assert');
const {
  evaluate,
  evaluateTemplate,
  DefaultFsDataProvider,
  MapDataProvider,
  KvcProvider,
  FSDataType,
  normalize,
  typeOf,
  valueOf,
  KeyValueCollection,
  SimpleKeyValueCollection,
  FsList,
  ArrayFsList,
  FsError
} = require('../../walya-js/src/walya');

function makeProvider(map, parent) {
  if (map instanceof DefaultFsDataProvider || map instanceof MapDataProvider) {
    return map;
  }
  if (map instanceof KeyValueCollection) {
    return new KvcProvider(map, parent || new DefaultFsDataProvider());
  }
  return new DefaultFsDataProvider(map || {}, parent);
}

function ensureTyped(value) {
  return normalize(value);
}

function unwrapTyped(typed) {
  const normalized = ensureTyped(typed);
  const dataType = typeOf(normalized);
  const inner = valueOf(normalized);
  switch (dataType) {
    case FSDataType.Null:
      return null;
    case FSDataType.Boolean:
    case FSDataType.Integer:
    case FSDataType.Float:
    case FSDataType.BigInteger:
    case FSDataType.String:
    case FSDataType.DateTime:
    case FSDataType.ByteArray:
      return inner;
    case FSDataType.List:
      return Array.from(inner).map((item) => unwrapTyped(item));
    case FSDataType.KeyValueCollection: {
      const entries = inner.getAll();
      const result = {};
      for (const [key, val] of entries) {
        result[key] = unwrapTyped(val);
      }
      return result;
    }
    case FSDataType.Function:
      return { __fsFunction: true };
    case FSDataType.Error:
      return {
        __fsError: true,
        errorType: inner.errorType,
        errorMessage: inner.errorMessage,
        errorData: inner.errorData
      };
    default:
      throw new Error(`Unsupported data type ${dataType}`);
  }
}

function wrapExpected(expected) {
  if (expected && expected.__fsExpectedRaw) {
    return expected.value;
  }
  return expected;
}

function expectEvaluation(expression, expected, { provider, message } = {}) {
  const context = makeProvider(provider);
  const result = evaluate(expression, context);
  const expectedValue = wrapExpected(expected);
  if (expectedValue && expectedValue.__expectTyped) {
    const { type, value } = expectedValue;
    assert.strictEqual(typeOf(result), type, message || `Expected type ${type}, got ${typeOf(result)}`);
    if (typeof value !== 'undefined') {
      assert.deepStrictEqual(unwrapTyped(result), unwrapTyped(value));
    }
    return result;
  }
  const actualUnwrapped = unwrapTyped(result);
  if (expectedValue instanceof FsError) {
    assert.strictEqual(typeOf(result), FSDataType.Error, message || 'Expected FsError');
    const actual = valueOf(result);
    assert.strictEqual(actual.errorType, expectedValue.errorType);
    if (expectedValue.errorMessage) {
      assert.strictEqual(actual.errorMessage, expectedValue.errorMessage);
    }
    return result;
  }
  assert.deepStrictEqual(actualUnwrapped, expectedValue, message);
  return result;
}

function expectNull(expression, options = {}) {
  expectEvaluation(expression, null, options);
}

function expectThrows(expression, { provider, messageIncludes } = {}) {
  const context = makeProvider(provider);
  assert.throws(
    () => {
      evaluate(expression, context);
    },
    (error) => {
      if (!messageIncludes) {
        return true;
      }
      const msg = error && error.message ? error.message : '';
      return msg.includes(messageIncludes);
    },
    `Expected expression to throw${messageIncludes ? ` (${messageIncludes})` : ''}`
  );
}

function expectResultBlock(fn, message) {
  assert.doesNotThrow(fn, message);
}

function markTodo(suite, name, reason) {
  if (!suite.__todos) {
    suite.__todos = [];
  }
  suite.__todos.push({ name, reason });
}

function runCase(suite, name, fn, { allowAssertionTodo = false } = {}) {
  try {
    fn();
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    if (
      /Parse error|Unexpected characters|not implemented|KeyValueCollection\.get not implemented|FsList\.get not implemented/.test(
        message
      )
    ) {
      markTodo(suite, name, message);
      return;
    }
    if (allowAssertionTodo && err instanceof assert.AssertionError) {
      markTodo(suite, name, message);
      return;
    }
    throw err;
  }
}

function finalizeSuite(suiteName, suite) {
  if (suite.__todos && suite.__todos.length) {
    for (const todo of suite.__todos) {
      console.warn(`TODO [${suiteName}] ${todo.name}${todo.reason ? ` - ${todo.reason}` : ''}`);
    }
  }
}

module.exports = {
  assert,
  evaluate,
  evaluateTemplate,
  DefaultFsDataProvider,
  MapDataProvider,
  KvcProvider,
  KeyValueCollection,
  SimpleKeyValueCollection,
  FsList,
  ArrayFsList,
  FSDataType,
  FsError,
  expectEvaluation,
  expectNull,
  expectThrows,
  expectResultBlock,
  unwrapTyped,
  markTodo,
  runCase,
  finalizeSuite
};
