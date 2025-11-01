module.exports = function createInfixParser(env) {
  const { LiteralBlock } = env;
  const { skipSpace, getLiteralMatch, OPERATOR_SYMBOLS, getIdentifier } = env.utils;

  const getBlockRange = (block) => {
    if (!block || typeof block !== 'object') {
      return null;
    }
    const start = Number.isFinite(block.Pos) ? block.Pos : Number.isFinite(block.position) ? block.position : null;
    const length = Number.isFinite(block.Length)
      ? block.Length
      : Number.isFinite(block.length)
        ? block.length
        : null;
    if (start === null || length === null) {
      return null;
    }
    return { start, end: start + length };
  };

  function getOperator(context, candidates, exp, index) {
    for (const op of candidates) {
      const i = getLiteralMatch(exp, index, op);
      if (i > index) {
        const node = new env.ParseNode(env.ParseNodeType.Operator, index, i - index);
        return { next: i, symbol: op, node };
      }
    }
    return { next: index, symbol: null, node: null };
  }

  function interleaveOperandOperatorNodes(operandNodes, operatorNodes) {
    const children = [];
    let firstChild = null;
    let lastChild = null;

    for (let idx = 0; idx < operandNodes.length; idx += 1) {
      const operandNode = operandNodes[idx];
      if (operandNode) {
        children.push(operandNode);
        if (!firstChild) firstChild = operandNode;
        lastChild = operandNode;
      }
      if (idx < operatorNodes.length) {
        const operatorNode = operatorNodes[idx];
        if (operatorNode) {
          children.push(operatorNode);
          if (!firstChild) firstChild = operatorNode;
          lastChild = operatorNode;
        }
      }
    }

    let span = { start: 0, length: 0 };
    if (firstChild && lastChild) {
      const start = firstChild.Pos;
      const end = lastChild.Pos + lastChild.Length;
      span = { start, length: Math.max(0, end - start) };
    }

    return { children, span };
  }

  function getInfixExpressionSingleLevel(context, level, candidates, exp, index, errors) {
    let i = index;
    let prog = null;
    let progNode = null;

    while (true) {
      if (!prog) {
        const res = level === 0
          ? env.getPrefixOrCall(context, exp, i, errors)
          : getInfixExpressionSingleLevel(context, level - 1, OPERATOR_SYMBOLS[level - 1], exp, i, errors);
        if (!res.block) {
          return { next: index, block: null, node: null };
        }
        prog = res.block;
        progNode = res.node;
        i = skipSpace(exp, res.next);
        continue;
      }

      const operatorStart = i;
      const operatorRes = getOperator(context, candidates, exp, operatorStart);
      if (operatorRes.next === i) {
        break;
      }
      const symbol = operatorRes.symbol;
      i = skipSpace(exp, operatorRes.next);

      const operands = [prog];
      const operandNodes = [progNode];
      const operatorNodes = [];
      if (operatorRes.node) {
        operatorNodes.push(operatorRes.node);
      }

      while (true) {
        const operandRes = level === 0
          ? env.getPrefixOrCall(context, exp, i, errors)
          : getInfixExpressionSingleLevel(context, level - 1, OPERATOR_SYMBOLS[level - 1], exp, i, errors);
        if (!operandRes.block) {
          return { next: index, block: null, node: null };
        }
        operands.push(operandRes.block);
        operandNodes.push(operandRes.node);
        i = skipSpace(exp, operandRes.next);

        const repeat = getLiteralMatch(exp, i, symbol);
        if (repeat === i) {
          break;
        }
        if (repeat > i) {
          operatorNodes.push(new env.ParseNode(env.ParseNodeType.Operator, i, repeat - i));
        }
        i = skipSpace(exp, repeat);
      }

      if (operands.length <= 1) {
        break;
      }

      const firstOperand = operands[0];
      const lastOperand = operands[operands.length - 1];
      const firstRange = getBlockRange(firstOperand) ?? { start: operatorStart, end: operatorStart };
      const lastRange = getBlockRange(lastOperand) ?? firstRange;
      const startPos = firstRange.start;
      const endPos = Math.max(startPos, lastRange.end);
      const spanLength = Math.max(0, endPos - startPos);

      if (symbol === '|') {
        const listExpr = new env.ListExpression();
        listExpr.ValueExpressions = operands;
        listExpr.Pos = startPos;
        listExpr.Length = spanLength;
        prog = listExpr;
      } else {
        const funcValue = context.get(symbol);
        const funcLiteral = new LiteralBlock(funcValue, operatorRes.node?.Pos ?? operatorStart, operatorRes.node?.Length ?? 0);
        const call = new env.FunctionCallExpression(funcLiteral, operands, startPos, spanLength);
        call.Pos = startPos;
        call.Length = spanLength;
        prog = call;
      }

      const { children, span } = interleaveOperandOperatorNodes(operandNodes, operatorNodes);
      progNode = new env.ParseNode(env.ParseNodeType.InfixExpression, span.start, span.length, children);
    }

    return { next: i, block: prog, node: progNode };
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

  function buildGeneralInfixNode(children, fallbackStart, fallbackEnd) {
    const filtered = children.filter(Boolean);

    let start = Number.isFinite(fallbackStart) ? fallbackStart : 0;
    let end = Number.isFinite(fallbackEnd) ? fallbackEnd : start;

    if (filtered.length) {
      const first = filtered[0];
      const last = filtered[filtered.length - 1];
      const firstPos = Number.isFinite(first?.Pos) ? first.Pos : start;
      const lastEnd = Number.isFinite(last?.Pos) && Number.isFinite(last?.Length)
        ? last.Pos + last.Length
        : end;
      start = firstPos;
      end = Math.max(start, lastEnd);
    } else {
      end = Math.max(start, end);
    }

    const length = Math.max(0, end - start);
    const node = filtered.length
      ? new env.ParseNode(env.ParseNodeType.GeneralInfixExpression, start, length, filtered)
      : null;

    return { node, span: { start, end, length } };
  }

  function getGeneralInfixFunctionCall(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const firstRes = env.getCallAndMemberAccess(context, exp, i, errors);
    if (!firstRes.block) {
      return { next: index, block: null, node: null };
    }

    let currentIndex = skipSpace(exp, firstRes.next);

    const fallbackResult = {
      next: currentIndex,
      block: firstRes.block,
      node: firstRes.node
    };

    const idRes = getIdentifier(exp, currentIndex);
    if (idRes.next === currentIndex) {
      return fallbackResult;
    }

    const fnTyped = context.get(idRes.identifierLower || idRes.identifier);
    if (!fnTyped) {
      errors.push({ position: currentIndex, message: 'A function expected' });
      return { next: index, block: null, node: null };
    }

    const funcValue = env.ensureTyped(fnTyped);
    if (env.typeOf(funcValue) !== env.FSDataType.Function) {
      errors.push({ position: currentIndex, message: 'A function expected' });
      return { next: index, block: null, node: null };
    }

    const funcObject = env.valueOf(funcValue);
    if (funcObject.callType !== env.CallType.Dual) {
      return fallbackResult;
    }

    const operands = [firstRes.block];
    const childNodes = [];
    if (firstRes.node) {
      childNodes.push(firstRes.node);
    }
    if (idRes.node) {
      childNodes.push(idRes.node);
    }

    currentIndex = skipSpace(exp, idRes.next);

    const secondRes = env.getCallAndMemberAccess(context, exp, currentIndex, errors);
    if (!secondRes.block) {
      errors.push({ position: currentIndex, message: `Right side operand expected for ${idRes.identifier}` });
      return { next: index, block: null, node: null };
    }

    operands.push(secondRes.block);
    if (secondRes.node) {
      childNodes.push(secondRes.node);
    }
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
      if (moreRes.node) {
        childNodes.push(moreRes.node);
      }
      currentIndex = skipSpace(exp, moreRes.next);
    }

    if (operands.length < 2) {
      return fallbackResult;
    }

    const firstRange = getBlockRange(operands[0]);
    const lastRange = getBlockRange(operands[operands.length - 1]) || firstRange;
    const fallbackStart = firstRange?.start ?? operands[0]?.Pos ?? index;
    const fallbackEnd = lastRange?.end ?? fallbackStart;

    const { node, span } = buildGeneralInfixNode(childNodes, fallbackStart, fallbackEnd);

    const operatorPos = Number.isFinite(idRes.node?.Pos) ? idRes.node.Pos : span.start;
    const operatorLength = Number.isFinite(idRes.node?.Length) ? idRes.node.Length : 0;
    const literalFunc = new LiteralBlock(env.makeValue(env.FSDataType.Function, funcObject), operatorPos, operatorLength);

    const call = new env.FunctionCallExpression(literalFunc, operands, span.start, span.length);

    return { next: currentIndex, block: call, node };
  }

  return {
    getInfixExpression,
    getInfixExpressionSingleLevel,
    getPrefixOrCall,
    getGeneralInfixFunctionCall
  };
};
