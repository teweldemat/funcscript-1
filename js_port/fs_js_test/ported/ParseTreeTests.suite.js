const { assert, runCase, finalizeSuite, DefaultFsDataProvider } = require('./common');
const { FuncScriptParser, ParseNodeType } = require('../../fs_js/src/parser/FuncScriptParser');
const { colorParseTree } = require('../../fs_js/src/FuncScript');

function flattenSingleChild(node) {
  let current = node;
  while (current && Array.isArray(current.Childs) && current.Childs.length === 1) {
    current = current.Childs[0];
  }
  return current;
}

function run() {
  const suite = {};

  function assertTreeSpanConsistency(node) {
    if (!node || !Array.isArray(node.Childs) || node.Childs.length === 0) {
      return;
    }

    let left = node.Pos;
    const nodeEnd = node.Pos + node.Length;

    for (const child of node.Childs) {
      assert.ok(child.Pos >= left, 'Child nodes must appear in order');
      assertTreeSpanConsistency(child);
      left = child.Pos + child.Length;
      assert.ok(
        left <= nodeEnd,
        `Child node ${child.NodeType} spans beyond parent ${node.NodeType}`
      );
    }
  }

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

  runCase(suite, 'ColorParseTreeSegments', () => {
    const provider = new DefaultFsDataProvider();
    const expression = '1+sin(45)';

    const { parseNode } = FuncScriptParser.parse(provider, expression);

    assert.ok(parseNode, 'Expected parse node for expression');
    assertTreeSpanConsistency(parseNode);

    const segments = colorParseTree(parseNode);
    assert.strictEqual(segments.length, 6);

    let p = 0;
    let i = 0;

    let seg = segments[i++];
    assert.strictEqual(seg.NodeType, ParseNodeType.LiteralInteger);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 1);
    p += 1;

    seg = segments[i++];
    assert.strictEqual(seg.NodeType, ParseNodeType.Operator);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 1);
    p += 1;

    seg = segments[i++];
    assert.strictEqual(seg.NodeType, ParseNodeType.Identifier);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 3);
    p += 3;

    seg = segments[i++];
    assert.strictEqual(seg.NodeType, ParseNodeType.FunctionParameterList);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 1);
    p += 1;

    seg = segments[i++];
    assert.strictEqual(seg.NodeType, ParseNodeType.LiteralInteger);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 2);
    p += 2;

    seg = segments[i++];
    assert.strictEqual(seg.NodeType, ParseNodeType.FunctionParameterList);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 1);
    p += 1;

    assert.strictEqual(p, expression.length, 'Segments should cover the full expression');
  });

  runCase(suite, 'ColorParseTreeLambdaSegments', () => {
    const provider = new DefaultFsDataProvider();
    const expression = '(x)=>45';

    const { parseNode } = FuncScriptParser.parse(provider, expression);

    assert.ok(parseNode, 'Expected parse node for lambda expression');
    assertTreeSpanConsistency(parseNode);

    const segments = colorParseTree(parseNode);
    assert.strictEqual(segments.length, 5);

    let p = 0;
    let index = 0;

    let seg = segments[index++];
    assert.strictEqual(seg.NodeType, ParseNodeType.IdentiferList);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 1);
    p += 1;

    seg = segments[index++];
    assert.strictEqual(seg.NodeType, ParseNodeType.Identifier);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 1);
    p += 1;

    seg = segments[index++];
    assert.strictEqual(seg.NodeType, ParseNodeType.IdentiferList);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 1);
    p += 1;

    seg = segments[index++];
    assert.strictEqual(seg.NodeType, ParseNodeType.LambdaExpression);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 2);
    p += 2;

    seg = segments[index++];
    assert.strictEqual(seg.NodeType, ParseNodeType.LiteralInteger);
    assert.strictEqual(seg.Pos, p);
    assert.strictEqual(seg.Length, 2);
    p += 2;

    assert.strictEqual(p, expression.length, 'Segments should cover full lambda expression');
  });

  finalizeSuite('ParseTreeTests', suite);
}

module.exports = {
  run
};
