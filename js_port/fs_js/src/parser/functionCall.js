const { FunctionCallExpression } = require('../ast/functionCallExpression');
const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { matchLiteral, skipSpace } = require('./utils');

function getFunctionCall(context, exp, index, functionExpression, functionNode, errors, getExpression) {
  let i = matchLiteral(exp, index, '(');
  if (i === index) {
    return null;
  }
  i = skipSpace(exp, i);
  const parameters = [];
  const paramNodes = [];

  if (matchLiteral(exp, i, ')') === i) {
    while (true) {
      const param = getExpression(context, exp, i, errors);
      if (!param) {
        break;
      }
      parameters.push(param.expression);
      paramNodes.push(param.node);
      i = skipSpace(exp, param.index);
      const comma = matchLiteral(exp, i, ',');
      if (comma === i) {
        break;
      }
      i = skipSpace(exp, comma);
    }
  }

  i = skipSpace(exp, i);
  const close = matchLiteral(exp, i, ')');
  if (close === i) {
    errors.push(new SyntaxErrorData(i, 0, '")" expected in function call'));
    return null;
  }

  const callExpression = new FunctionCallExpression(functionExpression, parameters).setSpan(
    functionExpression.pos,
    close - functionExpression.pos,
  );
  const node = new ParseNode(
    ParseNodeType.FUNCTION_CALL,
    functionNode.pos,
    close - functionNode.pos,
    [functionNode, ...paramNodes],
  );

  return { index: close, expression: callExpression, node };
}

module.exports = {
  getFunctionCall,
};
