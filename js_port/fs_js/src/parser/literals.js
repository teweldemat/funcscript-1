const { ParseNodeType, ParseNode, SyntaxErrorData } = require('../core/parseNode');
const { literalNumber, literalNull, literalBoolean, literalString } = require('../core/values');
const { LiteralBlock } = require('../ast/literalBlock');
const { KEYWORDS } = require('../core/constants');
const { matchLiteral } = require('./utils');

function getSimpleString(exp, index, errors) {
  let i = index;
  const quote = exp[i];
  if (quote !== '"' && quote !== '\'' && quote !== '`') {
    return null;
  }
  i += 1;
  let result = '';
  while (i < exp.length) {
    const ch = exp[i];
    if (ch === '\\') {
      if (i + 1 >= exp.length) {
        errors.push(new SyntaxErrorData(i, 1, 'Unexpected end of string'));
        return null;
      }
      const next = exp[i + 1];
      switch (next) {
        case 'n':
          result += '\n';
          break;
        case 'r':
          result += '\r';
          break;
        case 't':
          result += '\t';
          break;
        case '\\':
          result += '\\';
          break;
        case '"':
          result += '"';
          break;
        case '\'':
          result += '\'';
          break;
        default:
          result += next;
          break;
      }
      i += 2;
      continue;
    }
    if (ch === quote) {
      const node = new ParseNode(ParseNodeType.LITERAL_STRING, index, i - index + 1);
      const value = new LiteralBlock(literalString(result)).setSpan(index, i - index + 1);
      return { index: i + 1, expression: value, node };
    }
    result += ch;
    i += 1;
  }
  errors.push(new SyntaxErrorData(index, exp.length - index, 'Unterminated string literal'));
  return null;
}

function getNumber(exp, index, errors) {
  let i = index;
  let allowNegative = true;
  if (exp[i] === '+') {
    allowNegative = false;
    i += 1;
  }

  const start = i;
  if (exp[i] === '-' && allowNegative) {
    i += 1;
  }

  let hasDigits = false;
  while (i < exp.length && /[0-9]/.test(exp[i])) {
    i += 1;
    hasDigits = true;
  }

  let hasDecimal = false;
  if (exp[i] === '.') {
    hasDecimal = true;
    i += 1;
    while (i < exp.length && /[0-9]/.test(exp[i])) {
      i += 1;
      hasDigits = true;
    }
  }

  if (!hasDigits) {
    return null;
  }

  const raw = exp.substring(index, i);
  const numericValue = Number(raw);
  if (Number.isNaN(numericValue)) {
    errors.push(new SyntaxErrorData(index, i - index, `${raw} couldn't be parsed as number`));
    return null;
  }

  const type = hasDecimal ? ParseNodeType.LITERAL_DOUBLE : ParseNodeType.LITERAL_INTEGER;
  const node = new ParseNode(type, index, i - index);
  const expression = new LiteralBlock(literalNumber(numericValue)).setSpan(index, i - index);
  return { index: i, expression, node };
}

function getKeywordLiteral(exp, index) {
  const candidates = [
    { literal: KEYWORDS.NULL, value: literalNull() },
    { literal: KEYWORDS.TRUE, value: literalBoolean(true) },
    { literal: KEYWORDS.FALSE, value: literalBoolean(false) },
  ];

  for (const candidate of candidates) {
    const next = matchLiteral(exp, index, candidate.literal);
    if (next > index) {
      const node = new ParseNode(ParseNodeType.KEYWORD, index, next - index);
      const expression = new LiteralBlock(candidate.value).setSpan(index, next - index);
      return { index: next, expression, node };
    }
  }

  return null;
}

function isIdentifierFirstChar(ch) {
  return /[A-Za-z_]/.test(ch);
}

function isIdentifierOtherChar(ch) {
  return /[A-Za-z0-9_]/.test(ch);
}

function getIdentifier(exp, index) {
  let i = index;
  if (i >= exp.length || !isIdentifierFirstChar(exp[i])) {
    return null;
  }
  i += 1;
  while (i < exp.length && isIdentifierOtherChar(exp[i])) {
    i += 1;
  }
  const text = exp.substring(index, i);
  return {
    index: i,
    text,
    textLower: text.toLowerCase(),
    node: new ParseNode(ParseNodeType.IDENTIFIER, index, i - index),
  };
}

module.exports = {
  getSimpleString,
  getNumber,
  getKeywordLiteral,
  getIdentifier,
  isIdentifierFirstChar,
  isIdentifierOtherChar,
};
