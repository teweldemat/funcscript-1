module.exports = function createLambdaParser(env) {
  const { skipSpace, getLiteralMatch, getIdentifier } = env.utils;

  function getIdentifierList(exp, index) {
    let i = skipSpace(exp, index);
    if (i >= exp.length || exp[i] !== '(') {
      return { next: index, identifiers: null, node: null };
    }
    i += 1;
    const identifiers = [];
    const nodes = [];
    i = skipSpace(exp, i);
    while (i < exp.length) {
      const idRes = getIdentifier(exp, i);
      if (idRes.next === i) {
        break;
      }
      identifiers.push(idRes.identifier);
      if (idRes.node) {
        nodes.push(idRes.node);
      }
      i = skipSpace(exp, idRes.next);
      if (i < exp.length && exp[i] === ',') {
        i += 1;
        i = skipSpace(exp, i);
        continue;
      }
      break;
    }
    if (i >= exp.length || exp[i] !== ')') {
      return { next: index, identifiers: null, node: null };
    }
    i += 1;
    const node = new env.ParseNode(env.ParseNodeType.IdentiferList, index, i - index, nodes);
    return { next: i, identifiers, node };
  }

  return function getLambdaExpression(context, exp, index, errors) {
    const listRes = getIdentifierList(exp, index);
    if (listRes.next === index) {
      return { next: index, func: null, node: null };
    }
    let i = skipSpace(exp, listRes.next);
    const arrow = getLiteralMatch(exp, i, '=>');
    if (arrow === i) {
      errors.push({ position: i, message: "'=>' expected" });
      return { next: index, func: null, node: null };
    }
    i = skipSpace(exp, arrow);

    const exprRes = env.getExpression(context, exp, i, errors);
    if (!exprRes.block) {
      errors.push({ position: i, message: 'Lambda body expression expected' });
      return { next: index, func: null, node: null };
    }
    i = exprRes.next;

    const func = new env.ExpressionFunction(listRes.identifiers || [], exprRes.block);
    const node = new env.ParseNode(
      env.ParseNodeType.LambdaExpression,
      index,
      i - index,
      [listRes.node, exprRes.node]
    );
    return { next: i, func, node };
  };
};
