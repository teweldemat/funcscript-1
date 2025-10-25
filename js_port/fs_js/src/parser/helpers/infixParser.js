module.exports = function createInfixParser(env) {
  const { LiteralBlock } = env;
  const { skipSpace, getLiteralMatch, OPERATOR_SYMBOLS } = env.utils;

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
          res = env.getCallAndMemberAccess(context, exp, i, errors);
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
          operandRes = env.getCallAndMemberAccess(context, exp, i, errors);
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

  function getExpression(context, exp, index, errors) {
    const infix = getInfixExpression(context, exp, index, errors);
    if (infix.block) {
      return infix;
    }
    return { next: index, block: null };
  }

  return {
    getExpression
  };
};
