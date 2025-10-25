const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { LiteralBlock } = require('../ast/literalBlock');
const { FunctionCallExpression } = require('../ast/functionCallExpression');
const { literalString } = require('../core/values');
const { KEYWORDS } = require('../core/constants');
const { skipSpace, matchLiteral, getProviderData } = require('./utils');

function createFunctionBlock(context, symbol, pos, length) {
  const func = getProviderData(context, symbol);
  return new LiteralBlock(func ?? literalString(symbol)).setSpan(pos, length);
}

function getCaseExpression(context, exp, index, errors, getExpression) {
  let i = skipSpace(exp, index);
  const keywordEnd = matchLiteral(exp, i, KEYWORDS.CASE);
  if (keywordEnd === i) {
    return null;
  }

  i = skipSpace(exp, keywordEnd);
  const parameters = [];
  const nodes = [];

  while (true) {
    if (parameters.length === 0) {
      const condition = getExpression(context, exp, i, errors);
      if (!condition) {
        errors.push(new SyntaxErrorData(i, 1, 'Case condition expected'));
        return null;
      }
      parameters.push(condition.expression);
      nodes.push(condition.node);
      i = skipSpace(exp, condition.index);
    } else {
      const separator = matchLiteral(exp, i, ',', ';');
      if (separator === i) {
        break;
      }
      i = skipSpace(exp, separator);
      const condition = getExpression(context, exp, i, errors);
      if (!condition) {
        break;
      }
      parameters.push(condition.expression);
      nodes.push(condition.node);
      i = skipSpace(exp, condition.index);
    }

    const colon = matchLiteral(exp, i, ':');
    if (colon === i) {
      break;
    }
    i = skipSpace(exp, colon);

    const value = getExpression(context, exp, i, errors);
    if (!value) {
      errors.push(new SyntaxErrorData(i, 1, 'Case value expected'));
      return null;
    }
    parameters.push(value.expression);
    nodes.push(value.node);
    i = skipSpace(exp, value.index);
  }

  const spanStart = index;
  const spanEnd = i;
  const fnBlock = createFunctionBlock(context, KEYWORDS.CASE, spanStart, spanEnd - spanStart);
  const expression = new FunctionCallExpression(fnBlock, parameters).setSpan(
    spanStart,
    spanEnd - spanStart,
  );
  const node = new ParseNode(ParseNodeType.CASE, spanStart, spanEnd - spanStart, nodes);

  return { index: spanEnd, expression, node };
}

function getSwitchExpression(context, exp, index, errors, getExpression) {
  let i = skipSpace(exp, index);
  const keywordEnd = matchLiteral(exp, i, KEYWORDS.SWITCH);
  if (keywordEnd === i) {
    return null;
  }

  i = skipSpace(exp, keywordEnd);
  const parameters = [];
  const nodes = [];

  const selector = getExpression(context, exp, i, errors);
  if (!selector) {
    errors.push(new SyntaxErrorData(i, 1, 'Switch selector expected'));
    return null;
  }
  parameters.push(selector.expression);
  nodes.push(selector.node);
  i = skipSpace(exp, selector.index);

  while (true) {
    const separator = matchLiteral(exp, i, ',', ';');
    if (separator === i) {
      break;
    }
    i = skipSpace(exp, separator);

    const condition = getExpression(context, exp, i, errors);
    if (!condition) {
      break;
    }
    parameters.push(condition.expression);
    nodes.push(condition.node);
    i = skipSpace(exp, condition.index);

    const colon = matchLiteral(exp, i, ':');
    if (colon === i) {
      break;
    }
    i = skipSpace(exp, colon);

    const value = getExpression(context, exp, i, errors);
    if (!value) {
      errors.push(new SyntaxErrorData(i, 1, 'Selector result expected'));
      return null;
    }
    parameters.push(value.expression);
    nodes.push(value.node);
    i = skipSpace(exp, value.index);
  }

  const spanStart = index;
  const spanEnd = i;
  const fnBlock = createFunctionBlock(context, KEYWORDS.SWITCH, spanStart, spanEnd - spanStart);
  const expression = new FunctionCallExpression(fnBlock, parameters).setSpan(
    spanStart,
    spanEnd - spanStart,
  );
  const node = new ParseNode(ParseNodeType.CASE, spanStart, spanEnd - spanStart, nodes);

  return { index: spanEnd, expression, node };
}

module.exports = {
  getCaseExpression,
  getSwitchExpression,
};
