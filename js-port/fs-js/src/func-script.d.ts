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

export type FuncScriptInput =
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
  constructor(map?: Record<string, FuncScriptInput>, parent?: FsDataProvider | null);

  set(name: string, value: FuncScriptInput): void;
  get(name: string): TypedValue | null;
  isDefined(name: string): boolean;
}

export declare class KvcProvider extends FsDataProvider {
  constructor(collection: KeyValueCollection, parent?: FsDataProvider | null);

  get(name: string): TypedValue | null;
  isDefined(name: string): boolean;
}

export declare class DefaultFsDataProvider extends MapDataProvider {
  constructor(map?: Record<string, FuncScriptInput>, parent?: FsDataProvider | null);
}

export declare abstract class ParameterList {
  abstract get count(): number;
  abstract getParameter(provider: FsDataProvider, index: number): FuncScriptInput;
}

export declare class BaseFunction {
  symbol: string | null;
  precidence: number;

  constructor();

  get callType(): CallTypeValue;
  set callType(value: CallTypeValue);

  evaluate(provider: FsDataProvider, parameters: ParameterList): FuncScriptInput;
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
    evaluate(provider: FsDataProvider): FuncScriptInput;
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
  constructor(values: readonly FuncScriptInput[]);
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
  constructor(entries: Array<readonly [string, FuncScriptInput]>);
  constructor(parent: FsDataProvider | null, entries: Array<readonly [string, FuncScriptInput]>);
}

export declare function evaluate(
  expression: string,
  provider?: FsDataProvider
): TypedValue;

export declare function evaluateTemplate(
  template: string,
  provider?: FsDataProvider
): string;

export declare function ensureTyped(value: FuncScriptInput): TypedValue;
export declare function normalize(value: FuncScriptInput): TypedValue;
export declare function makeValue(type: FSDataType, value: unknown): TypedValue;
export declare function typeOf(value: TypedValue): FSDataType;
export declare function valueOf<T>(value: TypedValue<T>): T;
export declare function typedNull(): TypedValue<null>;
export declare function isTyped(value: unknown): value is TypedValue;
export declare function expectType(
  value: FuncScriptInput,
  expectedType: FSDataType,
  message?: string
): TypedValue;
export declare function convertToCommonNumericType(
  left: FuncScriptInput,
  right: FuncScriptInput
): readonly [TypedValue, TypedValue];

export declare function getTypeName(type: FSDataType): string;

export type BuiltinFunctionMap = Record<string, BaseFunction>;
export declare function buildBuiltinMap(): BuiltinFunctionMap;

export declare function colorParseTree(
  node: import('./parser/func-script-parser').ParseNode | null | undefined
): import('./parser/func-script-parser').ParseNode[];

export { FuncScriptParser, ParseNodeType, ParseNode, ParseResult } from './parser/func-script-parser';
