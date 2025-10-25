const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { ListExpression } = require('../ast/listExpression');
const { KvcExpression } = require('../ast/kvcExpression');
const { KEYWORDS } = require('../core/constants');
const { skipSpace, matchLiteral } = require('./utils');
const { getSimpleString, getIdentifier } = require('./literals');

function getListExpression(context, exp, index, errors, getExpression) {
  let i = skipSpace(exp, index);
  const open = matchLiteral(exp, i, '[');
  if (open === i) {
    return null;
  }

  const items = [];
  const nodeItems = [];
  i = skipSpace(exp, open);

  const firstItem = getExpression(context, exp, i, errors);
  if (firstItem) {
    items.push(firstItem.expression);
    nodeItems.push(firstItem.node);
    i = firstItem.index;

    while (true) {
      const commaStart = skipSpace(exp, i);
      const comma = matchLiteral(exp, commaStart, ',');
      if (comma === commaStart) {
        break;
      }

      i = skipSpace(exp, comma);
      const nextItem = getExpression(context, exp, i, errors);
      if (!nextItem) {
        break;
      }

      items.push(nextItem.expression);
      nodeItems.push(nextItem.node);
      i = nextItem.index;
    }
  }

  i = skipSpace(exp, i);
  const close = matchLiteral(exp, i, ']');
  if (close === i) {
    errors.push(new SyntaxErrorData(i, 0, "']' expected"));
    return null;
  }

  const listExpression = new ListExpression(items).setSpan(index, close - index);
  const node = new ParseNode(ParseNodeType.LIST, index, close - index, nodeItems);
  return { index: close, expression: listExpression, node };
}

function getReturnDefinition(context, exp, index, errors, getExpression) {
  const end = matchLiteral(exp, index, KEYWORDS.RETURN);
  if (end === index) {
    return null;
  }

  const keywordNode = new ParseNode(ParseNodeType.KEYWORD, index, end - index);
  let i = skipSpace(exp, end);
  const expressionResult = getExpression(context, exp, i, errors);
  if (!expressionResult) {
    errors.push(new SyntaxErrorData(i, 0, 'return expression expected'));
    return null;
  }

  i = expressionResult.index;
  expressionResult.expression.setSpan(index, i - index);
  const node = new ParseNode(
    ParseNodeType.EXPRESSION_IN_BRACE,
    index,
    i - index,
    [keywordNode, expressionResult.node],
  );

  return { index: i, expression: expressionResult.expression, node };
}

function getKeyValuePair(context, exp, index, errors, getExpression) {
  const localErrors = [];
  let keyName;
  let keyNode;
  let i = index;

  const stringKey = getSimpleString(exp, i, localErrors);
  if (stringKey) {
    keyName = stringKey.expression.value[1];
    keyNode = stringKey.node;
    i = stringKey.index;
  } else {
    const identifier = getIdentifier(exp, i);
    if (!identifier) {
      return null;
    }
    keyName = identifier.text;
    keyNode = identifier.node;
    i = identifier.index;
  }

  keyNode.nodeType = ParseNodeType.KEY;

  i = skipSpace(exp, i);
  const colon = matchLiteral(exp, i, ':');
  if (colon === i) {
    return null;
  }

  i = skipSpace(exp, colon);
  const value = getExpression(context, exp, i, errors);
  if (!value) {
    errors.push(new SyntaxErrorData(i, 0, 'value expression expected'));
    return null;
  }

  i = value.index;
  const keyValue = {
    key: keyName,
    keyLower: keyName.toLowerCase(),
    valueExpression: value.expression,
  };

  const node = new ParseNode(
    ParseNodeType.KEY_VALUE_PAIR,
    index,
    i - index,
    [keyNode, value.node],
  );

  return { index: i, keyValue, node };
}

function getKvcExpression(context, nakedMode, exp, index, errors, getExpression) {
  let i = skipSpace(exp, index);
  if (!nakedMode) {
    const open = matchLiteral(exp, i, '{');
    if (open === i) {
      return null;
    }
    i = open;
  }

  const keyValues = [];
  const nodeItems = [];
  let returnExpression = null;
  let parsedAny = false;

  while (true) {
    i = skipSpace(exp, i);

    if (!nakedMode && exp[i] === '}') {
      break;
    }

    const returnResult = getReturnDefinition(context, exp, i, errors, getExpression);
    if (returnResult) {
      if (returnExpression) {
        errors.push(new SyntaxErrorData(returnResult.node.pos, 0, 'Duplicate return statement'));
        return null;
      }

      returnExpression = returnResult.expression;
      nodeItems.push(returnResult.node);
      parsedAny = true;
      i = returnResult.index;
    } else {
      const keyValueResult = getKeyValuePair(context, exp, i, errors, getExpression);
      if (!keyValueResult) {
        break;
      }

      keyValues.push(keyValueResult.keyValue);
      nodeItems.push(keyValueResult.node);
      parsedAny = true;
      i = keyValueResult.index;
    }

    i = skipSpace(exp, i);
    const separator = matchLiteral(exp, i, ',', ';');
    if (separator === i) {
      continue;
    }
    i = separator;
  }

  if (!nakedMode) {
    i = skipSpace(exp, i);
    const close = matchLiteral(exp, i, '}');
    if (close === i) {
      errors.push(new SyntaxErrorData(i, 0, "'}' expected"));
      return null;
    }
    i = close;
  } else if (!parsedAny) {
    return null;
  }

  const kvcExpr = new KvcExpression();
  const errorMessage = kvcExpr.setKeyValues(keyValues, returnExpression, [], []);
  if (errorMessage) {
    errors.push(new SyntaxErrorData(index, i - index, errorMessage));
    return null;
  }

  kvcExpr.setSpan(index, i - index);
  const node = new ParseNode(ParseNodeType.KEY_VALUE_COLLECTION, index, i - index, nodeItems);
  return { index: i, expression: kvcExpr, node };
}

module.exports = {
  getListExpression,
  getKvcExpression,
};
