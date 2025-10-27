const { markTodo, finalizeSuite } = require('./common');

function run() {
  const suite = {};

  markTodo(suite, 'ErrorReporting', 'Detailed evaluation exception metadata not wired in JS port');

  finalizeSuite('TestErrorReporting', suite);
}

module.exports = {
  run
};
