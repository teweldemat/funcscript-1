module.exports = function createExpressionParser(env) {
  function getExpression(context, exp, index, errors) {
    const infix = env.getInfixExpression(context, exp, index, errors);
    if (infix.block) {
      return infix;
    }
    return { next: index, block: null, node: null };
  }

  return {
    getExpression
  };
};
