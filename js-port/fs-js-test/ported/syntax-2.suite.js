const { assert, expectEvaluation, expectNull, runCase, finalizeSuite, evaluateTemplate, DefaultFsDataProvider } = require('./common');

function run() {
  const suite = {};

  expectEvaluation('{x:100; return f"y={x+2}"; }', 'y=102');
  expectEvaluation('{x:100; return f"y=\\{x+2}"; }', 'y={x+2}');
  expectEvaluation("{x:1; return f'y={x}'; }", 'y=1');
  expectEvaluation("'test\\'\\''", "test''");
  expectEvaluation("'test\\u0020'", 'test ');

  expectNull('x?.y');
  expectEvaluation('{ x:{y:5}; return x?.y}', 5);

  expectNull('x?!(x*200)');
  expectEvaluation('{ x:5; return x?!(x*200)}', 1000);

  expectEvaluation('[4,5,6][1]', 5);
  expectEvaluation('{x:[4,5,6];return x[1]}', 5);

  expectEvaluation('{y:()=>5;return y()}', 5);

  const expectTemplate = (name, template, expected, context) => {
    runCase(suite, name, () => {
      const provider = context ? new DefaultFsDataProvider(context) : undefined;
      const result = evaluateTemplate(template, provider);
      assert.strictEqual(result, expected);
    });
  };

  expectTemplate('TemplatePlainString', 'abc', 'abc');
  expectTemplate('TemplateEmbeddedExpression', "abc${'1'}", 'abc1');
  expectTemplate('TemplateNestedList', "abc${['d',1,['e',2]]}f", 'abcd1e2f');
  expectTemplate('TemplateListMap', "abc${['d',1] map (x)=>'>'+x}f", 'abc>d>1f');
  expectTemplate('TemplateEscapedBrace', 'value \\${ignored}', 'value ${ignored}');

  finalizeSuite('Syntax2', suite);
}

module.exports = {
  run
};
