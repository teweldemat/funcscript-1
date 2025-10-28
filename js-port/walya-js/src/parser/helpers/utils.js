const { makeValue, typedNull } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');
const { ParseNode, ParseNodeType } = require('../parse-node');

const MAX_INT_LITERAL = 9223372036854775807n;
const MIN_INT_LITERAL = -9223372036854775808n;

const OPERATOR_SYMBOLS = [
  ['^'],
  ['*', '/', '%'],
  ['+', '-'],
  ['>=', '<=', '!=', '>', '<', 'in'],
  ['=', '??', '?!', '?.'],
  ['or', 'and'],
  ['|'],
  ['>>']
];

const KEYWORDS = new Set(['return', 'fault', 'case', 'switch', 'true', 'false', 'null']);

function isCharWhiteSpace(ch) {
  return ch === ' ' || ch === '\r' || ch === '\t' || ch === '\n';
}

function getCommentBlock(exp, index) {
  if (index + 1 >= exp.length) {
    return { next: index, node: null };
  }
  if (exp[index] !== '/' || exp[index + 1] !== '/') {
    return { next: index, node: null };
  }
  const nextLine = exp.indexOf('\n', index + 2);
  const end = nextLine === -1 ? exp.length : nextLine + 1;
  return {
    next: end,
    node: new ParseNode(ParseNodeType.Comment, index, end - index)
  };
}

function skipSpace(exp, index) {
  let current = index;
  while (current < exp.length) {
    if (isCharWhiteSpace(exp[current])) {
      current += 1;
      continue;
    }
    const { next } = getCommentBlock(exp, current);
    if (next === current) {
      break;
    }
    current = next;
  }
  return current;
}

function getLiteralMatch(exp, index, ...keywords) {
  return getLiteralMatchArray(exp, index, keywords);
}

function toLowerCharCode(str, offset) {
  const code = str.charCodeAt(offset);
  if (code >= 65 && code <= 90) {
    return code + 32;
  }
  return code;
}

function getLiteralMatchArray(exp, index, keywords) {
  if (exp == null) {
    throw new TypeError('Expression cannot be null');
  }
  const length = exp.length;
  for (let k = 0; k < keywords.length; k += 1) {
    const keyword = keywords[k];
    if (typeof keyword !== 'string') {
      continue;
    }
    const keywordLength = keyword.length;
    if (keywordLength === 0 || index + keywordLength > length) {
      continue;
    }
    let matched = true;
    for (let i = 0; i < keywordLength; i += 1) {
      const expCode = toLowerCharCode(exp, index + i);
      const keyCode = toLowerCharCode(keyword, i);
      if (expCode !== keyCode) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return index + keywordLength;
    }
  }
  return index;
}

function isAsciiLetterCode(code) {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isAsciiDigitCode(code) {
  return code >= 48 && code <= 57;
}

function isIdentifierFirstChar(ch) {
  if (!ch) {
    return false;
  }
  const code = ch.charCodeAt(0);
  return isAsciiLetterCode(code) || ch === '_';
}

function isIdentifierOtherChar(ch) {
  if (!ch) {
    return false;
  }
  const code = ch.charCodeAt(0);
  return isAsciiLetterCode(code) || isAsciiDigitCode(code) || ch === '_';
}

function getIdentifier(exp, index) {
  let i = index;
  if (i >= exp.length || !isIdentifierFirstChar(exp[i])) {
    return { next: index, identifier: null, identifierLower: null, node: null };
  }
  i += 1;
  while (i < exp.length && isIdentifierOtherChar(exp[i])) {
    i += 1;
  }
  const identifier = exp.substring(index, i);
  const lower = identifier.toLowerCase();
  if (KEYWORDS.has(lower)) {
    return { next: index, identifier: null, identifierLower: null, node: null };
  }
  const node = new ParseNode(ParseNodeType.Identifier, index, i - index);
  return { next: i, identifier, identifierLower: lower, node };
}

function getKeyWordLiteral(exp, index) {
  let i = getLiteralMatch(exp, index, 'null');
  if (i > index) {
    return {
      next: i,
      value: typedNull(),
      node: new ParseNode(ParseNodeType.KeyWord, index, i - index)
    };
  }
  i = getLiteralMatch(exp, index, 'true');
  if (i > index) {
    return {
      next: i,
      value: makeValue(FSDataType.Boolean, true),
      node: new ParseNode(ParseNodeType.KeyWord, index, i - index)
    };
  }
  i = getLiteralMatch(exp, index, 'false');
  if (i > index) {
    return {
      next: i,
      value: makeValue(FSDataType.Boolean, false),
      node: new ParseNode(ParseNodeType.KeyWord, index, i - index)
    };
  }
  return { next: index, value: null, node: null };
}

function getInt(exp, allowNegative, index) {
  let i = index;
  if (allowNegative) {
    const next = getLiteralMatch(exp, i, '-');
    if (next > i) {
      i = next;
    }
  }
  const start = i;
  while (i < exp.length) {
    const ch = exp[i];
    if (ch < '0' || ch > '9') {
      break;
    }
    i += 1;
  }
  if (start === i) {
    return { next: index, value: null };
  }
  return { next: i, value: exp.substring(index, i) };
}

function getNumber(exp, index, errors) {
  let i = index;
  let hasDecimal = false;
  let hasExp = false;
  let hasLong = false;

  const intRes = getInt(exp, true, i);
  if (intRes.next === i) {
    return { next: index, value: null, node: null };
  }
  i = intRes.next;

  let next = getLiteralMatch(exp, i, '.');
  if (next > i) {
    hasDecimal = true;
    i = next;
    const decRes = getInt(exp, false, i);
    i = decRes.next;
  }

  next = getLiteralMatch(exp, i, 'e', 'E');
  if (next > i) {
    hasExp = true;
    i = next;
    if (getLiteralMatch(exp, i, '+', '-') > i) {
      i += 1;
    }
    const expRes = getInt(exp, false, i);
    if (expRes.next === i) {
      errors.push({ position: i, message: 'Invalid exponent' });
      return { next: index, value: null, node: null };
    }
    i = expRes.next;
  }

  if (!hasDecimal) {
    next = getLiteralMatch(exp, i, 'l', 'L');
    if (next > i) {
      hasLong = true;
      i = next;
    }
  }

  const literal = exp.substring(index, i);

  if (hasLong) {
    const withoutSuffix = literal.slice(0, -1);
    try {
      const value = parseLongLiteral(withoutSuffix);
      return {
        next: i,
        value: makeValue(FSDataType.BigInteger, value),
        node: new ParseNode(ParseNodeType.LiteralLong, index, i - index)
      };
    } catch (err) {
      errors.push({ position: index, message: err.message });
      return { next: index, value: null, node: null };
    }
  }

  if (hasDecimal || hasExp) {
    const value = Number(literal);
    if (Number.isNaN(value)) {
      errors.push({ position: index, message: `Invalid number '${literal}'` });
      return { next: index, value: null, node: null };
    }
    return {
      next: i,
      value: makeValue(FSDataType.Float, value),
      node: new ParseNode(ParseNodeType.LiteralDouble, index, i - index)
    };
  }

  try {
    const big = BigInt(literal);
    if (big > MAX_INT_LITERAL || big < MIN_INT_LITERAL) {
      errors.push({ position: index, message: `Invalid number '${literal}'` });
      return { next: index, value: null, node: null };
    }
    const intValue = Number(big);
    if (!Number.isNaN(intValue) && Number.isInteger(intValue)) {
      return {
        next: i,
        value: makeValue(FSDataType.Integer, intValue),
        node: new ParseNode(ParseNodeType.LiteralInteger, index, i - index)
      };
    }
  } catch (err) {
    errors.push({ position: index, message: err.message });
    return { next: index, value: null, node: null };
  }

  errors.push({ position: index, message: `Invalid number '${literal}'` });
  return { next: index, value: null, node: null };
}

function parseLongLiteral(literal) {
  const text = literal.trim();
  if (!text) {
    throw new Error(`Invalid number '${literal}l'`);
  }
  if (text.includes('.')) {
    throw new Error(`Invalid number '${literal}l'`);
  }
  const match = text.match(/^([+-]?)(\d+)(?:[eE]([+-]?\d+))?$/);
  if (!match) {
    throw new Error(`Invalid number '${literal}l'`);
  }
  const sign = match[1] === '-' ? -1n : 1n;
  let magnitude = BigInt(match[2]);
  const exponentPart = match[3];
  if (exponentPart) {
    const exponentNum = Number(exponentPart);
    if (!Number.isInteger(exponentNum)) {
      throw new Error(`Invalid exponent '${exponentPart}' in '${literal}l'`);
    }
    if (exponentNum < 0) {
      throw new Error(`Invalid exponent '${exponentPart}' in '${literal}l'`);
    }
    const power = BigInt(exponentNum);
    magnitude *= 10n ** power;
  }
  return sign < 0 ? -magnitude : magnitude;
}

function getSimpleString(exp, index, errors) {
  let i = getLiteralMatch(exp, index, '"');
  if (i === index) {
    i = getLiteralMatch(exp, index, '\'');
    if (i === index) {
      return { next: index, value: null, node: null };
    }
  }
  const delimiter = exp[index];
  let result = '';
  while (i < exp.length) {
    if (exp[i] === delimiter) {
      i += 1;
      return {
        next: i,
        value: makeValue(FSDataType.String, result),
        node: new ParseNode(ParseNodeType.LiteralString, index, i - index)
      };
    }
    if (exp[i] === '\\') {
      const nextChar = exp[i + 1];
      if (nextChar === 'n') {
        result += '\n';
        i += 2;
      } else if (nextChar === 't') {
        result += '\t';
        i += 2;
      } else if (nextChar === 'u') {
        const hex = exp.substring(i + 2, i + 6);
        if (hex.length < 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
          errors.push({ position: i, message: 'Invalid unicode escape' });
          return { next: index, value: null, node: null };
        }
        result += String.fromCharCode(parseInt(hex, 16));
        i += 6;
      } else {
        result += nextChar;
        i += 2;
      }
      continue;
    }
    result += exp[i];
    i += 1;
  }
  errors.push({ position: index, message: 'Unterminated string literal' });
  return { next: index, value: null, node: null };
}

module.exports = {
  OPERATOR_SYMBOLS,
  KEYWORDS,
  skipSpace,
  getCommentBlock,
  getLiteralMatch,
  getLiteralMatchArray,
  getIdentifier,
  getKeyWordLiteral,
  getInt,
  getNumber,
  getSimpleString,
  ParseNode,
  ParseNodeType
};
