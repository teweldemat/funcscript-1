const {
  expectEvaluation,
  expectNull,
  markTodo,
  finalizeSuite
} = require('./common');

function run() {
  const suite = {};

  expectEvaluation('{a:3,c:5}', { a: 3, c: 5 });
  expectEvaluation('{a:3,c:5,d:a*c}', { a: 3, c: 5, d: 15 });
  expectEvaluation('{a:3,c:5,d:a*c,return d}', 15);
  expectEvaluation('{"a":45}.a', 45);
  expectEvaluation('{"A":45}.a', 45);
  expectNull('x?.y');
  expectEvaluation('{ x:{y:5}; return x?.y; }', 5);
  expectEvaluation("Select({'a':1,'b':2},{'b':5,'c':8})", { b: 5, c: 8 });
  expectEvaluation("Select({'a':1,'b':5,'c':8},{'a':null,'b':null})", { a: 1, b: 5 });
  expectEvaluation('Select({a:3,b:4},{a,c:5})', { a: 3, c: 5 });

  markTodo(suite, 'FormatAndSerialization', 'FormatToJson and JSON equivalence tests not yet ported');
  markTodo(suite, 'DelegateInterop', 'Delegate invocation and byte-array bridging pending');

  finalizeSuite('KvcTests', suite);
}

module.exports = {
  run
};
