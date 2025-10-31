module.exports = function createUnitParser(env) {
  const { LiteralBlock, ReferenceBlock, FunctionCallExpression } = env;
  const {
    skipSpace,
    getSimpleString,
    getNumber,
    getKeyWordLiteral,
    getIdentifier
  } = env.utils;

  function getStringTemplate(context, exp, index, errors) {
    const start = skipSpace(exp, index);
    let i = env.utils.getLiteralMatch(exp, start, 'f"');
    let delimiter = '"';
    if (i === start) {
      i = env.utils.getLiteralMatch(exp, start, "f'");
      delimiter = '\'';
    }
    if (i === start) {
      return { next: index, block: null, node: null };
    }

    const parts = [];
    const nodeParts = [];
    let textBuffer = '';
    let segmentStart = i;
    let current = i;

    function flushText() {
      if (!textBuffer) {
        return;
      }
      const literal = new LiteralBlock(env.makeValue(env.FSDataType.String, textBuffer));
      literal.Pos = segmentStart;
      literal.Length = current - segmentStart;
      parts.push(literal);
      nodeParts.push(new env.ParseNode(env.ParseNodeType.LiteralString, segmentStart, current - segmentStart));
      textBuffer = '';
    }

    while (current < exp.length) {
      const ch = exp[current];
      if (ch === '\\') {
        if (current + 1 >= exp.length) {
          errors.push({ position: current, message: 'Unterminated string literal' });
          return { next: index, block: null, node: null };
        }
        const nextChar = exp[current + 1];
        if (nextChar === 'n') textBuffer += '\n';
        else if (nextChar === 't') textBuffer += '\t';
        else if (nextChar === '{') textBuffer += '{';
        else if (nextChar === '\\') textBuffer += '\\';
        else if (nextChar === delimiter) textBuffer += delimiter;
        else textBuffer += nextChar;
        current += 2;
        continue;
      }

      if (ch === '{') {
        if (current + 1 < exp.length && exp[current + 1] === '{') {
          textBuffer += '{';
          current += 2;
          continue;
        }
        flushText();
        current += 1;
        current = skipSpace(exp, current);
        const exprRes = env.getExpression(context, exp, current, errors);
        if (!exprRes.block) {
          errors.push({ position: current, message: 'expression expected' });
          return { next: index, block: null, node: null };
        }
        parts.push(exprRes.block);
        if (exprRes.node) {
          nodeParts.push(exprRes.node);
        }
        current = skipSpace(exp, exprRes.next);
        const close = env.utils.getLiteralMatch(exp, current, '}');
        if (close === current) {
          errors.push({ position: current, message: "'}' expected" });
          return { next: index, block: null, node: null };
        }
        current = close;
        segmentStart = current;
        continue;
      }

      if (ch === delimiter) {
        break;
      }

      textBuffer += ch;
      current += 1;
    }

    flushText();

    if (current >= exp.length) {
      errors.push({ position: current, message: `"${delimiter}" expected` });
      return { next: index, block: null, node: null };
    }

    const closeDelim = env.utils.getLiteralMatch(exp, current, delimiter);
    if (closeDelim === current) {
      errors.push({ position: current, message: `"${delimiter}" expected` });
      return { next: index, block: null, node: null };
    }

    let block;
    let node;
    if (parts.length === 0) {
      block = new LiteralBlock(env.makeValue(env.FSDataType.String, ''));
      node = new env.ParseNode(env.ParseNodeType.LiteralString, index, closeDelim - index);
    } else if (parts.length === 1) {
      [block] = parts;
      [node] = nodeParts;
      if (!node) {
        node = new env.ParseNode(env.ParseNodeType.LiteralString, index, closeDelim - index);
      }
    } else {
      const fn = new ReferenceBlock('_templatemerge');
      block = new FunctionCallExpression(fn, parts);
      node = new env.ParseNode(env.ParseNodeType.StringTemplate, index, closeDelim - index, nodeParts);
    }

    block.Pos = index;
    block.Length = closeDelim - index;
    return { next: closeDelim, block, node };
  }

  function getExpInParenthesis(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const open = env.utils.getLiteralMatch(exp, i, '(');
    if (open === i) {
      return { next: index, block: null, node: null };
    }
    i = skipSpace(exp, open);
    const exprRes = env.getExpression(context, exp, i, errors);
    let block = exprRes.block;
    let childNode = exprRes.node;
    let nextIndex = exprRes.next;
    if (!block) {
      block = new LiteralBlock(env.typedNull());
      childNode = null;
      nextIndex = i;
    }
    i = skipSpace(exp, nextIndex);
    const close = env.utils.getLiteralMatch(exp, i, ')');
    if (close === i) {
      errors.push({ position: i, message: "')' expected" });
      return { next: index, block: null, node: null };
    }
    block.Pos = index;
    block.Length = close - index;
    const children = childNode ? [childNode] : [];
    const node = new env.ParseNode(env.ParseNodeType.ExpressionInBrace, index, close - index, children);
    return { next: close, block, node };
  }

  function getUnit(context, exp, index, errors) {
    let i = skipSpace(exp, index);

    const templateRes = getStringTemplate(context, exp, index, errors);
    if (templateRes.block) {
      return templateRes;
    }

    const strRes = getSimpleString(exp, i, errors);
    if (strRes.next > i) {
      const block = new LiteralBlock(strRes.value);
      block.Pos = index;
      block.Length = strRes.next - index;
      return { next: strRes.next, block, node: strRes.node };
    }

    const numRes = getNumber(exp, i, errors);
    if (numRes.next > i) {
      const block = new LiteralBlock(numRes.value);
      block.Pos = index;
      block.Length = numRes.next - index;
      return { next: numRes.next, block, node: numRes.node };
    }

    const listRes = env.getListExpression(context, exp, i, errors);
    if (listRes && listRes.next > i) {
      const block = listRes.block;
      block.Pos = index;
      block.Length = listRes.next - index;
      return { next: listRes.next, block, node: listRes.node };
    }

    const kvcRes = env.getKvcExpression(context, exp, i, errors);
    if (kvcRes && kvcRes.next > i) {
      const block = kvcRes.block;
      block.Pos = index;
      block.Length = kvcRes.next - index;
      return { next: kvcRes.next, block, node: kvcRes.node };
    }

    if (typeof env.getIfThenElseExpression === 'function') {
      const ifRes = env.getIfThenElseExpression(context, exp, i, errors);
      if (ifRes.block) {
        const block = ifRes.block;
        if (typeof block.Pos !== 'number') {
          block.Pos = index;
        }
        block.Length = ifRes.next - index;
        return { next: ifRes.next, block, node: ifRes.node };
      }
    }

    const switchRes = env.getSwitchExpression(context, exp, i, errors);
    if (switchRes && switchRes.next > i) {
      const block = switchRes.block;
      block.Pos = index;
      block.Length = switchRes.next - index;
      return { next: switchRes.next, block, node: switchRes.node };
    }

    const caseRes = env.getCaseExpression(context, exp, i, errors);
    if (caseRes && caseRes.next > i) {
      const block = caseRes.block;
      block.Pos = index;
      block.Length = caseRes.next - index;
      return { next: caseRes.next, block, node: caseRes.node };
    }

    const lambdaRes = env.getLambdaExpression(context, exp, i, errors);
    if (lambdaRes.next > i && lambdaRes.func) {
      const lambdaBlock = new LiteralBlock(env.makeValue(env.FSDataType.Function, lambdaRes.func));
      lambdaBlock.Pos = index;
      lambdaBlock.Length = lambdaRes.next - index;
      return { next: lambdaRes.next, block: lambdaBlock, node: lambdaRes.node };
    }

    const kwRes = getKeyWordLiteral(exp, i);
    if (kwRes.next > i) {
      const block = new LiteralBlock(kwRes.value);
      block.Pos = index;
      block.Length = kwRes.next - index;
      return { next: kwRes.next, block, node: kwRes.node };
    }

    const idRes = getIdentifier(exp, i);
    if (idRes.next > i) {
      const block = new ReferenceBlock(idRes.identifier);
      block.Pos = index;
      block.Length = idRes.next - index;
      return { next: idRes.next, block, node: idRes.node };
    }

    const parenRes = getExpInParenthesis(context, exp, i, errors);
    if (parenRes.block) {
      const block = parenRes.block;
      block.Pos = index;
      block.Length = parenRes.next - index;
      return { next: parenRes.next, block, node: parenRes.node };
    }

    return { next: index, block: null, node: null };
  }

  return {
    getUnit,
    getExpInParenthesis
  };
};
