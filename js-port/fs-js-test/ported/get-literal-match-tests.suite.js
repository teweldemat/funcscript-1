const { assert, finalizeSuite } = require('./common');
const utils = require('../../fs-js/src/parser/helpers/utils');

function randomString(length, random) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(random() * chars.length));
  }
  return result;
}

function run() {
  const suite = {};

  assert.strictEqual(utils.getLiteralMatch('Hello, world!', 0, 'Hello'), 5);
  assert.strictEqual(utils.getLiteralMatch('Hello, world!', 0, 'Goodbye'), 0);
  assert.strictEqual(utils.getLiteralMatch('Hello, world!', 0, 'HELLO'), 5);
  assert.strictEqual(utils.getLiteralMatch('Hello, world!', 0, 'Goodbye', 'Hello', 'Hi'), 5);
  assert.strictEqual(utils.getLiteralMatch('Hello, world!', 20, 'Hello'), 20);
  assert.strictEqual(utils.getLiteralMatch('', 0, 'Hello'), 0);
  assert.strictEqual(utils.getLiteralMatch('Hello, world!', 7, 'world'), 12);
  assert.strictEqual(utils.getLiteralMatch('Hello, world!', 12, '!'), 13);
  assert.throws(() => utils.getLiteralMatch(null, 0, 'Hello'));

  (() => {
    const random = Math.random;
    const target = 'Hello, world!';
    const prefix = randomString(5000, random);
    const suffix = randomString(5000, random);
    const expression = `${prefix}${target}${suffix}`;

    const keywordCount = 5000;
    const keywords = new Array(keywordCount).fill(null).map((_, idx) => `kw${idx}`);
    const targetIndex = Math.floor(random() * keywordCount);
    keywords[targetIndex] = target;

    const start = Date.now();
    const index = utils.getLiteralMatch(expression, prefix.length, ...keywords);
    const elapsed = Date.now() - start;

    assert.strictEqual(index, prefix.length + target.length);
    assert.ok(elapsed < 2000, `Expected getLiteralMatch to finish under 2s, took ${elapsed}ms`);
  })();

  finalizeSuite('GetLiteralMatchTests', suite);
}

module.exports = {
  run
};
