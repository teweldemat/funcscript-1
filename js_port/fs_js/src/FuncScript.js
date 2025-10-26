const { FuncScriptParser } = require('./parser/FuncScriptParser');
const { MapDataProvider } = require('./core/dataProvider');
const { ensureTyped } = require('./core/value');
const buildBuiltinMap = require('./funcs');

const builtinProvider = new MapDataProvider(buildBuiltinMap());

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
