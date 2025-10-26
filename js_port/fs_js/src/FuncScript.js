const { FuncScriptParser } = require('./parser/FuncScriptParser');
const dataProviders = require('./core/dataProvider');
const valueModule = require('./core/value');
const { FSDataType, getTypeName } = require('./core/fstypes');
const { CallType, BaseFunction, ParameterList } = require('./core/functionBase');
const { ExpressionFunction } = require('./core/ExpressionFunction');
const { FsList, ArrayFsList } = require('./model/FsList');
const { KeyValueCollection, SimpleKeyValueCollection } = require('./model/KeyValueCollection');
const { FsError } = require('./model/FsError');
const buildBuiltinMap = require('./funcs');

const { MapDataProvider } = dataProviders;
const { ensureTyped } = valueModule;

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
  DefaultFsDataProvider,
  FsDataProvider: dataProviders.FsDataProvider,
  MapDataProvider: dataProviders.MapDataProvider,
  KvcProvider: dataProviders.KvcProvider,
  ensureTyped: valueModule.ensureTyped,
  normalize: valueModule.normalize,
  makeValue: valueModule.makeValue,
  typeOf: valueModule.typeOf,
  valueOf: valueModule.valueOf,
  typedNull: valueModule.typedNull,
  isTyped: valueModule.isTyped,
  expectType: valueModule.expectType,
  convertToCommonNumericType: valueModule.convertToCommonNumericType,
  FSDataType,
  getTypeName,
  CallType,
  BaseFunction,
  ParameterList,
  ExpressionFunction,
  FsList,
  ArrayFsList,
  KeyValueCollection,
  SimpleKeyValueCollection,
  FsError,
  buildBuiltinMap
};
