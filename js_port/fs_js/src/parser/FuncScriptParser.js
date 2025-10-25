const { LiteralBlock } = require('../block/LiteralBlock');
const { ReferenceBlock } = require('../block/ReferenceBlock');
const { FunctionCallExpression } = require('../block/FunctionCallExpression');
const { ListExpression } = require('../block/ListExpression');
const { KvcExpression, KeyValueExpression } = require('../block/KvcExpression');
const { ensureTyped, typeOf, valueOf, makeValue, typedNull } = require('../core/value');
const { FSDataType } = require('../core/fstypes');

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
  let expDigits = null;
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
    expDigits = exp.substring(i, expRes.next);
    i = expRes.next;
  }

  if (!hasDecimal) {
    next = getLiteralMatch(exp, i, 'l', 'L');
    if (next > i) {
      hasLong = true;
      i = next;
    }
  }

  let numericLiteral = exp.substring(index, i);
  if (hasDecimal || hasExp) {
    const value = Number(numericLiteral);
    if (Number.isNaN(value)) {
      errors.push({ position: index, message: `Invalid number '${numericLiteral}'` });
      return { next: index, value: null };
    }
    return { next: i, value: makeValue(FSDataType.Float, value) };
  }

  if (hasLong) {
    try {
      const value = BigInt(numericLiteral.slice(0, -1));
      return { next: i, value: makeValue(FSDataType.BigInteger, value) };
    } catch (err) {
      errors.push({ position: index, message: err.message });
      return { next: index, value: null };
    }
  }

  const intValue = Number(numericLiteral);
  if (!Number.isNaN(intValue) && Number.isInteger(intValue)) {
    return { next: i, value: makeValue(FSDataType.Integer, intValue) };
  }

  errors.push({ position: index, message: `Invalid number '${numericLiteral}'` });
  return { next: index, value: null };
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
      const next = exp[i + 1];
      if (next === 'n') result += '\n';
      else if (next === 't') result += '\t';
      else result += next;
      i += 2;
      continue;
    }
    result += exp[i];
    i += 1;
  }
  errors.push({ position: index, message: 'Unterminated string literal' });
  return { next: index, value: null };
}

function getExpInParenthesis(context, exp, index, errors) {
  let i = skipSpace(exp, index);
  const open = getLiteralMatch(exp, i, '(');
  if (open === i) {
    return { next: index, block: null };
  }
  i = skipSpace(exp, open);
  const exprRes = getExpression(context, exp, i, errors);
  if (!exprRes.block) {
    return { next: index, block: null };
  }
  i = skipSpace(exp, exprRes.next);
  const close = getLiteralMatch(exp, i, ')');
  if (close === i) {
    errors.push({ position: i, message: "')' expected" });
    return { next: index, block: null };
  }
  return { next: close, block: exprRes.block };
}

function getUnit(context, exp, index, errors) {
  let i = skipSpace(exp, index);

  let strRes = getSimpleString(exp, i, errors);
  if (strRes.next > i) {
    const block = new LiteralBlock(strRes.value);
    block.Pos = index;
    block.Length = strRes.next - index;
    return { next: strRes.next, block };
  }

  const numRes = getNumber(exp, i, errors);
  if (numRes.next > i) {
    const block = new LiteralBlock(numRes.value);
    block.Pos = index;
    block.Length = numRes.next - index;
    return { next: numRes.next, block };
  }

  const listRes = getListExpression(context, exp, i, errors);
  if (listRes.next > i) {
    const block = listRes.block;
    block.Pos = index;
    block.Length = listRes.next - index;
    return { next: listRes.next, block };
  }

  const kvcRes = getKvcExpression(context, false, exp, i, errors);
  if (kvcRes.next > i) {
    const block = kvcRes.block;
    block.Pos = index;
    block.Length = kvcRes.next - index;
    return { next: kvcRes.next, block };
  }

  const kwRes = getKeyWordLiteral(exp, i);
  if (kwRes.next > i) {
    const block = new LiteralBlock(kwRes.value);
    block.Pos = index;
    block.Length = kwRes.next - index;
    return { next: kwRes.next, block };
  }

  const idRes = getIdentifier(exp, i);
  if (idRes.next > i) {
    const block = new ReferenceBlock(idRes.identifier);
    block.Pos = index;
    block.Length = idRes.next - index;
    return { next: idRes.next, block };
  }

  const parenRes = getExpInParenthesis(context, exp, i, errors);
  if (parenRes.next > i) {
    const block = parenRes.block;
    block.Pos = index;
    block.Length = parenRes.next - index;
    return { next: parenRes.next, block };
  }

  return { next: index, block: null };
}

function getFunctionCallParametersList(context, current, exp, index, errors) {
  let i = skipSpace(exp, index);
  const open = getLiteralMatch(exp, i, '(');
  if (open === i) {
    return { next: index, block: null };
  }
  i = skipSpace(exp, open);
  const parameters = [];
  const immediateClose = getLiteralMatch(exp, i, ')') > i;
  if (!immediateClose) {
    while (true) {
      const paramRes = getExpression(context, exp, i, errors);
      if (!paramRes.block) {
        errors.push({ position: i, message: 'Parameter expected' });
        return { next: index, block: null };
      }
      parameters.push(paramRes.block);
      i = skipSpace(exp, paramRes.next);
      const separator = getLiteralMatch(exp, i, ',');
      if (separator === i) {
        break;
      }
      i = skipSpace(exp, separator);
    }
  } else {
    i = skipSpace(exp, getLiteralMatch(exp, i, ')'));
  }
  const close = getLiteralMatch(exp, i, ')');
  if (close === i) {
    errors.push({ position: i, message: "')' expected" });
    return { next: index, block: null };
  }
  const call = new FunctionCallExpression(current, parameters);
  call.Pos = current.Pos;
  call.Length = close - current.Pos;
  return { next: close, block: call };
}

function getCallAndMemberAccess(context, exp, index, errors) {
  let i = skipSpace(exp, index);
  const unitRes = getUnit(context, exp, i, errors);
  if (!unitRes.block) {
    return { next: index, block: null };
  }
  let current = unitRes.block;
  i = skipSpace(exp, unitRes.next);
  while (true) {
    const callRes = getFunctionCallParametersList(context, current, exp, i, errors);
    if (callRes.next > i) {
      current = callRes.block;
      i = skipSpace(exp, callRes.next);
      continue;
    }
    break;
  }
  return { next: i, block: current };
}

function getOperator(context, candidates, exp, index) {
  for (const op of candidates) {
    const i = getLiteralMatch(exp, index, op);
    if (i > index) {
      const value = context.get(op.toLowerCase ? op.toLowerCase() : op);
      let func = null;
      if (value) {
        const typed = ensureTyped(value);
        if (typeOf(typed) === FSDataType.Function) {
          func = valueOf(typed);
        }
      }
      return { next: i, symbol: op, functionValue: func };
    }
  }
  return { next: index, symbol: null, functionValue: null };
}

function getInfixExpressionSingleLevel(context, level, candidates, exp, index, errors) {
  let i = index;
  let prog = null;
  while (true) {
    if (!prog) {
      let res;
      if (level === 0) {
        res = getCallAndMemberAccess(context, exp, i, errors);
      } else {
        res = getInfixExpressionSingleLevel(context, level - 1, OPERATOR_SYMBOLS[level - 1], exp, i, errors);
      }
      if (!res.block) {
        return { next: index, block: null };
      }
      prog = res.block;
      i = skipSpace(exp, res.next);
      continue;
    }
    const operatorRes = getOperator(context, candidates, exp, i);
    if (operatorRes.next === i || !operatorRes.functionValue) {
      break;
    }
    const symbol = operatorRes.symbol;
    const func = operatorRes.functionValue;
    i = skipSpace(exp, operatorRes.next);

    const operands = [prog];
    while (true) {
      let operandRes;
      if (level === 0) {
        operandRes = getCallAndMemberAccess(context, exp, i, errors);
      } else {
        operandRes = getInfixExpressionSingleLevel(context, level - 1, OPERATOR_SYMBOLS[level - 1], exp, i, errors);
      }
      if (!operandRes.block) {
        errors.push({ position: i, message: `Operand expected for operator ${symbol}` });
        return { next: index, block: null };
      }
      operands.push(operandRes.block);
      i = skipSpace(exp, operandRes.next);
      const repeat = getLiteralMatch(exp, i, symbol);
      if (repeat === i) {
        break;
      }
      i = skipSpace(exp, repeat);
    }

    const call = new FunctionCallExpression(new LiteralBlock(makeValue(FSDataType.Function, func)), operands);
    prog = call;
  }
  return { next: i, block: prog };
}

function getInfixExpression(context, exp, index, errors) {
  return getInfixExpressionSingleLevel(context, OPERATOR_SYMBOLS.length - 1, OPERATOR_SYMBOLS[OPERATOR_SYMBOLS.length - 1], exp, index, errors);
}

function getExpression(context, exp, index, errors) {
  const infix = getInfixExpression(context, exp, index, errors);
  if (infix.block) {
    return infix;
  }
  return { next: index, block: null };
}

function getListExpression(context, exp, index, errors) {
  let i = skipSpace(exp, index);
  const open = getLiteralMatch(exp, i, '[');
  if (open === i) {
    return { next: index, block: null };
  }
  i = skipSpace(exp, open);
  const expressions = [];
  const immediateClose = getLiteralMatch(exp, i, ']') > i;
  if (!immediateClose) {
    while (true) {
      const item = getExpression(context, exp, i, errors);
      if (!item.block) {
        errors.push({ position: i, message: 'List item expected' });
        return { next: index, block: null };
      }
      expressions.push(item.block);
      i = skipSpace(exp, item.next);
      const comma = getLiteralMatch(exp, i, ',');
      if (comma === i) {
        break;
      }
      i = skipSpace(exp, comma);
    }
  } else {
    i = skipSpace(exp, getLiteralMatch(exp, i, ']'));
  }
  const close = getLiteralMatch(exp, i, ']');
  if (close === i) {
    errors.push({ position: i, message: "']' expected" });
    return { next: index, block: null };
  }
  const list = new ListExpression();
  list.ValueExpressions = expressions;
  list.Pos = index;
  list.Length = close - index;
  return { next: close, block: list };
}

function getKvcExpression(context, nakedMode, exp, index, errors) {
  let i = skipSpace(exp, index);
  const open = getLiteralMatch(exp, i, '{');
  if (open === i) {
    return { next: index, block: null };
  }
  i = skipSpace(exp, open);

  const entries = [];
  let returnExpression = null;
  let firstIteration = true;
  while (true) {
    if (!firstIteration) {
      const separator = getLiteralMatch(exp, i, ';', ',');
      if (separator === i) {
        break;
      }
      i = skipSpace(exp, separator);
    }
    firstIteration = false;

    const returnMatch = getLiteralMatch(exp, i, 'return');
    if (returnMatch > i) {
      if (returnExpression) {
        errors.push({ position: i, message: 'Duplicate return statement' });
        return { next: index, block: null };
      }
      i = skipSpace(exp, returnMatch);
      const exprRes = getExpression(context, exp, i, errors);
      if (!exprRes.block) {
        errors.push({ position: i, message: 'Expression expected after return' });
        return { next: index, block: null };
      }
      returnExpression = exprRes.block;
      i = skipSpace(exp, exprRes.next);
      continue;
    }

    const idRes = getIdentifier(exp, i);
    if (idRes.next === i) {
      break;
    }
    i = skipSpace(exp, idRes.next);
    const colon = getLiteralMatch(exp, i, ':');
    if (colon === i) {
      errors.push({ position: i, message: "':' expected" });
      return { next: index, block: null };
    }
    i = skipSpace(exp, colon);
    const valueRes = getExpression(context, exp, i, errors);
    if (!valueRes.block) {
      errors.push({ position: i, message: 'Expression expected for key value' });
      return { next: index, block: null };
    }
    const kv = new KeyValueExpression();
    kv.Key = idRes.identifier;
    kv.ValueExpression = valueRes.block;
    entries.push(kv);
    i = skipSpace(exp, valueRes.next);
  }

  const close = getLiteralMatch(exp, i, '}');
  if (close === i) {
    errors.push({ position: i, message: "'}' expected" });
    return { next: index, block: null };
  }
  i = skipSpace(exp, close);

  const kvc = new KvcExpression();
  const error = kvc.SetKeyValues(entries, returnExpression);
  if (error) {
    errors.push({ position: index, message: error });
    return { next: index, block: null };
  }
  kvc.Pos = index;
  kvc.Length = i - index;
  return { next: i, block: kvc };
}

function getRootExpression(context, exp, index, errors) {
  const kvc = getKvcExpression(context, true, exp, index, errors);
  if (kvc.block) {
    return kvc;
  }
  return getExpression(context, exp, index, errors);
}

class FuncScriptParser {
  static parse(context, exp) {
    const errors = [];
    const trimmed = exp ?? '';
    const res = getRootExpression(context, trimmed, 0, errors);
    if (!res.block) {
      const message = errors.length ? errors[0].message : 'Invalid expression';
      throw new Error(`Parse error: ${message}`);
    }
    const end = skipSpace(trimmed, res.next);
    if (end !== trimmed.length) {
      throw new Error('Unexpected characters after expression');
    }
    return res.block;
  }
}

module.exports = {
  FuncScriptParser
};
