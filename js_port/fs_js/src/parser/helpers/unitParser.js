module.exports = function createUnitParser(env) {
  const { LiteralBlock, ReferenceBlock } = env;
  const {
    skipSpace,
    getSimpleString,
    getNumber,
    getKeyWordLiteral,
    getIdentifier
  } = env.utils;

  function getExpInParenthesis(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const open = env.utils.getLiteralMatch(exp, i, '(');
    if (open === i) {
      return { next: index, block: null };
    }
    i = skipSpace(exp, open);
    const exprRes = env.getExpression(context, exp, i, errors);
    if (!exprRes.block) {
      return { next: index, block: null };
    }
    i = skipSpace(exp, exprRes.next);
    const close = env.utils.getLiteralMatch(exp, i, ')');
    if (close === i) {
      errors.push({ position: i, message: "')' expected" });
      return { next: index, block: null };
    }
    return { next: close, block: exprRes.block };
  }

  function getUnit(context, exp, index, errors) {
    let i = skipSpace(exp, index);

    const strRes = getSimpleString(exp, i, errors);
    if (strRes.next > i) {
      const block = new LiteralBlock(strRes.value);
      block.Pos = index;
      block.Length = strRes.next - index;
      return { next: strRes.next, block };
    }

    const numRes = getNumber(exp, i, errors);
    if (numRes.next > i) {
      const block = new LiteralBlock(numRes.value);
      block.Pos = index;
      block.Length = numRes.next - index;
      return { next: numRes.next, block };
    }

    const listRes = env.getListExpression(context, exp, i, errors);
    if (listRes.next > i) {
      const block = listRes.block;
      block.Pos = index;
      block.Length = listRes.next - index;
      return { next: listRes.next, block };
    }

    const kvcRes = env.getKvcExpression(context, exp, i, errors);
    if (kvcRes.next > i) {
      const block = kvcRes.block;
      block.Pos = index;
      block.Length = kvcRes.next - index;
      return { next: kvcRes.next, block };
    }

    const kwRes = getKeyWordLiteral(exp, i);
    if (kwRes.next > i) {
      const block = new LiteralBlock(kwRes.value);
      block.Pos = index;
      block.Length = kwRes.next - index;
      return { next: kwRes.next, block };
    }

    const idRes = getIdentifier(exp, i);
    if (idRes.next > i) {
      const block = new ReferenceBlock(idRes.identifier);
      block.Pos = index;
      block.Length = idRes.next - index;
      return { next: idRes.next, block };
    }

    const parenRes = getExpInParenthesis(context, exp, i, errors);
    if (parenRes.next > i) {
      const block = parenRes.block;
      block.Pos = index;
      block.Length = parenRes.next - index;
      return { next: parenRes.next, block };
    }

    return { next: index, block: null };
  }

  return {
    getUnit,
    getExpInParenthesis
  };
};
