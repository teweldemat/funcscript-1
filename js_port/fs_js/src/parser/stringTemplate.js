const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { literalString } = require('../core/values');
const { LiteralBlock } = require('../ast/literalBlock');
const { FunctionCallExpression } = require('../ast/functionCallExpression');
const { matchLiteral, skipSpace, getProviderData } = require('./utils');

function getStringTemplateWithDelimiter(context, delimiter, exp, index, errors, getExpression) {
  let i = matchLiteral(exp, index, `f${delimiter}`);
  if (i === index) {
    return null;
  }

  const parts = [];
  const nodeParts = [];
  let buffer = '';
  let literalStart = i;

  while (i < exp.length) {
    const escapeStart = matchLiteral(exp, i, '\\');
    if (escapeStart > i) {
      if (escapeStart >= exp.length) {
        errors.push(new SyntaxErrorData(escapeStart, 1, 'Unexpected end of string template'));
        return null;
      }

      const next = exp[escapeStart];
      let escaped;
      switch (next) {
        case 'n':
          escaped = '\n';
          break;
        case 'r':
          escaped = '\r';
          break;
        case 't':
          escaped = '\t';
          break;
        case '\\':
          escaped = '\\';
          break;
        case '{':
          escaped = '{';
          break;
        case '}':
          escaped = '}';
          break;
        default:
          escaped = next === delimiter ? delimiter : next;
          break;
      }
      buffer += escaped;
      i = escapeStart + 1;
      continue;
    }

    if (exp[i] === '{') {
      if (buffer.length > 0) {
        const literalNode = new ParseNode(ParseNodeType.LITERAL_STRING, literalStart, i - literalStart);
        const literalBlock = new LiteralBlock(literalString(buffer)).setSpan(literalStart, i - literalStart);
        parts.push(literalBlock);
        nodeParts.push(literalNode);
        buffer = '';
      }

      i += 1;
      i = skipSpace(exp, i);
      const expr = getExpression(context, exp, i, errors);
      if (!expr) {
        errors.push(new SyntaxErrorData(i, 0, 'expression expected'));
        return null;
      }

      i = skipSpace(exp, expr.index);
      const close = matchLiteral(exp, i, '}');
      if (close === i) {
        errors.push(new SyntaxErrorData(i, 0, "'}' expected"));
        return null;
      }

      parts.push(expr.expression);
      nodeParts.push(expr.node);
      i = close;
      literalStart = i;
      continue;
    }

    if (exp[i] === delimiter) {
      break;
    }

    buffer += exp[i];
    i += 1;
  }

  if (buffer.length > 0) {
    const literalNode = new ParseNode(ParseNodeType.LITERAL_STRING, literalStart, i - literalStart);
    const literalBlock = new LiteralBlock(literalString(buffer)).setSpan(literalStart, i - literalStart);
    parts.push(literalBlock);
    nodeParts.push(literalNode);
  }

  const close = matchLiteral(exp, i, delimiter);
  if (close === i) {
    errors.push(new SyntaxErrorData(i, 0, `'${delimiter}' expected`));
    return null;
  }

  const spanLength = close - index;

  if (parts.length === 0) {
    const expression = new LiteralBlock(literalString('')).setSpan(index, spanLength);
    const node = new ParseNode(ParseNodeType.LITERAL_STRING, index, spanLength);
    return { index: close, expression, node };
  }

  if (parts.length === 1) {
    const [expression] = parts;
    const [node] = nodeParts;
    return { index: close, expression, node };
  }

  const fnValue = getProviderData(context, '+');
  const functionBlock = new LiteralBlock(fnValue ?? literalString('+')).setSpan(index, 0);
  const expression = new FunctionCallExpression(functionBlock, parts).setSpan(index, spanLength);
  const node = new ParseNode(ParseNodeType.STRING_TEMPLATE, index, spanLength, nodeParts);
  return { index: close, expression, node };
}

function getStringTemplate(context, exp, index, errors, getExpression) {
  return (
    getStringTemplateWithDelimiter(context, '"', exp, index, errors, getExpression) ||
    getStringTemplateWithDelimiter(context, '\'', exp, index, errors, getExpression)
  );
}

module.exports = {
  getStringTemplate,
};
