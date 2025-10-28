module.exports = function createCallAndMemberParser(env) {
  const { FunctionCallExpression } = env;
  const { skipSpace, getLiteralMatch } = env.utils;

  function parseParameterList(context, current, exp, index, errors, openSymbol, closeSymbol) {
    let i = skipSpace(exp, index);
    const open = getLiteralMatch(exp, i, openSymbol);
    if (open === i) {
      return { next: index, block: null, node: null };
    }

    i = open;
    const parameters = [];
    const parameterNodes = [];

    i = skipSpace(exp, i);
    let exprRes = env.getExpression(context, exp, i, errors);
    if (exprRes.block) {
      i = exprRes.next;
      parameters.push(exprRes.block);
      if (exprRes.node) {
        parameterNodes.push(exprRes.node);
      }

      while (true) {
        const commaPos = skipSpace(exp, i);
        if (commaPos >= exp.length || exp[commaPos] !== ',') {
          break;
        }
        i = commaPos + 1;
        i = skipSpace(exp, i);
        exprRes = env.getExpression(context, exp, i, errors);
        if (!exprRes.block) {
          errors.push({ position: i, message: 'Parameter for call expected' });
          return { next: index, block: null, node: null };
        }
        i = exprRes.next;
        parameters.push(exprRes.block);
        if (exprRes.node) {
          parameterNodes.push(exprRes.node);
        }
      }
    }

    i = skipSpace(exp, i);
    const close = getLiteralMatch(exp, i, closeSymbol);
    if (close === i) {
      errors.push({ position: i, message: "'" + closeSymbol + "' expected" });
      return { next: index, block: null, node: null };
    }

    i = close;
    const call = new FunctionCallExpression(current, parameters);
    call.Pos = current.Pos;
    call.Length = i - current.Pos;
    const node = new env.ParseNode(env.ParseNodeType.FunctionParameterList, index, i - index, parameterNodes);
    return { next: i, block: call, node };
  }

  function getFunctionCallParametersList(context, current, exp, index, errors) {
    const parenRes = parseParameterList(context, current, exp, index, errors, '(', ')');
    if (parenRes.next > index) {
      return parenRes;
    }
    return parseParameterList(context, current, exp, index, errors, '[', ']');
  }

  function parseMemberAccess(context, current, exp, index, errors) {
    const dotRes = parseMemberAccessWith(context, current, exp, index, errors, '.');
    if (dotRes.next > index) {
      return dotRes;
    }
    return parseMemberAccessWith(context, current, exp, index, errors, '?.');
  }

  function parseMemberAccessWith(context, current, exp, index, errors, symbol) {
    let i = skipSpace(exp, index);
    const matched = getLiteralMatch(exp, i, symbol);
    if (matched === i) {
      return { next: index, block: null, node: null };
    }

    const operatorStart = i;
    i = skipSpace(exp, matched);
    const idRes = env.utils.getIdentifier(exp, i);
    if (idRes.next === i) {
      errors.push({ position: i, message: 'member identifier expected' });
      return { next: index, block: null, node: null };
    }

    const funcTyped = context.get(symbol);
    if (!funcTyped) {
      errors.push({ position: operatorStart, message: `Operator ${symbol} not defined` });
      return { next: index, block: null, node: null };
    }

    const funcLiteral = new env.LiteralBlock(funcTyped, operatorStart, matched - operatorStart);
    const keyLiteral = new env.LiteralBlock(env.makeValue(env.FSDataType.String, idRes.identifier), i, idRes.next - i);
    const call = new FunctionCallExpression(funcLiteral, [current, keyLiteral]);
    call.Pos = current.Pos;
    call.Length = idRes.next - current.Pos;

    return { next: idRes.next, block: call, node: idRes.node };
  }

  function getCallAndMemberAccess(context, exp, index, errors) {
    const start = skipSpace(exp, index);
    const unitRes = env.getUnit(context, exp, start, errors);
    if (!unitRes.block) {
      return { next: index, block: null, node: null };
    }

    let currentBlock = unitRes.block;
    let currentNode = unitRes.node;
    let i = unitRes.next;

    while (true) {
      const callRes = getFunctionCallParametersList(context, currentBlock, exp, i, errors);
      if (callRes.next > i) {
        currentBlock = callRes.block;
        const children = [];
        if (currentNode) {
          children.push(currentNode);
        }
        if (callRes.node) {
          children.push(callRes.node);
        }
        currentNode = new env.ParseNode(env.ParseNodeType.FunctionCall, index, callRes.next - index, children);
        i = callRes.next;
        continue;
      }

      const memberRes = parseMemberAccess(context, currentBlock, exp, i, errors);
      if (memberRes.next > i) {
        currentBlock = memberRes.block;
        const children = [];
        if (currentNode) {
          children.push(currentNode);
        }
        if (memberRes.node) {
          children.push(memberRes.node);
        }
        currentNode = new env.ParseNode(env.ParseNodeType.MemberAccess, index, memberRes.next - index, children);
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
        if (currentNode) {
          children.push(currentNode);
        }
        if (selectorRes.node) {
          children.push(selectorRes.node);
        }
        currentNode = new env.ParseNode(env.ParseNodeType.Selection, index, selectorRes.next - index, children);
        i = selectorRes.next;
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
