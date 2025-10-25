module.exports = function createKvcParser(env) {
  const { KvcExpression, KeyValueExpression } = env;
  const { skipSpace, getLiteralMatch, getIdentifier } = env.utils;

  return function getKvcExpression(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const open = getLiteralMatch(exp, i, '{');
    if (open === i) {
      return { next: index, block: null };
    }
    i = skipSpace(exp, open);

    const entries = [];
    let returnExpression = null;
    let firstItem = true;

    while (true) {
      if (!firstItem) {
        const separator = getLiteralMatch(exp, i, ';', ',');
        if (separator === i) {
          break;
        }
        i = skipSpace(exp, separator);
      }
      firstItem = false;

      const maybeReturn = getLiteralMatch(exp, i, 'return');
      if (maybeReturn > i) {
        if (returnExpression) {
          errors.push({ position: i, message: 'Duplicate return statement' });
          return { next: index, block: null };
        }
        i = skipSpace(exp, maybeReturn);
        const expressionRes = env.getExpression(context, exp, i, errors);
        if (!expressionRes.block) {
          errors.push({ position: i, message: 'Expression expected after return' });
          return { next: index, block: null };
        }
        returnExpression = expressionRes.block;
        i = skipSpace(exp, expressionRes.next);
        continue;
      }

      const idRes = getIdentifier(exp, i);
      if (idRes.next === i) {
        break;
      }
      i = skipSpace(exp, idRes.next);
      const colon = getLiteralMatch(exp, i, ':');
      if (colon === i) {
        errors.push({ position: i, message: "':' expected" });
        return { next: index, block: null };
      }
      i = skipSpace(exp, colon);

      const valueRes = env.getExpression(context, exp, i, errors);
      if (!valueRes.block) {
        errors.push({ position: i, message: 'Expression expected for key value' });
        return { next: index, block: null };
      }
      const kv = new KeyValueExpression();
      kv.Key = idRes.identifier;
      kv.ValueExpression = valueRes.block;
      entries.push(kv);
      i = skipSpace(exp, valueRes.next);
    }

    const close = getLiteralMatch(exp, i, '}');
    if (close === i) {
      errors.push({ position: i, message: "'}' expected" });
      return { next: index, block: null };
    }
    i = skipSpace(exp, close);

    const kvc = new KvcExpression();
    const error = kvc.SetKeyValues(entries, returnExpression);
    if (error) {
      errors.push({ position: index, message: error });
      return { next: index, block: null };
    }
    kvc.Pos = index;
    kvc.Length = i - index;
    return { next: i, block: kvc };
  };
};
