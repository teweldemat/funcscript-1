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
      return { next: index, block: null };
    }

    const parts = [];
    let textBuffer = '';

    function flushText() {
      if (!textBuffer) {
        return;
      }
      const literal = new LiteralBlock(env.makeValue(env.FSDataType.String, textBuffer));
      parts.push(literal);
      textBuffer = '';
    }

    let current = i;
    while (current < exp.length) {
      const ch = exp[current];
      if (ch === '\\') {
        if (current + 1 >= exp.length) {
          errors.push({ position: current, message: 'Unterminated string literal' });
          return { next: index, block: null };
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
        flushText();
        current += 1;
        current = skipSpace(exp, current);
        const exprRes = env.getExpression(context, exp, current, errors);
        if (!exprRes.block) {
          errors.push({ position: current, message: 'expression expected' });
          return { next: index, block: null };
        }
        parts.push(exprRes.block);
        current = skipSpace(exp, exprRes.next);
        const close = env.utils.getLiteralMatch(exp, current, '}');
        if (close === current) {
          errors.push({ position: current, message: "'}' expected" });
          return { next: index, block: null };
        }
        current = close;
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
      return { next: index, block: null };
    }

    const closeDelim = env.utils.getLiteralMatch(exp, current, delimiter);
    if (closeDelim === current) {
      errors.push({ position: current, message: `"${delimiter}" expected` });
      return { next: index, block: null };
    }

    let block;
    if (parts.length === 0) {
      block = new LiteralBlock(env.makeValue(env.FSDataType.String, ''));
    } else if (parts.length === 1) {
      block = parts[0];
    } else {
      const fn = new ReferenceBlock('_templatemerge');
      block = new FunctionCallExpression(fn, parts);
    }

    block.Pos = index;
    block.Length = closeDelim - index;
    return { next: closeDelim, block };
  }

  function getExpInParenthesis(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const open = env.utils.getLiteralMatch(exp, i, '(');
    if (open === i) {
      return { next: index, block: null };
    }
    i = skipSpace(exp, open);
    const exprRes = env.getExpression(context, exp, i, errors);
    let block = exprRes.block;
    let nextIndex = exprRes.next;
    if (!block) {
      block = new LiteralBlock(env.typedNull());
      nextIndex = i;
    }
    i = skipSpace(exp, nextIndex);
    const close = env.utils.getLiteralMatch(exp, i, ')');
    if (close === i) {
      errors.push({ position: i, message: "')' expected" });
      return { next: index, block: null };
    }
    block.Pos = index;
    block.Length = close - index;
    return { next: close, block };
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
      return { next: strRes.next, block };
    }

    const numRes = getNumber(exp, i, errors);
    if (numRes.next > i) {
      const block = new LiteralBlock(numRes.value);
      block.Pos = index;
      block.Length = numRes.next - index;
      return { next: numRes.next, block };
    }

    const listRes = env.getListExpression(context, exp, i, errors);
    if (listRes.next > i) {
      const block = listRes.block;
      block.Pos = index;
      block.Length = listRes.next - index;
      return { next: listRes.next, block };
    }

    const kvcRes = env.getKvcExpression(context, exp, i, errors);
    if (kvcRes.next > i) {
      const block = kvcRes.block;
      block.Pos = index;
      block.Length = kvcRes.next - index;
      return { next: kvcRes.next, block };
    }

    const switchRes = env.getSwitchExpression(context, exp, i, errors);
    if (switchRes.next > i) {
      const block = switchRes.block;
      block.Pos = index;
      block.Length = switchRes.next - index;
      return { next: switchRes.next, block };
    }

    const caseRes = env.getCaseExpression(context, exp, i, errors);
    if (caseRes.next > i) {
      const block = caseRes.block;
      block.Pos = index;
      block.Length = caseRes.next - index;
      return { next: caseRes.next, block };
    }

    const lambdaRes = env.getLambdaExpression(context, exp, i, errors);
    if (lambdaRes.next > i && lambdaRes.func) {
      const lambdaBlock = new LiteralBlock(env.makeValue(env.FSDataType.Function, lambdaRes.func));
      lambdaBlock.Pos = index;
      lambdaBlock.Length = lambdaRes.next - index;
      return { next: lambdaRes.next, block: lambdaBlock };
    }

    const kwRes = getKeyWordLiteral(exp, i);
    if (kwRes.next > i) {
      const block = new LiteralBlock(kwRes.value);
      block.Pos = index;
      block.Length = kwRes.next - index;
      return { next: kwRes.next, block };
    }

    const idRes = getIdentifier(exp, i);
    if (idRes.next > i) {
      const block = new ReferenceBlock(idRes.identifier);
      block.Pos = index;
      block.Length = idRes.next - index;
      return { next: idRes.next, block };
    }

    const parenRes = getExpInParenthesis(context, exp, i, errors);
    if (parenRes.next > i) {
      const block = parenRes.block;
      block.Pos = index;
      block.Length = parenRes.next - index;
      return { next: parenRes.next, block };
    }

    return { next: index, block: null };
  }

  return {
    getUnit,
    getExpInParenthesis
  };
};
