module.exports = function createExpressionParser(env) {
  function getExpression(context, exp, index, errors) {
    const general = env.getGeneralInfixFunctionCall(context, exp, index, errors);
    if (general.block) {
      return general;
    }
    const infix = env.getInfixExpression(context, exp, index, errors);
    if (infix.block) {
      return infix;
    }

    const prefix = env.getPrefixOperator(context, exp, index, errors);
    if (prefix.block) {
      return prefix;
    }

    return { next: index, block: null };
  }

  return {
    getExpression
  };
};
