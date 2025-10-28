module.exports = function createSwitchParser(env) {
  const { skipSpace, getLiteralMatch } = env.utils;

  return function getSwitchExpression(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const keyword = getLiteralMatch(exp, i, 'switch');
    if (keyword === i) {
      return { next: index, block: null, node: null };
    }
    i = skipSpace(exp, keyword);

    const parameters = [];
    const parameterNodes = [];

    const selectorRes = env.getExpression(context, exp, i, errors);
    if (!selectorRes.block) {
      errors.push({ position: i, message: 'Switch selector expected' });
      return { next: index, block: null, node: null };
    }
    parameters.push(selectorRes.block);
    if (selectorRes.node) {
      parameterNodes.push(selectorRes.node);
    }
    i = skipSpace(exp, selectorRes.next);

    while (true) {
      const separator = getLiteralMatch(exp, i, ',', ';');
      if (separator === i) {
        break;
      }
      i = skipSpace(exp, separator);

      const keyRes = env.getExpression(context, exp, i, errors);
      if (!keyRes.block) {
        break;
      }
      i = skipSpace(exp, keyRes.next);

      const colon = getLiteralMatch(exp, i, ':');
      if (colon === i) {
        parameters.push(keyRes.block);
        if (keyRes.node) {
          parameterNodes.push(keyRes.node);
        }
        break;
      }
      i = skipSpace(exp, colon);

      const valueRes = env.getExpression(context, exp, i, errors);
      if (!valueRes.block) {
        errors.push({ position: i, message: 'Switch value expected' });
        return { next: index, block: null, node: null };
      }
      parameters.push(keyRes.block);
      parameters.push(valueRes.block);
      if (keyRes.node) {
        parameterNodes.push(keyRes.node);
      }
      if (valueRes.node) {
        parameterNodes.push(valueRes.node);
      }
      i = skipSpace(exp, valueRes.next);
    }

    const switchFunc = context.get('switch');
    const typed = env.ensureTyped(switchFunc);
    if (env.typeOf(typed) !== env.FSDataType.Function) {
      errors.push({ position: index, message: 'Switch function not defined' });
      return { next: index, block: null, node: null };
    }

    const call = new env.FunctionCallExpression(new env.LiteralBlock(typed), parameters);
    call.Pos = index;
    call.Length = i - index;

    const switchNode = new env.ParseNode(env.ParseNodeType.Case, index, i - index, parameterNodes.filter(Boolean));

    return { next: i, block: call, node: switchNode };
  };
};
