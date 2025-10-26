module.exports = function createInfixParser(env) {
  const { LiteralBlock } = env;
  const { skipSpace, getLiteralMatch, OPERATOR_SYMBOLS, getIdentifier } = env.utils;

  function getOperator(context, candidates, exp, index) {
    for (const op of candidates) {
      const i = getLiteralMatch(exp, index, op);
      if (i > index) {
        const typedValue = context.get(op.toLowerCase ? op.toLowerCase() : op);
        if (!typedValue) {
          return { next: i, symbol: op, functionValue: null };
        }
        const resolved = env.ensureTyped(typedValue);
        if (env.typeOf(resolved) !== env.FSDataType.Function) {
          return { next: i, symbol: op, functionValue: null };
        }
        return { next: i, symbol: op, functionValue: env.valueOf(resolved) };
      }
    }
    return { next: index, symbol: null, functionValue: null };
  }

  function getInfixExpressionSingleLevel(context, level, candidates, exp, index, errors) {
    let i = index;
    let prog = null;

    while (true) {
      if (!prog) {
        let res;
        if (level === 0) {
          res = env.getPrefixOrCall(context, exp, i, errors);
        } else {
          res = getInfixExpressionSingleLevel(context, level - 1, OPERATOR_SYMBOLS[level - 1], exp, i, errors);
        }
        if (!res.block) {
          return { next: index, block: null };
        }
        prog = res.block;
        i = skipSpace(exp, res.next);
        continue;
      }

      const operatorRes = getOperator(context, candidates, exp, i);
      if (operatorRes.next === i || !operatorRes.functionValue) {
        break;
      }
      const symbol = operatorRes.symbol;
      const func = operatorRes.functionValue;
      i = skipSpace(exp, operatorRes.next);

      const operands = [prog];
      while (true) {
        let operandRes;
        if (level === 0) {
          operandRes = env.getPrefixOrCall(context, exp, i, errors);
        } else {
          operandRes = getInfixExpressionSingleLevel(context, level - 1, OPERATOR_SYMBOLS[level - 1], exp, i, errors);
        }
        if (!operandRes.block) {
          errors.push({ position: i, message: `Operand expected for operator ${symbol}` });
          return { next: index, block: null };
        }
        operands.push(operandRes.block);
        i = skipSpace(exp, operandRes.next);
        const repeat = getLiteralMatch(exp, i, symbol);
        if (repeat === i) {
          break;
        }
        i = skipSpace(exp, repeat);
      }

      const funcLiteral = new LiteralBlock(env.makeValue(env.FSDataType.Function, func));
      const call = new env.FunctionCallExpression(funcLiteral, operands);
      call.Pos = operands[0].Pos;
      const last = operands[operands.length - 1];
      call.Length = (last.Pos + last.Length) - call.Pos;
      prog = call;
    }

    return { next: i, block: prog };
  }

  function getPrefixOrCall(context, exp, index, errors) {
    const prefix = env.getPrefixOperator(context, exp, index, errors);
    if (prefix.block) {
      return prefix;
    }
    const general = getGeneralInfixFunctionCall(context, exp, index, errors);
    if (general.block) {
      return general;
    }
    return env.getCallAndMemberAccess(context, exp, index, errors);
  }

  function getInfixExpression(context, exp, index, errors) {
    return getInfixExpressionSingleLevel(
      context,
      OPERATOR_SYMBOLS.length - 1,
      OPERATOR_SYMBOLS[OPERATOR_SYMBOLS.length - 1],
      exp,
      index,
      errors
    );
  }

  function getGeneralInfixFunctionCall(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const firstRes = env.getCallAndMemberAccess(context, exp, i, errors);
    if (!firstRes.block) {
      return { next: index, block: null };
    }

    let currentIndex = skipSpace(exp, firstRes.next);

    const idRes = getIdentifier(exp, currentIndex);
    if (idRes.next === currentIndex) {
      return { next: index, block: null };
    }

    const fnTyped = context.get(idRes.identifierLower || idRes.identifier);
    if (!fnTyped) {
      errors.push({ position: currentIndex, message: 'A function expected' });
      return { next: index, block: null };
    }

    const funcValue = env.ensureTyped(fnTyped);
    if (env.typeOf(funcValue) !== env.FSDataType.Function) {
      errors.push({ position: currentIndex, message: 'A function expected' });
      return { next: index, block: null };
    }

    const funcObject = env.valueOf(funcValue);
    if (funcObject.callType !== env.CallType.Dual) {
      return { next: index, block: null };
    }

    const operands = [firstRes.block];
    currentIndex = skipSpace(exp, idRes.next);

    const secondRes = env.getCallAndMemberAccess(context, exp, currentIndex, errors);
    if (!secondRes.block) {
      errors.push({ position: currentIndex, message: `Right side operand expected for ${idRes.identifier}` });
      return { next: index, block: null };
    }

    operands.push(secondRes.block);
    currentIndex = skipSpace(exp, secondRes.next);

    while (true) {
      const nextTilde = getLiteralMatch(exp, currentIndex, '~');
      if (nextTilde === currentIndex) {
        break;
      }
      currentIndex = skipSpace(exp, nextTilde);
      const moreRes = env.getInfixExpression(context, exp, currentIndex, errors);
      if (!moreRes.block) {
        break;
      }
      operands.push(moreRes.block);
      currentIndex = skipSpace(exp, moreRes.next);
    }

    if (operands.length < 2) {
      return { next: index, block: null };
    }

    const literalFunc = new LiteralBlock(env.makeValue(env.FSDataType.Function, funcObject));
    const call = new env.FunctionCallExpression(literalFunc, operands);
    call.Pos = operands[0].Pos;
    const last = operands[operands.length - 1];
    call.Length = (last.Pos + last.Length) - call.Pos;

    return { next: currentIndex, block: call };
  }

  return {
    getInfixExpression,
    getInfixExpressionSingleLevel,
    getPrefixOrCall,
    getGeneralInfixFunctionCall
  };
};
