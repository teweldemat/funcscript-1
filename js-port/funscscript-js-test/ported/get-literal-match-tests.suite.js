const { assert, finalizeSuite, runCase } = require('./common');
const utils = require('../../funscscript-js/src/parser/helpers/utils');

function createRandom(seed = Date.now()) {
  let state = seed >>> 0;
  return function random() {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function randomString(length, random) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const buffer = new Array(length);
  for (let i = 0; i < length; i += 1) {
    buffer[i] = chars.charAt(Math.floor(random() * chars.length));
  }
  return buffer.join('');
}

function run() {
  const suite = {};

  runCase(suite, 'TestExactMatch', () => {
    assert.strictEqual(utils.getLiteralMatch('Hello, world!', 0, 'Hello'), 5);
  });

  runCase(suite, 'TestNoMatch', () => {
    assert.strictEqual(utils.getLiteralMatch('Hello, world!', 0, 'Goodbye'), 0);
  });

  runCase(suite, 'TestCaseInsensitive', () => {
    assert.strictEqual(utils.getLiteralMatch('Hello, world!', 0, 'HELLO'), 5);
  });

  runCase(suite, 'TestMultipleKeywords', () => {
    assert.strictEqual(utils.getLiteralMatch('Hello, world!', 0, 'Goodbye', 'Hello', 'Hi'), 5);
  });

  runCase(suite, 'TestIndexOutOfBounds', () => {
    assert.strictEqual(utils.getLiteralMatch('Hello, world!', 20, 'Hello'), 20);
  });

  runCase(suite, 'TestEmptyString', () => {
    assert.strictEqual(utils.getLiteralMatch('', 0, 'Hello'), 0);
  });

  runCase(suite, 'TestStartIndexWithinSubstring', () => {
    assert.strictEqual(utils.getLiteralMatch('Hello, world!', 7, 'world'), 12);
  });

  runCase(suite, 'TestKeywordAtEndOfSubstring', () => {
    assert.strictEqual(utils.getLiteralMatch('Hello, world!', 12, '!'), 13);
  });

  runCase(suite, 'TestNullString', () => {
    assert.throws(() => utils.getLiteralMatch(null, 0, 'Hello'));
  });

  runCase(suite, 'StressTest', () => {
    const random = createRandom(123456789);
    const target = 'Hello, world!';
    const prefixLength = 200000;
    const suffixLength = 200000;
    const keywordCount = 20000;

    const prefix = randomString(prefixLength, random);
    const suffix = randomString(suffixLength, random);
    const expression = `${prefix}${target}${suffix}`;

    const keywords = new Array(keywordCount);
    for (let i = 0; i < keywordCount; i += 1) {
      keywords[i] = `kw${i}`;
    }
    const targetIndex = Math.floor(random() * keywordCount);
    keywords[targetIndex] = target;

    const start = Date.now();
    const index = utils.getLiteralMatchArray(expression, prefix.length, keywords);
    const elapsed = Date.now() - start;

    assert.strictEqual(index, prefix.length + target.length);
    assert.ok(elapsed < 5000, `Expected getLiteralMatchArray to finish under 5s, took ${elapsed}ms`);
  });

  finalizeSuite('GetLiteralMatchTests', suite);
}

module.exports = {
  run
};
