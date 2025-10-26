module.exports = function createExpressionParser(env) {
  function getExpression(context, exp, index, errors) {
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
