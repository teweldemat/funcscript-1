const { expectEvaluation, expectNull, FsError, runCase, finalizeSuite } = require('./common');

function run() {
  const suite = {};

  const libraryCases = [
    { name: 'LessThan true', expression: '1<3', expected: true },
    { name: 'LessThanOrEqual true', expression: '1<=3', expected: true },
    { name: 'LessThan false', expression: '3<3', expected: false },
    { name: 'LessThanOrEqual boundary', expression: '3<=3', expected: true },
    { name: 'LessThanOrEqual false', expression: '5<=3', expected: false },
    { name: 'LessThan false greater', expression: '5<3', expected: false },
    { name: 'GreaterThan false', expression: '1>3', expected: false },
    { name: 'GreaterThanOrEqual false', expression: '1>=3', expected: false },
    { name: 'GreaterThan boundary false', expression: '3>3', expected: false },
    { name: 'GreaterThanOrEqual boundary', expression: '3>=3', expected: true },
    { name: 'GreaterThanOrEqual true', expression: '5>=3', expected: true },
    { name: 'GreaterThan true', expression: '5>3', expected: true },
    { name: 'GreaterThan mixed false', expression: '1>3.0', expected: false },
    { name: 'GreaterThanOrEqual mixed false', expression: '1>=3.0', expected: false },
    { name: 'GreaterThan mixed boundary', expression: '3>3.0', expected: false },
    { name: 'GreaterThanOrEqual mixed boundary', expression: '3>=3.0', expected: true },
    { name: 'GreaterThanOrEqual mixed true', expression: '5>=3.0', expected: true },
    { name: 'GreaterThan mixed true', expression: '5>3.0', expected: true },
    { name: 'Equals mixed true', expression: '3=3.0', expected: true },
    { name: 'Equals string numeric false', expression: '3="3.0"', expected: false },
    { name: 'Equals string true', expression: '"99"="99"', expected: true },
    { name: 'Greater string true', expression: '"99">"98"', expected: true },
    { name: 'Less string true', expression: '"90"<"99"', expected: true },
    { name: 'NotEquals string false', expression: '"99"!="99"', expected: false },
    { name: 'Less string false', expression: '"99"<"98"', expected: false },
    { name: 'Greater string false', expression: '"90">"99"', expected: false },
    { name: 'NotEquals null string', expression: 'null!="99"', expected: true },
    { name: 'Less null returns null', expression: 'null<"98"', expected: null },
    { name: 'Greater string null returns null', expression: '"90">null', expected: null },
    { name: 'Null equals null', expression: 'null=null', expected: true },
    { name: 'List equality false', expression: '12=[1,2,3,4]', expected: false },
    { name: 'List compare greater mismatch', expression: '12>[1,2,3,4]', errorType: FsError.ERROR_TYPE_MISMATCH },
    { name: 'List compare greaterEqual mismatch', expression: '12>=[1,2,3,4]', errorType: FsError.ERROR_TYPE_MISMATCH },
    { name: 'List compare less mismatch', expression: '12<[1,2,3,4]', errorType: FsError.ERROR_TYPE_MISMATCH },
    { name: 'List compare lessEqual mismatch', expression: '12<=[1,2,3,4]', errorType: FsError.ERROR_TYPE_MISMATCH },
    { name: 'Chained GreaterThan invalid', expression: '1>2>3', errorType: FsError.ERROR_PARAMETER_COUNT_MISMATCH },
    { name: 'Chained LessThan invalid', expression: '1<2<3', errorType: FsError.ERROR_PARAMETER_COUNT_MISMATCH },
    { name: 'Chained Equals invalid', expression: '1=2=3', errorType: FsError.ERROR_PARAMETER_COUNT_MISMATCH },
    { name: 'Chained NotEquals invalid', expression: '1!=2!=3', errorType: FsError.ERROR_PARAMETER_COUNT_MISMATCH },
    { name: 'If null comparison', expression: 'if(2=null,0,1)', expected: 1 },
    { name: 'Not true', expression: 'not(1=1)', expected: false },
    { name: 'Not false', expression: 'not(3=1)', expected: true },
    { name: 'Not null mismatch', expression: 'not(null)', errorType: FsError.ERROR_TYPE_MISMATCH },
    { name: 'Not string mismatch', expression: 'not("0")', errorType: FsError.ERROR_TYPE_MISMATCH },
    { name: 'Case insensitive member access 1', expression: '{"a":45}.A', expected: 45 },
    { name: 'Case insensitive member access 2', expression: '{"A":45}.a', expected: 45 },
    { name: 'Line comment ignore', expression: '1+2//that is it', expected: 3 },
    { name: 'Line comment newline', expression: '1+2//that is it\n+5', expected: 8 },
    { name: 'Modulo int', expression: '3%2', expected: 1 },
    { name: 'Modulo zero', expression: '2%2', expected: 0 },
    { name: 'Modulo chain', expression: '3%2%2', expected: 1 },
    { name: 'Modulo float', expression: '3%2.0', expected: 1.0 },
    { name: 'Modulo float zero', expression: '2%2.0', expected: 0.0 },
    { name: 'Modulo mixed chain', expression: '3%2%2.0', expected: 1.0 },
    { name: 'Modulo float chain', expression: '3.0%2.0%2', expected: 1.0 },
    { name: 'Division int', expression: '3/2', expected: 1 },
    { name: 'Division equal', expression: '2/2', expected: 1 },
    { name: 'Division chain', expression: '3/2/2', expected: 0 },
    { name: 'Division float', expression: '3/2.0', expected: 1.5 },
    { name: 'Division float zero', expression: '2/2.0', expected: 1.0 },
    { name: 'Division mixed chain', expression: '3/2/2.0', expected: 0.5 },
    { name: 'Division float chain', expression: '3.0/2.0/2', expected: 0.75 },
    { name: 'In true', expression: '1 in [1,2]', expected: true },
    { name: 'In false', expression: '0 in [1,2]', expected: false },
    { name: 'In find last', expression: '0 in [1,2,0]', expected: true },
    { name: 'In find middle', expression: '0 in [1,0,2]', expected: true },
    { name: 'In in conditional false', expression: 'if(0 in [1,2],1,2)', expected: 2 },
    { name: 'In in conditional true', expression: 'if(1 in [1,2],1,2)', expected: 1 },
    { name: 'In string true', expression: '"1" in ["1",1,2]', expected: true },
    { name: 'In string mismatch', expression: '1 in ["1",2]', expected: false },
    { name: 'Not string in list', expression: 'not("1" in ["1",2])', expected: false },
    { name: 'And true', expression: 'true and true', expected: true },
    { name: 'And false second', expression: 'true and false', expected: false },
    { name: 'And chain true', expression: 'true and true and true', expected: true },
    { name: 'And chain false', expression: 'true and false and true', expected: false },
    { name: 'Or true', expression: 'true or true', expected: true },
    { name: 'Or true false', expression: 'true or false', expected: true },
    { name: 'Or chain true', expression: 'true or true or true', expected: true },
    { name: 'Or chain mixed', expression: 'true or false or true', expected: true },
    { name: 'AndOr precedence', expression: 'true and true or false and false', expected: false },
    { name: 'OrAnd precedence', expression: 'true or false and true', expected: true },
    { name: 'And short circuit', expression: 'false and ([34]>5)', expected: false },
    { name: 'And mismatch', expression: 'true and ([34]>5)', errorType: FsError.ERROR_TYPE_MISMATCH },
    { name: 'Or mismatch', expression: 'false or  ([34]>5)', errorType: FsError.ERROR_TYPE_MISMATCH },
    { name: 'Or short circuit', expression: 'true or ([34]>5)', expected: true },
    { name: 'In with expression', expression: '2*3 in [4,6]', expected: true },
    { name: 'Equals conjunction false', expression: '2=2 and 3=4', expected: false },
    { name: 'Equals disjunction true', expression: '2=2 or 3=4', expected: true },
    { name: 'Template simple', expression: '{ x:5; return f"ab{x}";}', expected: 'ab5' },
    { name: 'Template spaces 1', expression: '{ x:5; return f"ab{ x}";}', expected: 'ab5' },
    { name: 'Template spaces 2', expression: '{ x:5; return f"ab{ x }";}', expected: 'ab5' },
    { name: 'Template spaces 3', expression: '{ x:5; return f"ab{x }";}', expected: 'ab5' },
    { name: 'Template escape prime', expression: "f'{1}\\''", expected: "1'" },
    { name: 'Format numeric pattern', expression: 'format(12.123,"#,0.00")', expected: '12.12' },
    { name: 'Format null pattern', expression: 'format(null,"#,0.00")', expected: 'null' },
    { name: 'List index literal', expression: '[4,5,6][1]', expected: 5 },
    { name: 'List index variable', expression: '{x:[4,5,6];return x[1]}', expected: 5 },
    { name: 'List call index', expression: '[2,3,4](0)', expected: 2 },
    { name: 'Nested list index', expression: '([[2,3,4],[3,4,5]])(0)(1)', expected: 3 },
    { name: 'NotEquals true', expression: '1!=2', expected: true },
    { name: 'NotEquals false', expression: '1!=1', expected: false },
    { name: 'Multiply chain', expression: '1*2*3*4', expected: 24 }
  ];

  libraryCases.forEach(({ name, expression, expected, errorType }) => {
    runCase(suite, name, () => {
      if (errorType) {
        expectEvaluation(expression, new FsError(errorType));
        return;
      }
      if (expected === null) {
        expectNull(expression);
        return;
      }
      expectEvaluation(expression, expected);
    });
  });

  const precedenceCases = [{ name: 'False or false or true', expression: 'false or false or true', expected: true }];

  precedenceCases.forEach(({ name, expression, expected }) => {
    runCase(suite, name, () => expectEvaluation(expression, expected));
  });

  const mixedNumericCases = [
    { name: 'Subtract float', expression: '10 - 6.0', expected: 4 },
    { name: 'Add long', expression: '15 + 5l', expected: BigInt(20) },
    { name: 'Subtract long', expression: '20 - 4l', expected: BigInt(16) },
    { name: 'Add floats', expression: '7.5 + 2.5', expected: 10 },
    { name: 'Multiply float', expression: '8 * 2.0', expected: 16 },
    { name: 'Divide float result', expression: '5.0 / 2', expected: 2.5 },
    { name: 'Subtract mixed long', expression: '100l - 50', expected: BigInt(50) },
    { name: 'Multiply long float', expression: '2l * 3.0', expected: 6 },
    { name: 'Divide mixed long result', expression: '12 / 3l', expected: BigInt(4) }
  ];

  mixedNumericCases.forEach(({ name, expression, expected }) => {
    runCase(suite, name, () => expectEvaluation(expression, expected));
  });

  finalizeSuite('SyntaxLibrary', suite);
}

module.exports = {
  run
};
