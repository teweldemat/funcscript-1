export enum FSDataType {
  Null = 0,
  Boolean = 1,
  Integer = 2,
  BigInteger = 3,
  DateTime = 4,
  Guid = 5,
  Float = 6,
  String = 7,
  ByteArray = 8,
  List = 9,
  KeyValueCollection = 10,
  Function = 11,
  ValRef = 12,
  ValSink = 13,
  SigSource = 14,
  SigSink = 15,
  Error = 16
}

export const CallType: {
  readonly Infix: 'infix';
  readonly Prefix: 'prefix';
  readonly Dual: 'dual';
};

export type CallTypeValue = typeof CallType[keyof typeof CallType];

export type TypedValue<T = unknown> = readonly [FSDataType, T];

export type WalyaInput =
  | TypedValue
  | null
  | undefined
  | boolean
  | number
  | bigint
  | string
  | Date
  | Uint8Array
  | FsList
  | KeyValueCollection
  | BaseFunction
  | FsError
  | ((...args: any[]) => unknown);

export declare class FsError {
  static readonly ERROR_DEFAULT: 'Default';
  static readonly ERROR_PARAMETER_COUNT_MISMATCH: 'TOO_FEW_PARAMETER';
  static readonly ERROR_TYPE_MISMATCH: 'TYPE_MISMATCH';
  static readonly ERROR_TYPE_INVALID_PARAMETER: 'TYPE_INVALID_PARAMETER';

  constructor(type?: string, message?: string, data?: unknown);

  errorType: string;
  errorMessage: string;
  errorData: unknown;

  toString(): string;
}

export declare class FsDataProvider {
  constructor(parent?: FsDataProvider | null);

  parent: FsDataProvider | null;

  get(name: string): TypedValue | null;
  isDefined(name: string): boolean;
}

export declare class MapDataProvider extends FsDataProvider {
  constructor(map?: Record<string, WalyaInput>, parent?: FsDataProvider | null);

  set(name: string, value: WalyaInput): void;
  get(name: string): TypedValue | null;
  isDefined(name: string): boolean;
}

export declare class KvcProvider extends FsDataProvider {
  constructor(collection: KeyValueCollection, parent?: FsDataProvider | null);

  get(name: string): TypedValue | null;
  isDefined(name: string): boolean;
}

export declare class DefaultFsDataProvider extends MapDataProvider {
  constructor(map?: Record<string, WalyaInput>, parent?: FsDataProvider | null);
}

export declare abstract class ParameterList {
  abstract get count(): number;
  abstract getParameter(provider: FsDataProvider, index: number): WalyaInput;
}

export declare class BaseFunction {
  symbol: string | null;
  precidence: number;

  constructor();

  get callType(): CallTypeValue;
  set callType(value: CallTypeValue);

  evaluate(provider: FsDataProvider, parameters: ParameterList): WalyaInput;
  parName(index: number): string;
  getCallInfo(): {
    callType: CallTypeValue;
    symbol: string | null;
    precidence: number;
    maxParameters: number;
  };
  get maxParameters(): number;
}

export declare class ExpressionFunction extends BaseFunction {
  readonly parameters: readonly string[];
  context: KeyValueCollection | null;

  constructor(parameters: readonly string[], expressionBlock: {
    evaluate(provider: FsDataProvider): WalyaInput;
  });

  setContext(context: KeyValueCollection): void;
  get maxParameters(): number;
  evaluate(provider: FsDataProvider, parameters: ParameterList): TypedValue;
  parName(index: number): string;
}

export declare class FsList implements Iterable<TypedValue> {
  readonly length: number;
  constructor();
  get(index: number): TypedValue | null;
  toArray(): TypedValue[];
  equals(other: unknown): boolean;
  [Symbol.iterator](): IterableIterator<TypedValue>;
}

export declare class ArrayFsList extends FsList {
  constructor(values: readonly WalyaInput[]);
}

export declare class KeyValueCollection extends FsDataProvider {
  constructor(parent?: FsDataProvider | null);

  get(key: string): TypedValue | null;
  isDefined(key: string): boolean;
  getAll(): Array<readonly [string, TypedValue]>;

  static merge(
    col1: KeyValueCollection | null,
    col2: KeyValueCollection | null
  ): KeyValueCollection | null;
}

export declare class SimpleKeyValueCollection extends KeyValueCollection {
  constructor(parent?: FsDataProvider | null);
  constructor(entries: Array<readonly [string, WalyaInput]>);
  constructor(parent: FsDataProvider | null, entries: Array<readonly [string, WalyaInput]>);
}

export declare function evaluate(
  expression: string,
  provider?: FsDataProvider
): TypedValue;

export declare function evaluateTemplate(
  template: string,
  provider?: FsDataProvider
): string;

export declare function ensureTyped(value: WalyaInput): TypedValue;
export declare function normalize(value: WalyaInput): TypedValue;
export declare function makeValue(type: FSDataType, value: unknown): TypedValue;
export declare function typeOf(value: TypedValue): FSDataType;
export declare function valueOf<T>(value: TypedValue<T>): T;
export declare function typedNull(): TypedValue<null>;
export declare function isTyped(value: unknown): value is TypedValue;
export declare function expectType(
  value: WalyaInput,
  expectedType: FSDataType,
  message?: string
): TypedValue;
export declare function convertToCommonNumericType(
  left: WalyaInput,
  right: WalyaInput
): readonly [TypedValue, TypedValue];

export declare function getTypeName(type: FSDataType): string;

export type BuiltinFunctionMap = Record<string, BaseFunction>;
export declare function buildBuiltinMap(): BuiltinFunctionMap;

export declare function colorParseTree(
  node: import('./parser/walya-parser').ParseNode | null | undefined
): import('./parser/walya-parser').ParseNode[];

export declare const Engine: {
  evaluate: typeof evaluate;
  evaluateTemplate: typeof evaluateTemplate;
  colorParseTree: typeof colorParseTree;
  DefaultFsDataProvider: typeof DefaultFsDataProvider;
  FsDataProvider: typeof FsDataProvider;
  MapDataProvider: typeof MapDataProvider;
  KvcProvider: typeof KvcProvider;
  ensureTyped: typeof ensureTyped;
  normalize: typeof normalize;
  makeValue: typeof makeValue;
  typeOf: typeof typeOf;
  valueOf: typeof valueOf;
  typedNull: typeof typedNull;
  isTyped: typeof isTyped;
  expectType: typeof expectType;
  convertToCommonNumericType: typeof convertToCommonNumericType;
  FSDataType: typeof FSDataType;
  getTypeName: typeof getTypeName;
  CallType: typeof CallType;
  BaseFunction: typeof BaseFunction;
  ParameterList: typeof ParameterList;
  ExpressionFunction: typeof ExpressionFunction;
  FsList: typeof FsList;
  ArrayFsList: typeof ArrayFsList;
  KeyValueCollection: typeof KeyValueCollection;
  SimpleKeyValueCollection: typeof SimpleKeyValueCollection;
  FsError: typeof FsError;
  buildBuiltinMap: typeof buildBuiltinMap;
};

export { WalyaParser, ParseNodeType, ParseNode, ParseResult } from './parser/walya-parser';
