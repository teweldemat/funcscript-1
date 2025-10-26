const { LiteralBlock } = require('../block/LiteralBlock');
const { ReferenceBlock } = require('../block/ReferenceBlock');
const { FunctionCallExpression } = require('../block/FunctionCallExpression');
const { ListExpression } = require('../block/ListExpression');
const { KvcExpression, KeyValueExpression } = require('../block/KvcExpression');
const { SelectorExpression } = require('../block/SelectorExpression');
const { ExpressionFunction } = require('../core/ExpressionFunction');
const { ensureTyped, typeOf, valueOf, makeValue, typedNull } = require('../core/value');
const { FSDataType } = require('../core/fstypes');

const utils = require('./helpers/utils');
const { CallType } = require('../core/functionBase');
const createListParser = require('./helpers/listParser');
const createKvcParser = require('./helpers/kvcParser');
const createUnitParser = require('./helpers/unitParser');
const createCallAndMemberParser = require('./helpers/callAndMemberParser');
const createInfixParser = require('./helpers/infixParser');
const createLambdaParser = require('./helpers/lambdaParser');
const createPrefixParser = require('./helpers/prefixParser');
const createExpressionParser = require('./helpers/expressionParser');
const createCaseParser = require('./helpers/caseParser');
const createSwitchParser = require('./helpers/switchParser');

const env = {
  utils,
  ListExpression,
  KvcExpression,
  KeyValueExpression,
  FunctionCallExpression,
  LiteralBlock,
  ReferenceBlock,
  SelectorExpression,
  ExpressionFunction,
  makeValue,
  typedNull,
  ensureTyped,
  typeOf,
  valueOf,
  FSDataType,
  CallType
};

const getListExpression = createListParser(env);
const getKvcExpression = createKvcParser(env);
const { getUnit, getExpInParenthesis } = createUnitParser(env);
const { getFunctionCallParametersList, getCallAndMemberAccess } = createCallAndMemberParser(env);
const {
  getInfixExpression,
  getInfixExpressionSingleLevel,
  getPrefixOrCall,
  getGeneralInfixFunctionCall
} = createInfixParser(env);
const getLambdaExpression = createLambdaParser(env);
const { getPrefixOperator } = createPrefixParser(env);
const { getExpression } = createExpressionParser(env);
const getCaseExpression = createCaseParser(env);
const getSwitchExpression = createSwitchParser(env);

env.getListExpression = getListExpression;
env.getKvcExpression = getKvcExpression;
env.getUnit = getUnit;
env.getExpInParenthesis = getExpInParenthesis;
env.getFunctionCallParametersList = getFunctionCallParametersList;
env.getCallAndMemberAccess = getCallAndMemberAccess;
env.getInfixExpression = getInfixExpression;
env.getInfixExpressionSingleLevel = getInfixExpressionSingleLevel;
env.makeValue = makeValue;
env.FSDataType = FSDataType;
env.ensureTyped = ensureTyped;
env.valueOf = valueOf;
env.typeOf = typeOf;
env.typedNull = typedNull;
env.SelectorExpression = SelectorExpression;
env.getLambdaExpression = getLambdaExpression;
env.ExpressionFunction = ExpressionFunction;
env.getPrefixOperator = getPrefixOperator;
env.getPrefixOrCall = getPrefixOrCall;
env.getExpression = getExpression;
env.getCaseExpression = getCaseExpression;
env.getSwitchExpression = getSwitchExpression;
env.getGeneralInfixFunctionCall = getGeneralInfixFunctionCall;

function getRootExpression(context, exp, index, errors) {
  const kvcRes = getKvcExpression(context, exp, index, errors);
  if (!kvcRes.block) {
    return getExpression(context, exp, index, errors);
  }

  const end = utils.skipSpace(exp, kvcRes.next);
  if (end === exp.length) {
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
