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
    let closeIndex = null;

    const immediateClose = getLiteralMatch(exp, i, ']');
    if (immediateClose > i) {
      closeIndex = immediateClose;
      i = skipSpace(exp, immediateClose);
    } else {
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
        const trailingClose = getLiteralMatch(exp, i, ']');
        if (trailingClose > i) {
          closeIndex = trailingClose;
          i = skipSpace(exp, trailingClose);
          break;
        }
      }
      if (closeIndex === null) {
        closeIndex = getLiteralMatch(exp, i, ']');
        if (closeIndex === i) {
          errors.push({ position: i, message: "']' expected" });
          return { next: index, block: null, node: null };
        }
        i = skipSpace(exp, closeIndex);
      }
    }

    const list = new ListExpression();
    list.ValueExpressions = expressions;
    list.Pos = index;
    list.Length = closeIndex - index;
    const node = new env.ParseNode(env.ParseNodeType.List, index, closeIndex - index, nodeItems);
    return { next: i, block: list, node };
  };
};
