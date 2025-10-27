const { expectEvaluation, expectThrows, FsError, runCase, finalizeSuite } = require('./common');

function run() {
  const suite = {};

  runCase(suite, 'FunctionError', () =>
    expectEvaluation('length(a)', new FsError(FsError.ERROR_TYPE_MISMATCH))
  );

  runCase(suite, 'FunctionErrorInExpression', () =>
    expectThrows('10+length(a)', { messageIncludes: 'Unsupported operand types' })
  );

  runCase(suite, 'NullMemberAccessError', () =>
    expectEvaluation('x.l', new FsError(FsError.ERROR_TYPE_MISMATCH))
  );

  runCase(suite, 'ListMemberAccessError', () =>
    expectEvaluation('[5,6].l', new FsError(FsError.ERROR_TYPE_MISMATCH))
  );

  runCase(suite, 'SyntaxErrorMissingOperand', () =>
    expectThrows('3+', { messageIncludes: 'Operand expected' })
  );

  runCase(suite, 'SyntaxErrorIncompleteKvc', () =>
    expectThrows('{a:3,c:', { messageIncludes: 'Expression expected' })
  );

  runCase(suite, 'DelegateErrorPropagation', () =>
    expectThrows('f(3)', { provider: { f: () => { throw new Error('internal'); } }, messageIncludes: 'internal' })
  );

  finalizeSuite('TestErrorReporting', suite);
}

module.exports = {
  run
};
