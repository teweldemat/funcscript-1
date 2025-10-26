const {
  expectEvaluation,
  expectNull,
  markTodo,
  finalizeSuite,
  FsError
} = require('./common');

function run() {
  const suite = {};

  expectEvaluation('a:4,b:5', { a: 4, b: 5 });

  // Not operator tests
  expectEvaluation('!true', false);
  expectEvaluation('!false', true);
  expectEvaluation('!(1=2)', true);

  // Negative operator handling
  expectEvaluation('-5', -5);
  expectEvaluation('1--5', 6);
  expectEvaluation('1+-5', -4);
  expectEvaluation('{x:-5;return -x}', 5);
  expectEvaluation('{x:-5;return 1--x}', -4);
  expectEvaluation('{x:-5;return 1+-x}', 6);

  // General infix syntax still pending full parity
  expectEvaluation('reduce([4,5,6],(x,s)=>s+x)', 15);
  expectEvaluation('reduce([4,5,6],(x,s)=>s+x,-2)', 13);
  expectEvaluation('[4,5,6] reduce (x,s)=>s+x ~ -2', 13);
  expectEvaluation('(series(0,4) reduce (x,s)=>s+x ~ 0)', 6);
  expectEvaluation('series(0,4) reduce (x,s)=>s+x ~ 0', 6);
  expectEvaluation('(series(1,3) map (a)=>a*a) reduce (x,s)=>s+x ~ 5', 19);
  expectNull('x?![1,2,3] first(x)=>x*x');
  expectNull('{ b:x?! [1,2,3] map(x) => 5; return b}');
  expectEvaluation('{x:9; b:x?! [1,2,3] map(x) => 5; return b[1]}', 5);

  // Operator precedence
  expectEvaluation('1+2*4', 9);
  expectEvaluation('1+4/2', 3);

  // Error result propagation parity missing
  expectEvaluation('!null', new FsError(FsError.ERROR_TYPE_MISMATCH, '! expects a boolean operand'));

  finalizeSuite('AdvancedSyntax', suite);
}

module.exports = {
  run
};
