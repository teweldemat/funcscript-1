const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { skipSpace, matchLiteral } = require('./utils');
const { getIdentifier } = require('./literals');

function getIdentifierList(exp, index) {
  let i = skipSpace(exp, index);
  if (i >= exp.length || exp[i] !== '(') {
    return null;
  }
  i += 1;

  const identifiers = [];
  const childNodes = [];
  i = skipSpace(exp, i);

  const firstIdentifier = getIdentifier(exp, i);
  if (firstIdentifier) {
    identifiers.push(firstIdentifier.text);
    childNodes.push(firstIdentifier.node);
    i = skipSpace(exp, firstIdentifier.index);

    while (i < exp.length) {
      const comma = matchLiteral(exp, i, ',');
      if (comma === i) {
        break;
      }
      i = skipSpace(exp, comma);
      const nextIdentifier = getIdentifier(exp, i);
      if (!nextIdentifier) {
        return null;
      }
      identifiers.push(nextIdentifier.text);
      childNodes.push(nextIdentifier.node);
      i = skipSpace(exp, nextIdentifier.index);
    }
  }

  if (i >= exp.length || exp[i] !== ')') {
    return null;
  }
  i += 1;

  const node = new ParseNode(ParseNodeType.IDENTIFIER_LIST, index, i - index, childNodes);
  return { index: i, identifiers, node };
}

function getLambdaExpression(context, exp, index, errors, getExpression) {
  const identifiers = getIdentifierList(exp, index);
  if (!identifiers) {
    return null;
  }

  let i = skipSpace(exp, identifiers.index);
  const arrow = matchLiteral(exp, i, '=>');
  if (arrow === i) {
    errors.push(new SyntaxErrorData(i, 0, "'=>' expected"));
    return null;
  }
  i = skipSpace(exp, arrow);

  const definition = getExpression(context, exp, i, errors);
  if (!definition) {
    errors.push(new SyntaxErrorData(i, 0, 'definition of lambda expression expected'));
    return null;
  }

  i = definition.index;
  const node = new ParseNode(
    ParseNodeType.LAMBDA_EXPRESSION,
    index,
    i - index,
    [identifiers.node, definition.node],
  );

  return {
    index: i,
    parameters: identifiers.identifiers,
    body: definition.expression,
    node,
  };
}

module.exports = {
  getIdentifierList,
  getLambdaExpression,
};
