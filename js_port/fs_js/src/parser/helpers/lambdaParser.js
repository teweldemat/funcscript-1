module.exports = function createLambdaParser(env) {
  const { skipSpace, getLiteralMatch, getIdentifier } = env.utils;

  function getIdentifierList(exp, index) {
    let i = skipSpace(exp, index);
    if (i >= exp.length || exp[i] !== '(') {
      return { next: index, identifiers: null };
    }
    i += 1;
    const identifiers = [];
    i = skipSpace(exp, i);
    while (i < exp.length) {
      const idRes = getIdentifier(exp, i);
      if (idRes.next === i) {
        break;
      }
      identifiers.push(idRes.identifier);
      i = skipSpace(exp, idRes.next);
      if (i < exp.length && exp[i] === ',') {
        i += 1;
        i = skipSpace(exp, i);
        continue;
      }
      break;
    }
    if (i >= exp.length || exp[i] !== ')') {
      return { next: index, identifiers: null };
    }
    i += 1;
    return { next: i, identifiers };
  }

  return function getLambdaExpression(context, exp, index, errors) {
    const listRes = getIdentifierList(exp, index);
    if (listRes.next === index) {
      return { next: index, func: null };
    }
    let i = skipSpace(exp, listRes.next);
    if (i + 1 >= exp.length || getLiteralMatch(exp, i, '=>') === i) {
      errors.push({ position: i, message: "'=>' expected" });
      return { next: index, func: null };
    }
    i += 2;
    i = skipSpace(exp, i);

    const exprRes = env.getExpression(context, exp, i, errors);
    if (!exprRes.block) {
      errors.push({ position: i, message: 'Lambda body expression expected' });
      return { next: index, func: null };
    }
    i = exprRes.next;

    const func = new env.ExpressionFunction(listRes.identifiers, exprRes.block);
    return { next: i, func };
  };
};
