const {
  expectEvaluation,
  expectNull,
  expectThrows,
  runCase,
  markTodo,
  finalizeSuite
} = require('./common');

function run() {
  const suite = {};

  runCase(suite, 'TestConstant', () => expectEvaluation('1', 1));

  const numberAndStringCases = [
    { exp: '12', expected: 12 },
    { exp: '12.', expected: 12 },
    { exp: '12.0', expected: 12 },
    { exp: '12e1', expected: 120 },
    { exp: '12.0e1', expected: 120 },
    { exp: '-12', expected: -12 },
    { exp: '-12.', expected: -12 },
    { exp: '-12.0', expected: -12 },
    { exp: '-12e1', expected: -120 },
    { exp: '-12.0e1', expected: -120 },
    { exp: '-12l', expected: BigInt(-12) },
    { exp: '-12e1l', expected: BigInt(-120) },
    { exp: '-1', expected: -1 },
    { exp: '12+12l', expected: BigInt(24) },
    { exp: '"12"', expected: '12' },
    { exp: '3+"12"', expected: '312' },
    { exp: '"12"+3', expected: '123' },
    { exp: '1.0/2', expected: 0.5 },
    { exp: '5/2', expected: 2 },
    { exp: '1.0+5', expected: 6 },
    { exp: '5+1/2', expected: 5 },
    { exp: '1+2+3', expected: 6 },
    { exp: '(1+2+3)+5', expected: 11 },
    { exp: '1+2*3', expected: 7 },
    { exp: '1+2*3+4', expected: 11 },
    { exp: '"a"+"b"+3+"c"', expected: 'ab3c' },
    { exp: 'If(1=0,1,\n3)', expected: 3 },
    { exp: '{r:2; return R;}', expected: 2 },
    { exp: '{r:(a)=>A*A; return R(2);}', expected: 4 },
    { exp: '{R:(a)=>A*A; return r(2);}', expected: 4 }
  ];
  numberAndStringCases.forEach(({ exp, expected }) => {
    runCase(
      suite,
      `NumberAndStringParsing ${exp}`,
      () => expectEvaluation(exp, expected),
      { allowAssertionTodo: true }
    );
  });

  const stringCases = [
    { exp: '"12"+"34"', expected: '1234' },
    { exp: '3+"12"', expected: '312' },
    { exp: '"12"+3', expected: '123' },
    { exp: '"a\\"b"', expected: 'a"b' },
    { exp: '{x:5; return f"a{x}b"; }', expected: 'a5b' },
    { exp: '{x:5; return f"a\\{x}b"; }', expected: 'a{x}b' },
    { exp: '{return 3}', expected: 3 },
    { exp: '{return\t3}', expected: 3 },
    { exp: '{return\n3}', expected: 3 },
    { exp: '{return\r3}', expected: 3 },
    { exp: '{a:(x)=>x,return a( 5)}', expected: 5 }
  ];
  stringCases.forEach(({ exp, expected }) => {
    runCase(
      suite,
      `StringConcatenation ${exp}`,
      () => expectEvaluation(exp, expected),
      { allowAssertionTodo: true }
    );
  });

  const literalCases = [
    { exp: 'null', expected: null },
    { exp: 'true', expected: true },
    { exp: 'TRue', expected: true },
    { exp: 'false', expected: false },
    { exp: 'FAlse', expected: false }
  ];
  literalCases.forEach(({ exp, expected }) => {
    if (expected === null) {
      runCase(suite, `KeywordLiteral ${exp}`, () => expectNull(exp));
    } else {
      runCase(suite, `KeywordLiteral ${exp}`, () => expectEvaluation(exp, expected));
    }
  });

  runCase(suite, 'TestInvalid 12e-', () => expectThrows('12e-', { messageIncludes: 'Invalid exponent' }));
  runCase(
    suite,
    'TestOverflow',
    () => expectThrows('92233720368547758070', { messageIncludes: 'Invalid number' })
  );

  runCase(
    suite,
    'TestMapList',
    () => expectEvaluation('Map([1,2,4],(x)=>x*x)', [1, 4, 16]),
    { allowAssertionTodo: true }
  );

  runCase(
    suite,
    'SumListWithInitial',
    () => expectEvaluation('Reduce(Map([1,2,4],(x)=>x*x),(c,t)=>t+c,0)', 21),
    { allowAssertionTodo: true }
  );

  runCase(
    suite,
    'TestListParser',
    () => expectEvaluation('[1,2,4]', [1, 2, 4]),
    { allowAssertionTodo: true }
  );

  runCase(suite, 'TestJsonParser', () => expectEvaluation('{"a":23}', { a: 23 }));

  runCase(
    suite,
    'SumListWthNoInitialInt',
    () => expectEvaluation('Reduce(Map([1,2,4],(x)=>x*x),(c,p)=>p+c)', 21)
  );

  const intExpressions = [
    { exp: '(()=>())()+1', expected: 1 },
    { exp: '(()=>5)()', expected: 5 },
    { exp: '-1', expected: -1 },
    { exp: '2--1', expected: 3 },
    { exp: '2-1', expected: 1 },
    { exp: '1/2', expected: 0 },
    { exp: 'If(1=0,10,5-1)', expected: 4 },
    { exp: '((a)=>a*a)(3)', expected: 9 },
    {
      exp: `{
    x:3;
    return x*x+{return 2;};
}`,
      expected: 11
    },
    {
      exp: `{
    x:(a)=>a*a;
    return x(3);
}`,
      expected: 9
    },
    {
      exp: `{
    j:{"age":30,"name":20,"parts":{"x":23, "y":10}};
    return j.parts.x;
}`,
      expected: 23
    },
    {
      exp: `{
    j:(a)=>a*a;
return j;
}(4)` ,
      expected: 16
    },
    {
      exp: `{
  b:{"x":(a)=>a*a};
  return (b.x)(2);
}`,
      expected: 4
    },
    {
      exp: '{return (x)=>3;}(3)',
      expected: 3
    },
    { exp: '1+{return 2;}', expected: 3 },
    { exp: '{return 2;}', expected: 2 }
  ];

  intExpressions.forEach(({ exp, expected }) => {
    runCase(suite, `IntExpression ${exp}`, () => expectEvaluation(exp, expected));
  });

  runCase(suite, 'MapNull null map', () => expectNull('null map (x)=>x'));
  runCase(suite, 'MapNull undefined', () => expectNull('y map (x)=>x'));

  // Remaining tests in BasicTests.cs are kept as TODO markers for parity tracking
  markTodo(suite, 'ExtendedScenarios', 'Remaining BasicTests.cs coverage pending port');

  finalizeSuite('BasicTests', suite);
}

module.exports = {
  run
};
