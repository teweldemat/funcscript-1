const { FuncScriptParser } = require('./parser/FuncScriptParser');
const { MapDataProvider } = require('./core/dataProvider');
const { ensureTyped } = require('./core/value');
const { IFFunction } = require('./funcs/logic/IFFunction');
const { EqualsFunction } = require('./funcs/logic/EqualsFunction');
const { AddFunction } = require('./funcs/math/AddFunction');
const { SubtractFunction } = require('./funcs/math/SubtractFunction');
const { MultiplyFunction } = require('./funcs/math/MultiplyFunction');
const { DivisionFunction } = require('./funcs/math/DivisionFunction');

const builtinProvider = new MapDataProvider({
  if: new IFFunction(),
  '=': new EqualsFunction(),
  '+': new AddFunction(),
  '-': new SubtractFunction(),
  '*': new MultiplyFunction(),
  '/': new DivisionFunction()
});

class DefaultFsDataProvider extends MapDataProvider {
  constructor(map = {}, parent = builtinProvider) {
    super(map, parent);
  }
}

function evaluate(expression, provider = new DefaultFsDataProvider()) {
  const block = FuncScriptParser.parse(provider, expression);
  if (!block) {
    throw new Error('Failed to parse expression');
  }
  return ensureTyped(block.evaluate(provider));
}

module.exports = {
  evaluate,
  DefaultFsDataProvider
};
