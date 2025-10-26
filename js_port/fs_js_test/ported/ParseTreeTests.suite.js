const { assert, runCase, finalizeSuite, DefaultFsDataProvider } = require('./common');
const { FuncScriptParser, ParseNodeType } = require('../../fs_js/src/parser/FuncScriptParser');

function flattenSingleChild(node) {
  let current = node;
  while (current && Array.isArray(current.Childs) && current.Childs.length === 1) {
    current = current.Childs[0];
  }
  return current;
}

function run() {
  const suite = {};

  runCase(suite, 'ParseKvcProducesParseNode', () => {
    const provider = new DefaultFsDataProvider();
    const expression = '{a,b,c}';

    const { block, parseNode } = FuncScriptParser.parse(provider, expression);

    assert.ok(block, 'Expected evaluation block for KVC expression');
    assert.ok(parseNode, 'Expected parse node for KVC expression');

    const flattened = flattenSingleChild(parseNode);
    assert.strictEqual(flattened.NodeType, ParseNodeType.KeyValueCollection);
    assert.strictEqual(flattened.Pos, 0);
    assert.strictEqual(flattened.Length, expression.length);
  });

  runCase(suite, 'ParseSimpleInfixExpressionPositions', () => {
    const provider = new DefaultFsDataProvider();
    const expression = '1+2';

    const { block, parseNode } = FuncScriptParser.parse(provider, expression);

    assert.ok(block, 'Expression should parse to a block');
    assert.ok(parseNode, 'Parse node should be returned for valid expression');

    assert.strictEqual(parseNode.NodeType, ParseNodeType.InfixExpression);
    assert.strictEqual(parseNode.Pos, 0);
    assert.strictEqual(parseNode.Length, expression.length);

    assert.ok(Array.isArray(parseNode.Childs));
    assert.strictEqual(parseNode.Childs.length, 3, 'Infix node should have left, operator, right children');

    const [left, operator, right] = parseNode.Childs;

    assert.strictEqual(left.NodeType, ParseNodeType.LiteralInteger);
    assert.strictEqual(left.Pos, 0);
    assert.strictEqual(left.Length, 1);

    assert.strictEqual(operator.NodeType, ParseNodeType.Operator);
    assert.strictEqual(operator.Pos, 1);
    assert.strictEqual(operator.Length, 1);

    assert.strictEqual(right.NodeType, ParseNodeType.LiteralInteger);
    assert.strictEqual(right.Pos, 2);
    assert.strictEqual(right.Length, 1);

    // evaluation tree positions (FunctionCallExpression and parameters)
    assert.strictEqual(block.Pos, 0);
    assert.strictEqual(block.Length, expression.length);

    const fnExpr = block.Function;
    assert.strictEqual(fnExpr.Pos, 1);
    assert.strictEqual(fnExpr.Length, 1);

    const [leftBlock, rightBlock] = block.Parameters;
    assert.strictEqual(leftBlock.Pos, 0);
    assert.strictEqual(leftBlock.Length, 1);
    assert.strictEqual(rightBlock.Pos, 2);
    assert.strictEqual(rightBlock.Length, 1);
  });

  finalizeSuite('ParseTreeTests', suite);
}

module.exports = {
  run
};
