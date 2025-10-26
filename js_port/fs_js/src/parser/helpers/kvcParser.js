module.exports = function createKvcParser(env) {
  const { KvcExpression, KeyValueExpression } = env;
  const { skipSpace, getLiteralMatch, getIdentifier, getSimpleString } = env.utils;

  function parseKey(exp, index, errors) {
    const probeErrors = [];
    const strRes = getSimpleString(exp, index, probeErrors);
    if (probeErrors.length) {
      errors.push(...probeErrors);
      return null;
    }
    if (strRes.next > index) {
      const key = env.valueOf(strRes.value);
      return { key, keyLower: key.toLowerCase(), next: strRes.next, start: index };
    }
    const idRes = getIdentifier(exp, index);
    if (idRes.next === index) {
      return null;
    }
    return {
      key: idRes.identifier,
      keyLower: idRes.identifierLower || idRes.identifier.toLowerCase(),
      next: idRes.next,
      start: index
    };
  }

  function buildKvc(entries, returnExpression, startIndex, endIndex, errors) {
    if (!entries.length && !returnExpression) {
      return null;
    }
    const kvc = new KvcExpression();
    const error = kvc.SetKeyValues(entries, returnExpression);
    if (error) {
      errors.push({ position: startIndex, message: error });
      return null;
    }
    kvc.Pos = startIndex;
    kvc.Length = endIndex - startIndex;
    return kvc;
  }

  function parseEntries(
    context,
    exp,
    index,
    errors,
    { requireClosing = true, start: startOverride = index, allowImplicit = false } = {}
  ) {
    let i = skipSpace(exp, index);

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
          return null;
        }
        i = skipSpace(exp, maybeReturn);
        const expressionRes = env.getExpression(context, exp, i, errors);
        if (!expressionRes.block) {
          errors.push({ position: i, message: 'Expression expected after return' });
          return null;
        }
        returnExpression = expressionRes.block;
        i = skipSpace(exp, expressionRes.next);
        continue;
      }

      const keyRes = parseKey(exp, i, errors);
      if (!keyRes) {
        break;
      }

      i = skipSpace(exp, keyRes.next);
      const colon = getLiteralMatch(exp, i, ':');
      if (colon === i) {
        if (!allowImplicit) {
          errors.push({ position: i, message: "':' expected" });
          return null;
        }
        const kv = new KeyValueExpression();
        kv.Key = keyRes.key;
        kv.KeyLower = keyRes.keyLower;
        kv.ValueExpression = new env.ReferenceBlock(
          keyRes.key,
          keyRes.start,
          keyRes.next - keyRes.start,
          false
        );
        entries.push(kv);
        continue;
      }
      i = skipSpace(exp, colon);

      const valueRes = env.getExpression(context, exp, i, errors);
      if (!valueRes.block) {
        errors.push({ position: i, message: 'Expression expected for key value' });
        return null;
      }
      const kv = new KeyValueExpression();
      kv.Key = keyRes.key;
      kv.KeyLower = keyRes.keyLower;
      kv.ValueExpression = valueRes.block;
      entries.push(kv);
      i = skipSpace(exp, valueRes.next);
    }

    if (requireClosing) {
      const close = getLiteralMatch(exp, i, '}');
      if (close === i) {
        errors.push({ position: i, message: "'}' expected" });
        return null;
      }
      const block = buildKvc(entries, returnExpression, startOverride, close, errors);
      if (!block) {
        return null;
      }
      return { next: skipSpace(exp, close), block };
    }

    const block = buildKvc(entries, returnExpression, startOverride, i, errors);
    if (!block) {
      return null;
    }
    return { next: skipSpace(exp, i), block };
  }

  return function getKvcExpression(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const open = getLiteralMatch(exp, i, '{');
    if (open === i) {
      const naked = parseEntries(context, exp, index, errors, {
        requireClosing: false,
        start: index,
        allowImplicit: false
      });
      if (naked) {
        return naked;
      }
      return { next: index, block: null };
    }
    i = skipSpace(exp, open);
    const withBraces = parseEntries(context, exp, i, errors, {
      start: index,
      allowImplicit: true
    });
    if (!withBraces) {
      return { next: index, block: null };
    }
    return withBraces;
  };
};
