const { markTodo, finalizeSuite } = require('./common');

function run() {
  const suite = {};

  markTodo(suite, 'ParseTreeInspection', 'Parser exposes blocks but not parse nodes in JS port');

  finalizeSuite('ParseTreeTests', suite);
}

module.exports = {
  run
};
