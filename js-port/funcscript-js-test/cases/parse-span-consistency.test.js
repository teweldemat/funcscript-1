const { assert, runCase, finalizeSuite, DefaultFsDataProvider } = require('../ported/common');
const { FuncScriptParser, ParseNodeType } = require('../../funcscript-js/src/parser/funcscript-parser');
const { FunctionCallExpression } = require('../../funcscript-js/src/block/function-call-expression');

function run() {
  const suite = {};

  runCase(suite, 'case expression node span', () => {
    const provider = new DefaultFsDataProvider();
    const expression = 'case true: 1';

    const { parseNode } = FuncScriptParser.parse(provider, expression);

    assert.ok(parseNode, 'Expected parse node');
    assert.strictEqual(parseNode.NodeType, ParseNodeType.Case);
    assert.strictEqual(parseNode.Pos, 0, 'Case node should start at expression start');
    assert.strictEqual(parseNode.Length, expression.length, 'Case node should span entire expression');
  });

  runCase(suite, 'switch expression node span', () => {
    const provider = new DefaultFsDataProvider();
    const expression = 'switch 1, 1: "one"';

    const { parseNode } = FuncScriptParser.parse(provider, expression);

    assert.ok(parseNode, 'Expected parse node');
    assert.strictEqual(parseNode.NodeType, ParseNodeType.Case);
    assert.strictEqual(parseNode.Pos, 0, 'Switch node should start at expression start');
    assert.strictEqual(parseNode.Length, expression.length, 'Switch node should span entire expression');
  });

  runCase(suite, 'general infix spans match operands', () => {
    const provider = new DefaultFsDataProvider();
    const expression = '  ["a","b"] join ","';

    const { block, parseNode } = FuncScriptParser.parse(provider, expression);

    assert.ok(block, 'Expected general infix to produce a block');
    assert.ok(parseNode, 'Expected parse node for general infix expression');
    assert.strictEqual(parseNode.NodeType, ParseNodeType.GeneralInfixExpression);

    const expectedStart = expression.indexOf('[');
    const expectedLength = expression.length - expectedStart;

    assert.strictEqual(parseNode.Pos, expectedStart, 'Parse node should start at first operand');
    assert.strictEqual(parseNode.Length, expectedLength, 'Parse node should span operand range');

    assert.ok(block instanceof FunctionCallExpression, 'General infix should produce FunctionCallExpression');
    assert.strictEqual(block.Pos, expectedStart, 'Block should start at first operand');
    assert.strictEqual(block.Length, expectedLength, 'Block should span operand range');

    const functionLiteral = block.Function;
    const operatorIndex = expression.indexOf('join');
    assert.strictEqual(functionLiteral.Pos, operatorIndex, 'Function literal should start at operator keyword');
    assert.strictEqual(functionLiteral.Length, 'join'.length, 'Function literal should span operator keyword');
  });

  finalizeSuite('parse-span-consistency', suite);
}

module.exports = {
  run
};

