const { expectEvaluation, expectNull, expectThrows, runCase, finalizeSuite } = require('./common');

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

  runCase(suite, 'FormatJson', () => expectEvaluation("format({a:5,b:6}, 'json')", '{"a":5,"b":6}'));
  runCase(
    suite,
    'ParseFsExpression',
    () => expectEvaluation(`parse('{"a":5,"b":6}', 'fs')`, { a: 5, b: 6 })
  );
  runCase(suite, 'ParseHex', () => expectEvaluation("parse('ff', 'hex')", 255));

  runCase(
    suite,
    'DelegateInvocation',
    () => expectEvaluation('f(3)', 4, { provider: { f: (x) => x + 1 } })
  );
  runCase(
    suite,
    'DelegateThrows',
    () => expectThrows('f(1)', { provider: { f: () => { throw new Error('boom'); } }, messageIncludes: 'boom' })
  );
  runCase(
    suite,
    'ByteArrayBridge',
    () => {
      const bytes = new Uint8Array([1, 2, 3]);
      expectEvaluation('bytes', bytes, { provider: { bytes } });
    }
  );

  finalizeSuite('KvcTests', suite);
}

module.exports = {
  run
};
