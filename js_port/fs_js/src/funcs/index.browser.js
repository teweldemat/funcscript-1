const { IFFunction } = require('./logic/IFFunction');
const { EqualsFunction } = require('./logic/EqualsFunction');
const { NotEqualsFunction } = require('./logic/NotEqualsFunction');
const { GreaterThanFunction } = require('./logic/GreaterThanFunction');
const { GreaterThanOrEqualFunction } = require('./logic/GreaterThanOrEqualFunction');
const { LessThanFunction } = require('./logic/LessThanFunction');
const { LessThanOrEqualFunction } = require('./logic/LessThanOrEqualFunction');
const { AndFunction } = require('./logic/AndFunction');
const { OrFunction } = require('./logic/OrFunction');
const { InFunction } = require('./logic/InFunction');
const { ReplaceIfNullFunction } = require('./logic/ReplaceIfNull');
const { EvaluateIfNotNullFunction } = require('./logic/EvaluateIfNotNull');
const { NotFunction } = require('./logic/NotFunction');
const { CaseFunction } = require('./logic/CaseFunction');
const { SwitchFunction } = require('./logic/SwitchFunction');

const { AddFunction } = require('./math/AddFunction');
const { SubtractFunction } = require('./math/SubtractFunction');
const { MultiplyFunction } = require('./math/MultiplyFunction');
const { DivisionFunction } = require('./math/DivisionFunction');
const { NegateFunction } = require('./math/NegateFunction');
const { ModuloFunction } = require('./math/ModuloFunction');
const { SineFunction, CosineFunction } = require('./math/TrigonometryFunctions');

const { MapListFunction } = require('./list/MapListFunction');
const { ReduceListFunction } = require('./list/ReduceListFunction');
const { FilterListFunction } = require('./list/FilterListFunction');
const { ReverseListFunction } = require('./list/ReverseListFunction');
const { DistinctListFunction } = require('./list/DistinctListFunction');
const { AnyMatchFunction } = require('./list/AnyMatchFunction');
const { ContainsFunction } = require('./list/ContainsFunction');
const { SortListFunction } = require('./list/SortListFunction');
const { LengthFunction } = require('./list/LengthFunction');
const { SeriesFunction } = require('./list/SeriesFunction');
const { TakeFunction } = require('./list/TakeFunction');
const { SkipFunction } = require('./list/SkipFunction');
const { FindFirstFunction } = require('./list/FindFirstFunction');

const { KvcMemberFunction } = require('./keyvalue/KvcMemberFunction');
const { KvcNoneNullMemberFunction } = require('./keyvalue/KvcNoneNullMemberFunction');
const { KvSelectFunction } = require('./keyvalue/KvSelectFunction');

const { IsBlankFunction } = require('./text/IsBlankFunction');
const { EndsWithFunction } = require('./text/EndsWithFunction');
const { SubStringFunction } = require('./text/SubStringFunction');
const { JoinTextFunction } = require('./text/JoinTextFunction');
const { FindTextFunction } = require('./text/FindTextFunction');
const { ParseTextFunction } = require('./text/ParseTextFunction');
const { FormatValueFunction } = require('./text/FormatValueFunction');
const { TemplateMergeFunction } = require('./text/TemplateMergeFunction');

const { DateFunction } = require('./date/DateFunction');
const { TicksToDateFunction } = require('./date/TicksToDateFunction');

const { HtmlEncodeFunction } = require('./html/HtmlEncodeFunction');

const { GuidFunction } = require('./misc/GuidFunction');
const { LogFunction } = require('./misc/LogFunction');

module.exports = function buildBrowserBuiltinMap() {
  const entries = [
    { fn: new IFFunction(), names: ['if'] },
    { fn: new EqualsFunction(), names: ['='] },
    { fn: new NotEqualsFunction(), names: ['!='] },
    { fn: new GreaterThanFunction(), names: ['>'] },
    { fn: new GreaterThanOrEqualFunction(), names: ['>='] },
    { fn: new LessThanFunction(), names: ['<'] },
    { fn: new LessThanOrEqualFunction(), names: ['<='] },
    { fn: new AndFunction(), names: ['and'] },
    { fn: new OrFunction(), names: ['or'] },
    { fn: new InFunction(), names: ['in'] },
    { fn: new ReplaceIfNullFunction(), names: ['??'] },
    { fn: new EvaluateIfNotNullFunction(), names: ['?!'] },
    { fn: new NotFunction(), names: ['!', 'not'] },
    { fn: new CaseFunction(), names: ['case'] },
    { fn: new SwitchFunction(), names: ['switch'] },
    { fn: new AddFunction(), names: ['+'] },
    { fn: new SubtractFunction(), names: ['-'] },
    { fn: new MultiplyFunction(), names: ['*'] },
    { fn: new DivisionFunction(), names: ['/'] },
    { fn: new NegateFunction(), names: ['negate'] },
    { fn: new ModuloFunction(), names: ['%'] },
    { fn: new SineFunction(), names: ['sin'] },
    { fn: new CosineFunction(), names: ['cos'] },
    { fn: new MapListFunction(), names: ['map'] },
    { fn: new ReduceListFunction(), names: ['reduce'] },
    { fn: new FilterListFunction(), names: ['filter'] },
    { fn: new ReverseListFunction(), names: ['reverse'] },
    { fn: new DistinctListFunction(), names: ['distinct'] },
    { fn: new AnyMatchFunction(), names: ['any'] },
    { fn: new ContainsFunction(), names: ['contains'] },
    { fn: new SortListFunction(), names: ['sort'] },
    { fn: new LengthFunction(), names: ['length'] },
    { fn: new SeriesFunction(), names: ['series'] },
    { fn: new TakeFunction(), names: ['take'] },
    { fn: new SkipFunction(), names: ['skip'] },
    { fn: new FindFirstFunction(), names: ['first'] },
    { fn: new KvcMemberFunction(), names: ['.'] },
    { fn: new KvcNoneNullMemberFunction(), names: ['?.'] },
    { fn: new KvSelectFunction(), names: ['select'] },
    { fn: new IsBlankFunction(), names: ['isblank'] },
    { fn: new EndsWithFunction(), names: ['endswith'] },
    { fn: new SubStringFunction(), names: ['substring'] },
    { fn: new JoinTextFunction(), names: ['join'] },
    { fn: new FindTextFunction(), names: ['find'] },
    { fn: new ParseTextFunction(), names: ['parse'] },
    { fn: new FormatValueFunction(), names: ['format'] },
    { fn: new TemplateMergeFunction(), names: ['_templatemerge'] },
    { fn: new DateFunction(), names: ['date'] },
    { fn: new TicksToDateFunction(), names: ['tickstoday'] },
    { fn: new HtmlEncodeFunction(), names: ['hencode'] },
    { fn: new GuidFunction(), names: ['guid'] },
    { fn: new LogFunction(), names: ['log'] }
  ];

  const map = {};
  for (const { fn, names } of entries) {
    for (const name of names) {
      map[name.toLowerCase()] = fn;
    }
  }
  return map;
};
