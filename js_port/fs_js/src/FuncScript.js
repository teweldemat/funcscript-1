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
const { ParseNode } = require('./parser/ParseNode');

const { MapDataProvider } = dataProviders;
const { ensureTyped } = valueModule;

const builtinProvider = new MapDataProvider(buildBuiltinMap());

class DefaultFsDataProvider extends MapDataProvider {
  constructor(map = {}, parent = builtinProvider) {
    super(map, parent);
  }
}

function evaluate(expression, provider = new DefaultFsDataProvider()) {
  const { block } = FuncScriptParser.parse(provider, expression);
  if (!block) {
    throw new Error('Failed to parse expression');
  }
  return ensureTyped(block.evaluate(provider));
}

function colorParseTree(node) {
  if (!node || typeof node.Length !== 'number' || node.Length <= 0) {
    return [];
  }

  const childs = Array.isArray(node.Childs) ? node.Childs : [];
  if (childs.length === 0) {
    return [node];
  }

  const result = [];
  const first = childs[0];
  const nodePos = typeof node.Pos === 'number' ? node.Pos : 0;

  if (first && typeof first.Pos === 'number' && first.Pos > nodePos) {
    result.push(new ParseNode(node.NodeType, nodePos, first.Pos - nodePos));
  }

  for (const child of childs) {
    result.push(...colorParseTree(child));
  }

  const last = childs[childs.length - 1];
  if (last && typeof last.Pos === 'number' && typeof last.Length === 'number') {
    const lastEnd = last.Pos + last.Length;
    const nodeEnd = nodePos + node.Length;
    if (lastEnd < nodeEnd) {
      result.push(new ParseNode(node.NodeType, lastEnd, nodeEnd - lastEnd));
    }
  }

  return result;
}

module.exports = {
  evaluate,
  colorParseTree,
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
