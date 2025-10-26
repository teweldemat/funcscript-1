module.exports = function createCallAndMemberParser(env) {
  const { FunctionCallExpression } = env;
  const { skipSpace, getLiteralMatch } = env.utils;

  function parseParameterList(context, current, exp, index, errors, openSymbol, closeSymbol) {
    let i = skipSpace(exp, index);
    const open = getLiteralMatch(exp, i, openSymbol);
    if (open === i) {
      return { next: index, block: null, node: null };
    }
    i = skipSpace(exp, open);

    const parameters = [];
    const parameterNodes = [];
    let hasParameters = false;

    while (true) {
      const paramRes = env.getExpression(context, exp, i, errors);
      if (!paramRes.block) {
        break;
      }
      hasParameters = true;
      parameters.push(paramRes.block);
      if (paramRes.node) {
        parameterNodes.push(paramRes.node);
      }
      i = skipSpace(exp, paramRes.next);
      const separator = getLiteralMatch(exp, i, ',');
      if (separator === i) {
        break;
      }
      i = skipSpace(exp, separator);
    }

    const closeIndex = skipSpace(exp, i);
    const close = getLiteralMatch(exp, closeIndex, closeSymbol);
    if (close === closeIndex) {
      if (hasParameters) {
        errors.push({ position: closeIndex, message: "'" + closeSymbol + "' expected" });
        return { next: index, block: null, node: null };
      }
      // empty parameter list
      const end = getLiteralMatch(exp, i, closeSymbol);
      if (end === i) {
        errors.push({ position: i, message: "'" + closeSymbol + "' expected" });
        return { next: index, block: null, node: null };
      }
      const nextIndex = skipSpace(exp, end);
      const call = new FunctionCallExpression(current, []);
      call.Pos = current.Pos;
      call.Length = nextIndex - current.Pos;
      const node = new env.ParseNode(env.ParseNodeType.FunctionParameterList, index, nextIndex - index, []);
      return { next: nextIndex, block: call, node };
    }

    const nextIndex = skipSpace(exp, close);
    const call = new FunctionCallExpression(current, parameters);
    call.Pos = current.Pos;
    call.Length = nextIndex - current.Pos;
    const node = new env.ParseNode(
      env.ParseNodeType.FunctionParameterList,
      index,
      nextIndex - index,
      parameterNodes
    );
    return { next: nextIndex, block: call, node };
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
        return { next: index, block: null, node: null };
      }
    }

    const operatorStart = i;
    i = skipSpace(exp, next);
    const idRes = env.utils.getIdentifier(exp, i);
    if (idRes.next === i) {
      errors.push({ position: i, message: 'member identifier expected' });
      return { next: index, block: null, node: null };
    }

    const funcTyped = context.get(symbol.toLowerCase());
    if (!funcTyped) {
      errors.push({ position: index, message: `Operator ${symbol} not defined` });
      return { next: index, block: null, node: null };
    }
    const funcValue = env.ensureTyped(funcTyped);
    if (env.typeOf(funcValue) !== env.FSDataType.Function) {
      errors.push({ position: index, message: `Operator ${symbol} not callable` });
      return { next: index, block: null, node: null };
    }

    const funcLiteral = new env.LiteralBlock(funcValue, operatorStart, next - operatorStart);
    const keyLiteral = new env.LiteralBlock(env.makeValue(env.FSDataType.String, idRes.identifier), i, idRes.next - i);
    const call = new env.FunctionCallExpression(funcLiteral, [current, keyLiteral], current.Pos, idRes.next - current.Pos);
    call.Pos = current.Pos;
    call.Length = idRes.next - current.Pos;

    return { next: skipSpace(exp, idRes.next), block: call, node: idRes.node };
  }

  function getCallAndMemberAccess(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const unitRes = env.getUnit(context, exp, i, errors);
    if (!unitRes.block) {
      return { next: index, block: null, node: null };
    }
    let currentBlock = unitRes.block;
    let currentNode = unitRes.node;
    i = skipSpace(exp, unitRes.next);

    while (true) {
      const callRes = getFunctionCallParametersList(context, currentBlock, exp, i, errors);
      if (callRes.next > i) {
        currentBlock = callRes.block;
        const children = [];
        if (currentNode) children.push(currentNode);
        if (callRes.node) children.push(callRes.node);
        currentNode = new env.ParseNode(
          env.ParseNodeType.FunctionCall,
          index,
          callRes.next - index,
          children
        );
        i = skipSpace(exp, callRes.next);
        continue;
      }

      const memberRes = parseMemberAccess(context, currentBlock, exp, i, errors);
      if (memberRes.next > i) {
        currentBlock = memberRes.block;
        const children = [];
        if (currentNode) children.push(currentNode);
        if (memberRes.node) children.push(memberRes.node);
        currentNode = new env.ParseNode(
          env.ParseNodeType.MemberAccess,
          index,
          memberRes.next - index,
          children
        );
        i = memberRes.next;
        continue;
      }

      const selectorRes = env.getKvcExpression(context, exp, i, errors);
      if (selectorRes && selectorRes.next > i) {
        const selectorBlock = new env.SelectorExpression();
        selectorBlock.Source = currentBlock;
        selectorBlock.Selector = selectorRes.block;
        selectorBlock.Pos = currentBlock.Pos;
        selectorBlock.Length = selectorRes.next - currentBlock.Pos;
        currentBlock = selectorBlock;
        const children = [];
        if (currentNode) children.push(currentNode);
        if (selectorRes.node) children.push(selectorRes.node);
        currentNode = new env.ParseNode(
          env.ParseNodeType.Selection,
          index,
          selectorRes.next - index,
          children
        );
        i = skipSpace(exp, selectorRes.next);
        continue;
      }

      break;
    }

    return { next: i, block: currentBlock, node: currentNode };
  }

  return {
    getFunctionCallParametersList,
    getCallAndMemberAccess
  };
};
