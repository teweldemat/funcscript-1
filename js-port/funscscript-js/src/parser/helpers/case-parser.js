module.exports = function createCaseParser(env) {
  const { skipSpace, getLiteralMatch } = env.utils;

  return function getCaseExpression(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const keyword = getLiteralMatch(exp, i, 'case');
    if (keyword === i) {
      return { next: index, block: null, node: null };
    }
    const keywordNode = new env.ParseNode(env.ParseNodeType.KeyWord, i, keyword - i);
    i = skipSpace(exp, keyword);

    const parameters = [];
    const parameterNodes = [];

    while (true) {
      if (parameters.length === 0) {
        const conditionRes = env.getExpression(context, exp, i, errors);
        if (!conditionRes.block) {
          errors.push({ position: i, message: 'Case condition expected' });
          return { next: index, block: null, node: null };
        }
        parameters.push(conditionRes.block);
        if (conditionRes.node) {
          parameterNodes.push(conditionRes.node);
        }
        i = skipSpace(exp, conditionRes.next);
      } else {
        const separator = getLiteralMatch(exp, i, ',', ';');
        if (separator === i) {
          break;
        }
        i = skipSpace(exp, separator);
        const conditionRes = env.getExpression(context, exp, i, errors);
        if (!conditionRes.block) {
          break;
        }
        parameters.push(conditionRes.block);
        if (conditionRes.node) {
          parameterNodes.push(conditionRes.node);
        }
        i = skipSpace(exp, conditionRes.next);
      }

      const colon = getLiteralMatch(exp, i, ':');
      if (colon === i) {
        break;
      }
      i = skipSpace(exp, colon);

      const valueRes = env.getExpression(context, exp, i, errors);
      if (!valueRes.block) {
        errors.push({ position: i, message: 'Case value expected' });
        return { next: index, block: null, node: null };
      }
      parameters.push(valueRes.block);
      if (valueRes.node) {
        parameterNodes.push(valueRes.node);
      }
      i = skipSpace(exp, valueRes.next);
    }

    const caseFunc = context.get('case');
    const typed = env.ensureTyped(caseFunc);
    if (env.typeOf(typed) !== env.FSDataType.Function) {
      errors.push({ position: index, message: 'Case function not defined' });
      return { next: index, block: null, node: null };
    }

    const call = new env.FunctionCallExpression(new env.LiteralBlock(typed), parameters);
    call.Pos = index;
    call.Length = i - index;

    const children = [keywordNode, ...parameterNodes.filter(Boolean)].filter(Boolean);
    const caseNode = new env.ParseNode(env.ParseNodeType.Case, index, i - index, children);

    return { next: i, block: call, node: caseNode };
  };
};
