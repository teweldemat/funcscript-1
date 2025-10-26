module.exports = function createCallAndMemberParser(env) {
  const { FunctionCallExpression } = env;
  const { skipSpace, getLiteralMatch } = env.utils;

  function parseParameterList(context, current, exp, index, errors, openSymbol, closeSymbol) {
    let i = skipSpace(exp, index);
    const open = getLiteralMatch(exp, i, openSymbol);
    if (open === i) {
      return { next: index, block: null };
    }
    i = skipSpace(exp, open);

    const parameters = [];
    let hasParameters = true;
    const immediateClose = getLiteralMatch(exp, i, closeSymbol);
    if (immediateClose > i) {
      hasParameters = false;
      i = immediateClose;
    } else {
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
    }

    let closeIndex = i;
    if (hasParameters) {
      closeIndex = getLiteralMatch(exp, i, closeSymbol);
      if (closeIndex === i) {
        errors.push({ position: i, message: "'" + closeSymbol + "' expected" });
        return { next: index, block: null };
      }
    }

    const call = new FunctionCallExpression(current, parameters);
    call.Pos = current.Pos;
    const nextIndex = skipSpace(exp, closeIndex);
    call.Length = nextIndex - current.Pos;
    return { next: nextIndex, block: call };
  }

  function getFunctionCallParametersList(context, current, exp, index, errors) {
    const parenRes = parseParameterList(context, current, exp, index, errors, '(', ')');
    if (parenRes.next > index) {
      return parenRes;
    }
    return parseParameterList(context, current, exp, index, errors, '[', ']');
  }

  function parseMemberAccess(context, current, exp, index, errors) {
    let i = skipSpace(exp, index);
    let symbol = null;
    let next = getLiteralMatch(exp, i, '.');
    if (next > i) {
      symbol = '.';
    } else {
      next = getLiteralMatch(exp, i, '?.');
      if (next > i) {
        symbol = '?.';
      } else {
        return { next: index, block: null };
      }
    }

    i = skipSpace(exp, next);
    const idRes = env.utils.getIdentifier(exp, i);
    if (idRes.next === i) {
      errors.push({ position: i, message: 'member identifier expected' });
      return { next: index, block: null };
    }

    const funcTyped = context.get(symbol.toLowerCase());
    if (!funcTyped) {
      errors.push({ position: index, message: `Operator ${symbol} not defined` });
      return { next: index, block: null };
    }
    const funcValue = env.ensureTyped(funcTyped);
    if (env.typeOf(funcValue) !== env.FSDataType.Function) {
      errors.push({ position: index, message: `Operator ${symbol} not callable` });
      return { next: index, block: null };
    }

    const funcLiteral = new env.LiteralBlock(funcValue, current.Pos, 0);
    const keyLiteral = new env.LiteralBlock(env.makeValue(env.FSDataType.String, idRes.identifier), i, 0);
    const call = new env.FunctionCallExpression(funcLiteral, [current, keyLiteral], current.Pos, 0);
    call.Length = idRes.next - current.Pos;

    return { next: skipSpace(exp, idRes.next), block: call };
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

      const memberRes = parseMemberAccess(context, current, exp, i, errors);
      if (memberRes.next > i) {
        current = memberRes.block;
        i = memberRes.next;
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
