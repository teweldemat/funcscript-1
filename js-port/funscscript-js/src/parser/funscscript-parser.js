const { LiteralBlock } = require('../block/literal-block');
const { ReferenceBlock } = require('../block/reference-block');
const { FunctionCallExpression } = require('../block/function-call-expression');
const { ListExpression } = require('../block/list-expression');
const { KvcExpression, KeyValueExpression } = require('../block/kvc-expression');
const { SelectorExpression } = require('../block/selector-expression');
const { ExpressionFunction } = require('../core/expression-function');
const { ensureTyped, typeOf, valueOf, makeValue, typedNull } = require('../core/value');
const { FSDataType } = require('../core/fstypes');

const utils = require('./helpers/utils');
const { CallType } = require('../core/function-base');
const { ParseNode, ParseNodeType } = require('./parse-node');
const createListParser = require('./helpers/list-parser');
const createKvcParser = require('./helpers/kvc-parser');
const createUnitParser = require('./helpers/unit-parser');
const createCallAndMemberParser = require('./helpers/call-and-member-parser');
const createInfixParser = require('./helpers/infix-parser');
const createLambdaParser = require('./helpers/lambda-parser');
const createPrefixParser = require('./helpers/prefix-parser');
const createExpressionParser = require('./helpers/expression-parser');
const createCaseParser = require('./helpers/case-parser');
const createSwitchParser = require('./helpers/switch-parser');

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
  CallType,
  ParseNode,
  ParseNodeType
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
  const kvcRes = getKvcExpression(context, exp, index, errors, { allowNaked: true });
  if (kvcRes.block) {
    const end = utils.skipSpace(exp, kvcRes.next);
    if (end === exp.length) {
      return kvcRes;
    }
  }
  return getExpression(context, exp, index, errors);
}

class FunscScriptParser {
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

    return { block: result.block, parseNode: result.node };
  }
}

module.exports = {
  FunscScriptParser,
  ParseNodeType,
  ParseNode
};
