const { ParseNodeType, ParseNode } = require('../core/parseNode');

function getProviderData(context, symbol) {
  if (!context) {
    return null;
  }
  if (typeof context.getData === 'function') {
    return context.getData(symbol);
  }
  if (typeof context.get === 'function') {
    return context.get(symbol);
  }
  return null;
}

function isWhiteSpace(ch) {
  return ch === ' ' || ch === '\r' || ch === '\t' || ch === '\n';
}

function getLiteralMatchInfo(exp, index, literals) {
  for (const literal of literals) {
    const length = literal.length;
    if (index + length > exp.length) {
      continue;
    }

    const segment = exp.slice(index, index + length);
    if (segment.toLowerCase() === literal.toLowerCase()) {
      return {
        index: index + length,
        matched: literal.toLowerCase(),
        text: segment,
      };
    }
  }

  return { index, matched: null, text: null };
}

function matchLiteral(exp, index, ...literals) {
  return getLiteralMatchInfo(exp, index, literals).index;
}

function matchAnyLiteral(exp, index, literals) {
  return getLiteralMatchInfo(exp, index, literals).index;
}

function getCommentBlock(exp, index) {
  const { index: afterStart } = getLiteralMatchInfo(exp, index, ['//']);
  if (afterStart === index) {
    return null;
  }

  const newlineIndex = exp.indexOf('\n', afterStart);
  const endIndex = newlineIndex === -1 ? exp.length : newlineIndex + 1;
  return {
    index: endIndex,
    node: new ParseNode(ParseNodeType.COMMENT, index, endIndex - index),
  };
}

function skipSpace(exp, index) {
  let i = index;
  while (i < exp.length) {
    const ch = exp[i];
    if (isWhiteSpace(ch)) {
      i += 1;
      continue;
    }

    const comment = getCommentBlock(exp, i);
    if (comment) {
      i = comment.index;
      continue;
    }

    break;
  }
  return i;
}

module.exports = {
  getProviderData,
  isWhiteSpace,
  getLiteralMatchInfo,
  matchLiteral,
  matchAnyLiteral,
  getCommentBlock,
  skipSpace,
};
