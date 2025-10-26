const { assert, markTodo, finalizeSuite } = require('./common');
const utils = require('../../fs_js/src/parser/helpers/utils');

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

  markTodo(suite, 'StressTest', 'Large stress scenario not yet mirrored for JS');

  finalizeSuite('GetLiteralMatchTests', suite);
}

module.exports = {
  run
};
