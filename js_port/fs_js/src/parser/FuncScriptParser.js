const { LiteralBlock } = require('../block/LiteralBlock');
const { ReferenceBlock } = require('../block/ReferenceBlock');
const { FunctionCallExpression } = require('../block/FunctionCallExpression');
const { ListExpression } = require('../block/ListExpression');
const { KvcExpression, KeyValueExpression } = require('../block/KvcExpression');
const { ensureTyped, typeOf, valueOf, makeValue, typedNull } = require('../core/value');
const { FSDataType } = require('../core/fstypes');

const utils = require('./helpers/utils');
const createListParser = require('./helpers/listParser');
const createKvcParser = require('./helpers/kvcParser');
const createUnitParser = require('./helpers/unitParser');
const createCallAndMemberParser = require('./helpers/callAndMemberParser');
const createInfixParser = require('./helpers/infixParser');

const env = {
  utils,
  ListExpression,
  KvcExpression,
  KeyValueExpression,
  FunctionCallExpression,
  LiteralBlock,
  ReferenceBlock,
  makeValue,
  typedNull,
  ensureTyped,
  typeOf,
  valueOf,
  FSDataType
};

const getListExpression = createListParser(env);
const getKvcExpression = createKvcParser(env);
const { getUnit, getExpInParenthesis } = createUnitParser(env);
const { getFunctionCallParametersList, getCallAndMemberAccess } = createCallAndMemberParser(env);
const { getExpression } = createInfixParser(env);

env.getListExpression = getListExpression;
env.getKvcExpression = getKvcExpression;
env.getUnit = getUnit;
env.getExpInParenthesis = getExpInParenthesis;
env.getFunctionCallParametersList = getFunctionCallParametersList;
env.getCallAndMemberAccess = getCallAndMemberAccess;
env.getExpression = getExpression;
env.makeValue = makeValue;
env.FSDataType = FSDataType;
env.ensureTyped = ensureTyped;
env.valueOf = valueOf;
env.typeOf = typeOf;
env.typedNull = typedNull;

function getRootExpression(context, exp, index, errors) {
  const kvcRes = getKvcExpression(context, exp, index, errors);
  if (kvcRes.block) {
    return kvcRes;
  }
  return getExpression(context, exp, index, errors);
}

class FuncScriptParser {
  static parse(context, exp) {
    const expression = exp ?? '';
    const errors = [];
    const result = getRootExpression(context, expression, 0, errors);
    if (!result.block) {
      const message = errors.length ? errors[0].message : 'Invalid expression';
      throw new Error(`Parse error: ${message}`);
    }

    const end = utils.skipSpace(expression, result.next);
    if (end !== expression.length) {
      throw new Error('Unexpected characters after expression');
    }

    return result.block;
  }
}

module.exports = {
  FuncScriptParser
};
