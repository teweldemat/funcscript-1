module.exports = function createListParser(env) {
  const { ListExpression } = env;
  const { skipSpace, getLiteralMatch } = env.utils;

  return function getListExpression(context, exp, index, errors) {
    let i = skipSpace(exp, index);
    const open = getLiteralMatch(exp, i, '[');
    if (open === i) {
      return { next: index, block: null, node: null };
    }
    i = skipSpace(exp, open);

    const expressions = [];
    const nodeItems = [];
    const closeImmediately = getLiteralMatch(exp, i, ']') > i;
    if (!closeImmediately) {
      while (true) {
        const item = env.getExpression(context, exp, i, errors);
        if (!item.block) {
          errors.push({ position: i, message: 'List item expected' });
          return { next: index, block: null, node: null };
        }
        expressions.push(item.block);
        if (item.node) {
          nodeItems.push(item.node);
        }
        i = skipSpace(exp, item.next);
        const comma = getLiteralMatch(exp, i, ',');
        if (comma === i) {
          break;
        }
        i = skipSpace(exp, comma);
      }
    } else {
      i = skipSpace(exp, getLiteralMatch(exp, i, ']'));
    }

    const close = getLiteralMatch(exp, i, ']');
    if (close === i) {
      errors.push({ position: i, message: "']' expected" });
      return { next: index, block: null, node: null };
    }

    const list = new ListExpression();
    list.ValueExpressions = expressions;
    list.Pos = index;
    list.Length = close - index;
    const node = new env.ParseNode(env.ParseNodeType.List, index, close - index, nodeItems);
    return { next: close, block: list, node };
  };
};
