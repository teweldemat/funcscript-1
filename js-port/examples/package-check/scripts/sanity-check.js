const assert = require('node:assert/strict');

const funcscript = require('@tewelde/funcscript');

const { Engine, DefaultFsDataProvider, FuncScriptParser } = funcscript;

function verifyEvaluate() {
  const provider = new DefaultFsDataProvider({ gross: 1250, rate: 0.12 });
  const typed = Engine.evaluate('{ return gross * (1 - rate); }', provider);
  assert.equal(Engine.typeOf(typed), Engine.FSDataType.Number, 'Expected a numeric result');
  assert.equal(Engine.valueOf(typed), 1100, 'Unexpected evaluation result');
}

function verifyTemplate() {
  const provider = new DefaultFsDataProvider({ customer: 'Aster', total: 42 });
  const rendered = Engine.evaluateTemplate('Invoice for ${customer}: ${total}', provider);
  assert.equal(rendered, 'Invoice for Aster: 42');
}

function verifyParser() {
  const { block, parseNode } = FuncScriptParser.parse(new DefaultFsDataProvider(), '1 + 2');
  assert.ok(block, 'Parser did not return a block');
  assert.ok(parseNode, 'Parser did not return a parse node');
}

verifyEvaluate();
verifyTemplate();
verifyParser();

console.log('FuncScript runtime sanity check passed.');
