const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { LiteralBlock } = require('../ast/literalBlock');
const { FunctionCallExpression } = require('../ast/functionCallExpression');
const { matchLiteral, skipSpace, getProviderData } = require('./utils');

const PREFIX_OPERATORS = [
  { literal: '!', symbol: 'not' },
  { literal: '-', symbol: 'neg' },
];

function getPrefixOperator(context, exp, index, errors, getCallAndMemberAccess) {
  let match = null;
  let i = index;
  for (const op of PREFIX_OPERATORS) {
    const next = matchLiteral(exp, i, op.literal);
    if (next > i) {
      match = { ...op, length: next - i };
      i = next;
      break;
    }
  }

  if (!match) {
    return null;
  }

  i = skipSpace(exp, i);

  const func = getProviderData(context, match.symbol);
  if (!func) {
    errors.push(new SyntaxErrorData(index, i - index, `Prefix operator ${match.symbol} not defined`));
    return null;
  }

  const operand = getCallAndMemberAccess(context, exp, i, errors);
  if (!operand) {
    errors.push(new SyntaxErrorData(i, 0, `Operand for ${match.symbol} expected`));
    return null;
  }

  const end = skipSpace(exp, operand.index);
  const functionBlock = new LiteralBlock(func).setSpan(index, match.length);
  const expression = new FunctionCallExpression(functionBlock, [operand.expression]).setSpan(
    index,
    end - index,
  );

  const node = new ParseNode(
    ParseNodeType.PREFIX_OPERATOR_EXPRESSION,
    index,
    end - index,
    [new ParseNode(ParseNodeType.OPERATOR, index, match.length), operand.node],
  );

  return { index: end, expression, node };
}

module.exports = {
  getPrefixOperator,
  PREFIX_OPERATORS,
};
