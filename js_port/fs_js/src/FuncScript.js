const { FuncScriptParser } = require('./parser/FuncScriptParser');
const { MapDataProvider } = require('./core/dataProvider');
const { ensureTyped } = require('./core/value');
const { IFFunction } = require('./funcs/logic/IFFunction');

const builtinProvider = new MapDataProvider({
  if: new IFFunction()
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
