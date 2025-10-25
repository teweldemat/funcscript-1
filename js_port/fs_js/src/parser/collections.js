const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { ListExpression } = require('../ast/listExpression');
const { ReferenceBlock } = require('../ast/referenceBlock');
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

function getConnectionItem(context, exp, index, errors, getExpression, nodeType) {
  const attemptErrors = [];
  let i = skipSpace(exp, index);
  const source = getExpression(context, exp, i, attemptErrors);
  if (!source) {
    return null;
  }

  i = skipSpace(exp, source.index);
  const arrowLiteral = nodeType === ParseNodeType.DATA_CONNECTION ? ':->' : '->';
  const afterArrow = matchLiteral(exp, i, arrowLiteral);
  if (afterArrow === i) {
    return null;
  }

  i = skipSpace(exp, afterArrow);
  const sink = getExpression(context, exp, i, attemptErrors);
  if (!sink) {
    errors.push(new SyntaxErrorData(i, 0, 'Sink expression expected'));
    return null;
  }

  i = skipSpace(exp, sink.index);

  let connectionExpression;
  if (sink.expression instanceof ListExpression) {
    const expressions = sink.expression.valueExpressions;
    if (expressions.length !== 2) {
      errors.push(new SyntaxErrorData(i, 0, 'Exactly two items, sink and fault are expected'));
      return null;
    }

    connectionExpression = {
      source: source.expression,
      sink: expressions[0],
      catch: expressions[1],
    };
  } else {
    connectionExpression = {
      source: source.expression,
      sink: sink.expression,
      catch: null,
    };
  }

  const node = new ParseNode(
    nodeType,
    index,
    i - index,
    [source.node, sink.node],
  );

  return { index: i, connection: connectionExpression, node };
}

function getKvcItem(context, nakedMode, exp, index, errors, getExpression) {
  const kvErrors = [];
  const keyValueResult = getKeyValuePair(context, exp, index, kvErrors, getExpression);
  if (keyValueResult) {
    return {
      index: keyValueResult.index,
      item: keyValueResult.keyValue,
      node: keyValueResult.node,
    };
  }

  const retErrors = [];
  const returnResult = getReturnDefinition(context, exp, index, retErrors, getExpression);
  if (returnResult) {
    return {
      index: returnResult.index,
      item: {
        key: null,
        keyLower: null,
        valueExpression: returnResult.expression,
      },
      node: returnResult.node,
    };
  }

  if (!nakedMode) {
    const identifier = getIdentifier(exp, index);
    if (identifier) {
      const reference = new ReferenceBlock(identifier.text).setSpan(index, identifier.index - index);
      return {
        index: identifier.index,
        item: {
          key: identifier.text,
          keyLower: identifier.textLower,
          valueExpression: reference,
        },
        node: identifier.node,
      };
    }

    const stringKey = getSimpleString(exp, index, []);
    if (stringKey) {
      const key = stringKey.expression.value[1];
      const reference = new ReferenceBlock(key).setSpan(index, stringKey.index - index);
      return {
        index: stringKey.index,
        item: {
          key,
          keyLower: key.toLowerCase(),
          valueExpression: reference,
        },
        node: stringKey.node,
      };
    }
  }

  return null;
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
  const dataConnections = [];
  const signalConnections = [];
  let returnExpression = null;
  let parsedAny = false;

  while (true) {
    i = skipSpace(exp, i);

    if (!nakedMode && exp[i] === '}') {
      break;
    }

    const dataConnection = getConnectionItem(context, exp, i, errors, getExpression, ParseNodeType.DATA_CONNECTION);
    if (dataConnection) {
      dataConnections.push(dataConnection.connection);
      nodeItems.push(dataConnection.node);
      parsedAny = true;
      i = dataConnection.index;
    } else {
      const signalConnection = getConnectionItem(
        context,
        exp,
        i,
        errors,
        getExpression,
        ParseNodeType.SIGNAL_CONNECTION,
      );
      if (signalConnection) {
        signalConnections.push(signalConnection.connection);
        nodeItems.push(signalConnection.node);
        parsedAny = true;
        i = signalConnection.index;
      } else {
        const item = getKvcItem(context, nakedMode, exp, i, errors, getExpression);
        if (!item) {
          break;
        }

        if (!item.item.key && returnExpression) {
          errors.push(new SyntaxErrorData(item.node.pos, 0, 'Duplicate return statement'));
          return null;
        }

        if (!item.item.key) {
          returnExpression = item.item.valueExpression;
        } else {
          keyValues.push(item.item);
        }
        nodeItems.push(item.node);
        parsedAny = true;
        i = item.index;
      }
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
  const errorMessage = kvcExpr.setKeyValues(
    keyValues,
    returnExpression,
    dataConnections,
    signalConnections,
  );
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
