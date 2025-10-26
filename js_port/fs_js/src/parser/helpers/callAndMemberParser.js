module.exports = function createCallAndMemberParser(env) {
  const { FunctionCallExpression } = env;
const { skipSpace, getLiteralMatch } = env.utils;

  function getFunctionCallParametersList(context, current, exp, index, errors) {
    let i = skipSpace(exp, index);
    const open = getLiteralMatch(exp, i, '(');
    if (open === i) {
      return { next: index, block: null };
    }
    i = skipSpace(exp, open);

    const parameters = [];
    const closeImmediately = getLiteralMatch(exp, i, ')') > i;
    if (!closeImmediately) {
      while (true) {
        const paramRes = env.getExpression(context, exp, i, errors);
        if (!paramRes.block) {
          errors.push({ position: i, message: 'Parameter expected' });
          return { next: index, block: null };
        }
        parameters.push(paramRes.block);
        i = skipSpace(exp, paramRes.next);
        const separator = getLiteralMatch(exp, i, ',');
        if (separator === i) {
          break;
        }
        i = skipSpace(exp, separator);
      }
    } else {
      i = skipSpace(exp, getLiteralMatch(exp, i, ')'));
    }

    const close = getLiteralMatch(exp, i, ')');
    if (close === i) {
      errors.push({ position: i, message: "')' expected" });
      return { next: index, block: null };
    }

    const call = new FunctionCallExpression(current, parameters);
    call.Pos = current.Pos;
    call.Length = close - current.Pos;
    return { next: close, block: call };
  }

  function getCallAndMemberAccess(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const unitRes = env.getUnit(context, exp, i, errors);
    if (!unitRes.block) {
      return { next: index, block: null };
    }
    let current = unitRes.block;
    i = skipSpace(exp, unitRes.next);

    while (true) {
      const callRes = getFunctionCallParametersList(context, current, exp, i, errors);
      if (callRes.next > i) {
        current = callRes.block;
        i = skipSpace(exp, callRes.next);
        continue;
      }

      const selectorRes = env.getKvcExpression(context, exp, i, errors);
      if (selectorRes.next > i) {
        const selectorBlock = new env.SelectorExpression();
        selectorBlock.Source = current;
        selectorBlock.Selector = selectorRes.block;
        selectorBlock.Pos = current.Pos;
        selectorBlock.Length = selectorRes.block.Pos + selectorRes.block.Length - selectorBlock.Pos;
        current = selectorBlock;
        i = skipSpace(exp, selectorRes.next);
        continue;
      }

      break;
    }

    return { next: i, block: current };
  }

  return {
    getFunctionCallParametersList,
    getCallAndMemberAccess
  };
};
