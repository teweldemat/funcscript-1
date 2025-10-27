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
      return {
        key,
        keyLower: key.toLowerCase(),
        next: strRes.next,
        start: index,
        node: strRes.node
      };
    }

    const idRes = getIdentifier(exp, index);
    if (idRes.next === index) {
      return null;
    }
    return {
      key: idRes.identifier,
      keyLower: idRes.identifierLower || idRes.identifier.toLowerCase(),
      next: idRes.next,
      start: index,
      node: idRes.node
    };
  }

  function buildKvc(entries, returnExpression, entryNodes, startIndex, endIndex, errors) {
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
    const node = new env.ParseNode(
      env.ParseNodeType.KeyValueCollection,
      startIndex,
      endIndex - startIndex,
      entryNodes
    );
    return { block: kvc, node };
  }

  function createImplicitReference(keyRes) {
    const reference = new env.ReferenceBlock(keyRes.key);
    reference.Pos = keyRes.start;
    reference.Length = keyRes.next - keyRes.start;
    return reference;
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
    const entryNodes = [];
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
        const keywordNode = new env.ParseNode(env.ParseNodeType.KeyWord, i, maybeReturn - i);
        i = skipSpace(exp, maybeReturn);
        const expressionRes = env.getExpression(context, exp, i, errors);
        if (!expressionRes.block) {
          errors.push({ position: i, message: 'Expression expected after return' });
          return null;
        }
        returnExpression = expressionRes.block;
        const returnNode = new env.ParseNode(
          env.ParseNodeType.ExpressionInBrace,
          keywordNode.Pos,
          expressionRes.next - keywordNode.Pos,
          [keywordNode, expressionRes.node]
        );
        entryNodes.push(returnNode);
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
        kv.ValueExpression = createImplicitReference(keyRes);
        entries.push(kv);
        if (keyRes.node) {
          entryNodes.push(keyRes.node);
        }
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

      const keyLength = keyRes.node ? keyRes.node.Length : keyRes.next - keyRes.start;
      const keyNode = new env.ParseNode(env.ParseNodeType.Key, keyRes.start, keyLength, keyRes.node?.Childs);
      const children = [];
      if (keyNode) {
        children.push(keyNode);
      }
      if (valueRes.node) {
        children.push(valueRes.node);
      }
      const pairNode = new env.ParseNode(
        env.ParseNodeType.KeyValuePair,
        keyRes.start,
        valueRes.next - keyRes.start,
        children
      );
      entryNodes.push(pairNode);
      i = skipSpace(exp, valueRes.next);
    }

    if (requireClosing) {
      const close = getLiteralMatch(exp, i, '}');
      if (close === i) {
        errors.push({ position: i, message: "'}' expected" });
        return null;
      }
      const result = buildKvc(entries, returnExpression, entryNodes, startOverride, close, errors);
      if (!result) {
        return null;
      }
      return { next: skipSpace(exp, close), block: result.block, node: result.node };
    }

    const result = buildKvc(entries, returnExpression, entryNodes, startOverride, i, errors);
    if (!result) {
      return null;
    }
    return { next: skipSpace(exp, i), block: result.block, node: result.node };
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
      return { next: index, block: null, node: null };
    }
    i = skipSpace(exp, open);
    const withBraces = parseEntries(context, exp, i, errors, {
      start: index,
      allowImplicit: true
    });
    if (!withBraces) {
      return { next: index, block: null, node: null };
    }
    return withBraces;
  };
};
