const {
  expectEvaluation,
  markTodo,
  finalizeSuite
} = require('./common');

function run() {
  const suite = {};

  expectEvaluation('{a:3,c:5}', { a: 3, c: 5 });
  expectEvaluation('{a:3,c:5,d:a*c}', { a: 3, c: 5, d: 15 });
  expectEvaluation('{a:3,c:5,d:a*c,return d}', 15);

  markTodo(suite, 'AdvancedKvcScenarios', 'Selection, merging, delegates, and JSON parity pending');

  finalizeSuite('KvcTests', suite);
}

module.exports = {
  run
};
