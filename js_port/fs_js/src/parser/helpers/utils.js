const { makeValue, typedNull } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');

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

function skipSpace(exp, index) {
  let i = index;
  while (i < exp.length) {
    if (isCharWhiteSpace(exp[i])) {
      i += 1;
      continue;
    }
    if (exp[i] === '/' && exp[i + 1] === '/') {
      i += 2;
      while (i < exp.length && exp[i] !== '\n') i += 1;
      continue;
    }
    break;
  }
  return i;
}

function getLiteralMatch(exp, index, ...keywords) {
  return getLiteralMatchArray(exp, index, keywords);
}

function getLiteralMatchArray(exp, index, keywords) {
  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();
    const len = lowerKeyword.length;
    if (index + len > exp.length) continue;
    let matched = true;
    for (let i = 0; i < len; i += 1) {
      if (exp[index + i].toLowerCase() !== lowerKeyword[i]) {
        matched = false;
        break;
      }
    }
    if (matched) {
      return index + len;
    }
  }
  return index;
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
    return { next: index, identifier: null, identifierLower: null };
  }
  i += 1;
  while (i < exp.length && isIdentifierOtherChar(exp[i])) {
    i += 1;
  }
  const identifier = exp.substring(index, i);
  const lower = identifier.toLowerCase();
  if (KEYWORDS.has(lower)) {
    return { next: index, identifier: null, identifierLower: null };
  }
  return { next: i, identifier, identifierLower: lower };
}

function getKeyWordLiteral(exp, index) {
  let i = getLiteralMatch(exp, index, 'null');
  if (i > index) {
    return { next: i, value: typedNull() };
  }
  i = getLiteralMatch(exp, index, 'true');
  if (i > index) {
    return { next: i, value: makeValue(FSDataType.Boolean, true) };
  }
  i = getLiteralMatch(exp, index, 'false');
  if (i > index) {
    return { next: i, value: makeValue(FSDataType.Boolean, false) };
  }
  return { next: index, value: null };
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
  while (i < exp.length && /[0-9]/.test(exp[i])) {
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
    return { next: index, value: null };
  }
  let digits = intRes.value;
  i = intRes.next;

  let next = getLiteralMatch(exp, i, '.');
  if (next > i) {
    hasDecimal = true;
    i = next;
    const decRes = getInt(exp, false, i);
    i = decRes.next;
    digits += decRes.value ? decRes.value.substring(1) : '';
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
      return { next: index, value: null };
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
      return { next: i, value: makeValue(FSDataType.BigInteger, value) };
    } catch (err) {
      errors.push({ position: index, message: err.message });
      return { next: index, value: null };
    }
  }

  if (hasDecimal || hasExp) {
    const value = Number(literal);
    if (Number.isNaN(value)) {
      errors.push({ position: index, message: `Invalid number '${literal}'` });
      return { next: index, value: null };
    }
    return { next: i, value: makeValue(FSDataType.Float, value) };
  }

  try {
    const big = BigInt(literal);
    if (big > MAX_INT_LITERAL || big < MIN_INT_LITERAL) {
      errors.push({ position: index, message: `Invalid number '${literal}'` });
      return { next: index, value: null };
    }
    const intValue = Number(big);
    if (!Number.isNaN(intValue) && Number.isInteger(intValue)) {
      return { next: i, value: makeValue(FSDataType.Integer, intValue) };
    }
  } catch (err) {
    errors.push({ position: index, message: err.message });
    return { next: index, value: null };
  }

  errors.push({ position: index, message: `Invalid number '${literal}'` });
  return { next: index, value: null };
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
      return { next: index, value: null };
    }
  }
  const delimiter = exp[index];
  let result = '';
  while (i < exp.length) {
    if (exp[i] === delimiter) {
      i += 1;
      return { next: i, value: makeValue(FSDataType.String, result) };
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
          return { next: index, value: null };
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
  return { next: index, value: null };
}

module.exports = {
  OPERATOR_SYMBOLS,
  KEYWORDS,
  skipSpace,
  getLiteralMatch,
  getLiteralMatchArray,
  getIdentifier,
  getKeyWordLiteral,
  getInt,
  getNumber,
  getSimpleString
};
