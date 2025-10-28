export type ParseNodeType =
  | 'Comment'
  | 'FunctionParameterList'
  | 'FunctionCall'
  | 'MemberAccess'
  | 'Selection'
  | 'InfixExpression'
  | 'LiteralInteger'
  | 'KeyWord'
  | 'LiteralDouble'
  | 'LiteralLong'
  | 'Identifier'
  | 'IdentiferList'
  | 'Operator'
  | 'LambdaExpression'
  | 'ExpressionInBrace'
  | 'LiteralString'
  | 'StringTemplate'
  | 'KeyValuePair'
  | 'KeyValueCollection'
  | 'List'
  | 'Key'
  | 'Case'
  | 'DataConnection'
  | 'NormalErrorSink'
  | 'SigSequence'
  | 'ErrorKeyWord'
  | 'SignalConnection'
  | 'GeneralInfixExpression'
  | 'PrefixOperatorExpression';

export interface ParseNode {
  NodeType: ParseNodeType;
  Pos: number;
  Length: number;
  Childs: ParseNode[];
}

export interface ParseResult {
  block: unknown;
  parseNode: ParseNode;
}

export const ParseNodeType: { readonly [K in ParseNodeType]: K };

export class FunscScriptParser {
  static parse(context: unknown, exp: string): ParseResult;
}
