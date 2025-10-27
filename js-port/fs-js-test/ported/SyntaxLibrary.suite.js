const { markTodo, finalizeSuite } = require('./common');

function run() {
  const suite = {};

  markTodo(suite, 'SyntaxLibrary', 'Comprehensive operator and builtin coverage pending port');

  finalizeSuite('SyntaxLibrary', suite);
}

module.exports = {
  run
};
