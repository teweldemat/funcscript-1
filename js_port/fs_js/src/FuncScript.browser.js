const { FuncScriptParser } = require('./parser/FuncScriptParser');
const dataProviders = require('./core/dataProvider');
const valueModule = require('./core/value');
const { FSDataType, getTypeName } = require('./core/fstypes');
const { CallType, BaseFunction, ParameterList } = require('./core/functionBase');
const { ExpressionFunction } = require('./core/ExpressionFunction');
const { FsList, ArrayFsList } = require('./model/FsList');
const { KeyValueCollection, SimpleKeyValueCollection } = require('./model/KeyValueCollection');
const { FsError } = require('./model/FsError');
const buildBrowserBuiltinMap = require('./funcs/index.browser');

const { MapDataProvider, FsDataProvider, KvcProvider } = dataProviders;
const {
  ensureTyped,
  normalize,
  makeValue,
  typeOf,
  valueOf,
  typedNull,
  isTyped,
  expectType,
  convertToCommonNumericType
} = valueModule;

const builtinProvider = new MapDataProvider(buildBrowserBuiltinMap());

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

exports.evaluate = evaluate;
exports.DefaultFsDataProvider = DefaultFsDataProvider;
exports.FsDataProvider = FsDataProvider;
exports.MapDataProvider = MapDataProvider;
exports.KvcProvider = KvcProvider;
exports.ensureTyped = ensureTyped;
exports.normalize = normalize;
exports.makeValue = makeValue;
exports.typeOf = typeOf;
exports.valueOf = valueOf;
exports.typedNull = typedNull;
exports.isTyped = isTyped;
exports.expectType = expectType;
exports.convertToCommonNumericType = convertToCommonNumericType;
exports.FSDataType = FSDataType;
exports.getTypeName = getTypeName;
exports.CallType = CallType;
exports.BaseFunction = BaseFunction;
exports.ParameterList = ParameterList;
exports.ExpressionFunction = ExpressionFunction;
exports.FsList = FsList;
exports.ArrayFsList = ArrayFsList;
exports.KeyValueCollection = KeyValueCollection;
exports.SimpleKeyValueCollection = SimpleKeyValueCollection;
exports.FsError = FsError;
exports.buildBuiltinMap = buildBrowserBuiltinMap;
