const { markTodo, finalizeSuite } = require('./common');

function run() {
  const suite = {};

  markTodo(suite, 'FsToDotNetConversion', 'Model conversion helpers are not ported yet');

  finalizeSuite('FsToDotNet', suite);
}

module.exports = {
  run
};
