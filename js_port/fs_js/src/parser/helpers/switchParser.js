module.exports = function createSwitchParser(env) {
  const { skipSpace, getLiteralMatch } = env.utils;

  return function getSwitchExpression(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const keyword = getLiteralMatch(exp, i, 'switch');
    if (keyword === i) {
      return { next: index, block: null };
    }
    i = skipSpace(exp, keyword);

    const parameters = [];
    const selectorRes = env.getExpression(context, exp, i, errors);
    if (!selectorRes.block) {
      errors.push({ position: i, message: 'Switch selector expected' });
      return { next: index, block: null };
    }
    parameters.push(selectorRes.block);
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
        // treat as default value without colon
        parameters.push(keyRes.block);
        break;
      }
      i = skipSpace(exp, colon);

      const valueRes = env.getExpression(context, exp, i, errors);
      if (!valueRes.block) {
        errors.push({ position: i, message: 'Switch value expected' });
        return { next: index, block: null };
      }
      parameters.push(keyRes.block);
      parameters.push(valueRes.block);
      i = skipSpace(exp, valueRes.next);
    }

    if (parameters.length === 1) {
      errors.push({ position: i, message: 'Switch requires at least one case' });
      return { next: index, block: null };
    }

    const switchFunc = context.get('switch');
    const typed = env.ensureTyped(switchFunc);
    if (env.typeOf(typed) !== env.FSDataType.Function) {
      errors.push({ position: index, message: 'Switch function not defined' });
      return { next: index, block: null };
    }

    const call = new env.FunctionCallExpression(new env.LiteralBlock(typed), parameters);
    call.Pos = index;
    call.Length = i - index;
    return { next: i, block: call };
  };
};
