module.exports = function createPrefixParser(env) {
  const { skipSpace, getLiteralMatch } = env.utils;

  function getPrefixOperator(context, exp, index, errors) {
    let matchedFunction = null;
    let matchedLength = index;

    const prefixes = [['!', 'not'], ['-', 'negate']];

    for (const [symbol, canonical] of prefixes) {
      const next = getLiteralMatch(exp, index, symbol);
      if (next > index) {
        const value = context.get(canonical.toLowerCase());
        if (!value) {
          errors.push({ position: index, message: `Prefix operator ${symbol} not defined` });
          return { next: index, block: null };
        }
        const typed = env.ensureTyped(value);
        if (env.typeOf(typed) !== env.FSDataType.Function) {
          errors.push({ position: index, message: `Prefix operator ${symbol} not a function` });
          return { next: index, block: null };
        }
        matchedFunction = env.valueOf(typed);
        matchedLength = next;
        break;
      }
    }

    if (!matchedFunction) {
      return { next: index, block: null };
    }

    let i = skipSpace(exp, matchedLength);
    const operandRes = env.getCallAndMemberAccess(context, exp, i, errors);
    if (!operandRes.block) {
      errors.push({ position: i, message: 'Operand expected for prefix operator' });
      return { next: index, block: null };
    }
    i = skipSpace(exp, operandRes.next);

    const literalFunction = new env.LiteralBlock(env.makeValue(env.FSDataType.Function, matchedFunction));
    const call = new env.FunctionCallExpression(literalFunction, [operandRes.block]);
    call.Pos = index;
    call.Length = i - index;
    return { next: i, block: call };
  }

  return {
    getPrefixOperator
  };
};
