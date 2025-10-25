const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { literalString } = require('../core/values');
const { LiteralBlock } = require('../ast/literalBlock');
const { ReferenceBlock } = require('../ast/referenceBlock');
const { FunctionCallExpression } = require('../ast/functionCallExpression');
const {
  getProviderData,
  matchLiteral,
  matchAnyLiteral,
  skipSpace,
} = require('./utils');
const {
  getNumber,
  getKeywordLiteral,
  getIdentifier,
  getSimpleString,
} = require('./literals');
const { getStringTemplate } = require('./stringTemplate');
const { getListExpression, getKvcExpression } = require('./collections');
const { getPrefixOperator } = require('./prefix');
const { getFunctionCall } = require('./functionCall');

const operatorSymbols = [
  ['^'],
  ['*', '/', '%'],
  ['+', '-'],
  ['>=', '<=', '!=', '>', '<', 'in'],
  ['=', '??', '?!', '?.'],
  ['or', 'and'],
  ['|'],
  ['>>'],
];

function getParenthesisExpression(context, exp, index, errors) {
  let i = skipSpace(exp, index);
  const next = matchLiteral(exp, i, '(');
  if (next === i) {
    return null;
  }
  i = skipSpace(exp, next);
  const inner = getExpression(context, exp, i, errors);
  if (!inner) {
    errors.push(new SyntaxErrorData(i, 0, 'Expression expected after "("'));
    return null;
  }
  i = skipSpace(exp, inner.index);
  const close = matchLiteral(exp, i, ')');
  if (close === i) {
    errors.push(new SyntaxErrorData(i, 0, '")" expected'));
    return null;
  }
  const node = new ParseNode(ParseNodeType.EXPRESSION_IN_BRACE, index, close - index, [inner.node]);
  const expression = inner.expression.setSpan(index, close - index);
  return { index: close, expression, node };
}

function getUnit(context, exp, index, errors) {
  const i = skipSpace(exp, index);

  const templateLiteral = getStringTemplate(context, exp, i, errors, getExpression);
  if (templateLiteral) {
    return templateLiteral;
  }

  const stringLiteral = getSimpleString(exp, i, errors);
  if (stringLiteral) {
    return stringLiteral;
  }

  const numberLiteral = getNumber(exp, i, errors);
  if (numberLiteral) {
    return numberLiteral;
  }

  const listExpression = getListExpression(context, exp, i, errors, getExpression);
  if (listExpression) {
    return listExpression;
  }

  const kvcExpression = getKvcExpression(context, false, exp, i, errors, getExpression);
  if (kvcExpression) {
    return kvcExpression;
  }

  const keywordLiteral = getKeywordLiteral(exp, i);
  if (keywordLiteral) {
    return keywordLiteral;
  }

  const identifier = getIdentifier(exp, i);
  if (identifier) {
    const ref = new ReferenceBlock(identifier.text).setSpan(i, identifier.index - i);
    return { index: identifier.index, expression: ref, node: identifier.node };
  }

  const parenthesis = getParenthesisExpression(context, exp, i, errors);
  if (parenthesis) {
    return parenthesis;
  }

  const prefixOperator = getPrefixOperator(context, exp, i, errors, getCallAndMemberAccess);
  if (prefixOperator) {
    return prefixOperator;
  }

  return null;
}

function getCallAndMemberAccess(context, exp, index, errors) {
  let result = getUnit(context, exp, index, errors);
  if (!result) {
    return null;
  }

  let currentIndex = skipSpace(exp, result.index);
  while (currentIndex < exp.length && exp[currentIndex] === '(') {
    const call = getFunctionCall(context, exp, currentIndex, result.expression, result.node, errors, getExpression);
    if (!call) {
      break;
    }
    result = call;
    currentIndex = skipSpace(exp, result.index);
  }

  return result;
}

function getInfixExpressionSingleLevel(context, level, exp, index, errors) {
  if (level < 0) {
    return getCallAndMemberAccess(context, exp, index, errors);
  }

  const candidates = operatorSymbols[level];
  let left = getInfixExpressionSingleLevel(context, level - 1, exp, index, errors);
  if (!left) {
    return null;
  }

  let i = skipSpace(exp, left.index);
  while (true) {
    const operatorPos = i;
    const operatorMatch = matchAnyLiteral(exp, i, candidates);
    if (operatorMatch === i) {
      break;
    }
    const operatorSymbol = exp.substring(operatorPos, operatorMatch);
    i = skipSpace(exp, operatorMatch);
    const right = getInfixExpressionSingleLevel(context, level - 1, exp, i, errors);
    if (!right) {
      errors.push(new SyntaxErrorData(i, 0, 'Expression expected after operator'));
      return null;
    }
    const func = getProviderData(context, operatorSymbol.trim());
    const fnBlock = new LiteralBlock(func ?? literalString(operatorSymbol.trim())).setSpan(
      left.expression.pos,
      0,
    );
    const call = new FunctionCallExpression(fnBlock, [left.expression, right.expression]);
    call.setSpan(left.expression.pos, right.expression.pos + right.expression.length - left.expression.pos);

    const node = new ParseNode(
      ParseNodeType.INFIX_EXPRESSION,
      left.node.pos,
      right.node.pos + right.node.length - left.node.pos,
      [
        left.node,
        new ParseNode(ParseNodeType.OPERATOR, operatorPos, operatorSymbol.length),
        right.node,
      ],
    );
    left = { index: right.index, expression: call, node };
    i = skipSpace(exp, right.index);
  }

  return left;
}

function getExpression(context, exp, index, errors) {
  return getInfixExpressionSingleLevel(context, operatorSymbols.length - 1, exp, index, errors);
}

function getRootExpression(context, exp, index, errors) {
  const kvc = getKvcExpression(context, true, exp, index, errors, getExpression);
  if (kvc) {
    return kvc;
  }

  const expr = getExpression(context, exp, index, errors);
  if (expr) {
    return expr;
  }

  return null;
}

function parse(context, exp, errors = []) {
  const result = getRootExpression(context, exp, 0, errors);
  if (!result) {
    return { expression: null, node: null, errors };
  }
  return { expression: result.expression, node: result.node, errors };
}

module.exports = {
  getExpression,
  getRootExpression,
  getCallAndMemberAccess,
  getUnit,
  parse,
};
