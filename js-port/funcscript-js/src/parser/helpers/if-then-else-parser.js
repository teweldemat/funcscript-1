module.exports = function createIfThenElseParser(env) {
  const { FunctionCallExpression, ReferenceBlock, ParseNode, ParseNodeType } = env;
  const {
    skipSpace,
    getLiteralMatch,
    isIdentifierOtherChar,
    isCharWhiteSpace
  } = env.utils;

  function getIfThenElseExpression(context, exp, index, errors) {
    if (index >= exp.length) {
      return { next: index, block: null, node: null };
    }

    const afterIf = getLiteralMatch(exp, index, 'if');
    if (afterIf === index) {
      return { next: index, block: null, node: null };
    }

    if (afterIf < exp.length && isIdentifierOtherChar(exp[afterIf])) {
      return { next: index, block: null, node: null };
    }

    if (afterIf < exp.length && !isCharWhiteSpace(exp[afterIf])) {
      return { next: index, block: null, node: null };
    }

    const conditionStart = skipSpace(exp, afterIf);
    if (conditionStart >= exp.length) {
      return { next: index, block: null, node: null };
    }

    const segments = trySplitSegments(exp, conditionStart);
    if (!segments) {
      return { next: index, block: null, node: null };
    }

    const { conditionSegment, trueSegment, falseStart, thenIndex, elseIndex } = segments;

    const conditionRes = parseSegment(
      context,
      exp,
      conditionSegment.start,
      conditionSegment.end,
      thenIndex,
      errors
    );
    if (!conditionRes) {
      return { next: index, block: null, node: null };
    }

    const trueRes = parseSegment(
      context,
      exp,
      trueSegment.start,
      trueSegment.end,
      elseIndex,
      errors
    );
    if (!trueRes) {
      return { next: index, block: null, node: null };
    }

    const falseErrors = [];
    const falseRes = env.getExpression(context, exp, falseStart, falseErrors);
    if (!falseRes.block || falseErrors.length) {
      addErrors(errors, falseErrors);
      return { next: index, block: null, node: null };
    }

    const end = falseRes.next;

    const functionBlock = new ReferenceBlock('if', index, afterIf - index);
    const callExpr = new FunctionCallExpression(functionBlock, [
      conditionRes.block,
      trueRes.block,
      falseRes.block
    ], index, end - index);

    const identifierNode = new ParseNode(ParseNodeType.Identifier, index, afterIf - index);

    const parameterChildren = [];
    if (conditionRes.node) parameterChildren.push(conditionRes.node);
    parameterChildren.push(new ParseNode(ParseNodeType.KeyWord, thenIndex, 4));
    if (trueRes.node) parameterChildren.push(trueRes.node);
    parameterChildren.push(new ParseNode(ParseNodeType.KeyWord, elseIndex, 4));
    if (falseRes.node) parameterChildren.push(falseRes.node);

    const paramsStart = conditionRes.block.Pos ?? conditionSegment.start;
    const paramsEnd = falseRes.block.Pos + falseRes.block.Length;
    const parametersNode = new ParseNode(
      ParseNodeType.FunctionParameterList,
      paramsStart,
      paramsEnd - paramsStart,
      parameterChildren
    );

    const parseNode = new ParseNode(
      ParseNodeType.FunctionCall,
      index,
      end - index,
      [identifierNode, parametersNode]
    );

    if (typeof process !== 'undefined' && process?.env?.DEBUG_IF === 'true') {
      // eslint-disable-next-line no-console
      console.log('[if-parser] returning', { end, keywordNodes: parameterChildren.filter((n) => n.NodeType === 'KeyWord') });
    }

    return {
      next: end,
      block: callExpr,
      node: parseNode
    };
  }

  function parseSegment(context, exp, start, end, boundary, errors) {
    const segmentErrors = [];
    const fragment = exp.slice(start, end);
    const res = parseSubExpression(context, fragment, start, segmentErrors);
    if (!res || !res.block || segmentErrors.length) {
      addErrors(errors, segmentErrors);
      return null;
    }

    const boundaryIndex = skipSpace(exp, res.next);
    if (boundaryIndex !== boundary) {
      return null;
    }

    return res;
  }

  function trySplitSegments(exp, conditionStart) {
    const thenIndex = findKeywordOutside(exp, conditionStart, 'then');
    if (thenIndex < 0) {
      return null;
    }

    const conditionEnd = trimEndExclusive(exp, conditionStart, thenIndex);
    if (conditionEnd <= conditionStart) {
      return null;
    }

    const trueStart = skipSpace(exp, thenIndex + 4);
    if (trueStart >= exp.length) {
      return null;
    }

    const elseIndex = findElseOutside(exp, trueStart);
    if (elseIndex < 0) {
      return null;
    }

    const trueEnd = trimEndExclusive(exp, trueStart, elseIndex);
    if (trueEnd <= trueStart) {
      return null;
    }

    const falseStart = skipSpace(exp, elseIndex + 4);
    if (falseStart > exp.length) {
      return null;
    }

    return {
      conditionSegment: { start: conditionStart, end: conditionEnd },
      trueSegment: { start: trueStart, end: trueEnd },
      falseStart,
      thenIndex,
      elseIndex
    };
  }

  function findKeywordOutside(exp, startIndex, keyword) {
    let depthParen = 0;
    let depthBrace = 0;
    let depthBracket = 0;
    let inString = false;
    let stringDelimiter = '\0';

    for (let i = startIndex; i < exp.length; i += 1) {
      const ch = exp[i];

      if (inString) {
        if (ch === '\\' && stringDelimiter === '"' && i + 1 < exp.length) {
          i += 1;
          continue;
        }
        if (ch === stringDelimiter) {
          inString = false;
        }
        continue;
      }

      if (ch === '"' || ch === '\'') {
        inString = true;
        stringDelimiter = ch;
        continue;
      }

      if (ch === '(') depthParen += 1;
      else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
      else if (ch === '[') depthBracket += 1;
      else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);
      else if (ch === '{') depthBrace += 1;
      else if (ch === '}') depthBrace = Math.max(0, depthBrace - 1);

      if (ch === '/' && i + 1 < exp.length && exp[i + 1] === '/') {
        const newline = exp.indexOf('\n', i + 2);
        if (newline === -1) {
          return -1;
        }
        i = newline;
        continue;
      }

      if (depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
        const matchLength = matchKeywordLength(exp, i, keyword);
        if (matchLength > 0) {
          return i;
        }
        if (matchLength < 0) {
          i = -matchLength - 1;
        }
      }
    }

    return -1;
  }

  function findElseOutside(exp, startIndex) {
    let depthParen = 0;
    let depthBrace = 0;
    let depthBracket = 0;
    let inString = false;
    let stringDelimiter = '\0';
    let nestedIfDepth = 0;

    for (let i = startIndex; i < exp.length; i += 1) {
      const ch = exp[i];

      if (inString) {
        if (ch === '\\' && stringDelimiter === '"' && i + 1 < exp.length) {
          i += 1;
          continue;
        }
        if (ch === stringDelimiter) {
          inString = false;
        }
        continue;
      }

      if (ch === '"' || ch === '\'') {
        inString = true;
        stringDelimiter = ch;
        continue;
      }

      if (ch === '(') depthParen += 1;
      else if (ch === ')') depthParen = Math.max(0, depthParen - 1);
      else if (ch === '[') depthBracket += 1;
      else if (ch === ']') depthBracket = Math.max(0, depthBracket - 1);
      else if (ch === '{') depthBrace += 1;
      else if (ch === '}') depthBrace = Math.max(0, depthBrace - 1);

      if (ch === '/' && i + 1 < exp.length && exp[i + 1] === '/') {
        const newline = exp.indexOf('\n', i + 2);
        if (newline === -1) {
          return -1;
        }
        i = newline;
        continue;
      }

      if (depthParen === 0 && depthBrace === 0 && depthBracket === 0) {
        const ifLength = matchKeywordLength(exp, i, 'if');
        if (ifLength > 0) {
          nestedIfDepth += 1;
          i += ifLength;
          continue;
        }
        if (ifLength < 0) {
          i = -ifLength - 1;
          continue;
        }

        const elseLength = matchKeywordLength(exp, i, 'else');
        if (elseLength > 0) {
          if (nestedIfDepth === 0) {
            return i;
          }
          nestedIfDepth -= 1;
          i += elseLength;
          continue;
        }
        if (elseLength < 0) {
          i = -elseLength - 1;
        }
      }
    }

    return -1;
  }

  function matchKeywordLength(exp, index, keyword) {
    const matchIndex = getLiteralMatch(exp, index, keyword);
    if (matchIndex > index) {
      const beforeChar = index > 0 ? exp[index - 1] : '\0';
      const afterChar = matchIndex < exp.length ? exp[matchIndex] : '\0';
      if ((beforeChar === '\0' || isCharWhiteSpace(beforeChar) || !isIdentifierOtherChar(beforeChar)) &&
          (afterChar === '\0' || isCharWhiteSpace(afterChar) || !isIdentifierOtherChar(afterChar))) {
        return matchIndex - index;
      }
      return -matchIndex;
    }
    return 0;
  }

  function trimEndExclusive(exp, start, end) {
    let result = end;
    while (result > start && isCharWhiteSpace(exp[result - 1])) {
      result -= 1;
    }
    return result;
  }

  function addErrors(target, source) {
    if (!source || !source.length) {
      return;
    }
    for (const err of source) {
      target.push(err);
    }
  }

  function offsetParseNode(node, offset) {
    if (!node) {
      return;
    }
    node.Pos += offset;
    if (Array.isArray(node.Childs)) {
      for (const child of node.Childs) {
        offsetParseNode(child, offset);
      }
    }
  }

  function offsetBlock(block, offset) {
    if (!block || typeof block !== 'object') {
      return;
    }
    if (typeof block.Pos === 'number') {
      block.Pos += offset;
    }
    if (Array.isArray(block.Parameters)) {
      for (const parameter of block.Parameters) {
        offsetBlock(parameter, offset);
      }
    } else if (typeof block.getChilds === 'function') {
      const children = block.getChilds();
      if (Array.isArray(children)) {
        for (const child of children) {
          offsetBlock(child, offset);
        }
      }
    }
  }

  function parseSubExpression(context, fragment, start, errors) {
    const localErrors = [];
    const res = env.getExpression(context, fragment, 0, localErrors);
    if (!res.block || localErrors.length) {
      addErrors(errors, localErrors.map((err) => ({ position: err.position + start, message: err.message })));
      return null;
    }

    const endIndex = skipSpace(fragment, res.next);
    if (endIndex !== fragment.length) {
      return null;
    }

    offsetBlock(res.block, start);
    if (res.node) {
      offsetParseNode(res.node, start);
    }

    return {
      block: res.block,
      node: res.node,
      next: start + fragment.length
    };
  }

  return getIfThenElseExpression;
};
