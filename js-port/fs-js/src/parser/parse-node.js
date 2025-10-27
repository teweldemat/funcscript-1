class ParseNode {
  constructor(nodeType, pos, length, childs = []) {
    this.NodeType = nodeType;
    this.Pos = pos;
    this.Length = length;
    this.Childs = Array.isArray(childs) ? childs : [];
  }
}

const ParseNodeType = Object.freeze({
  Comment: 'Comment',
  FunctionParameterList: 'FunctionParameterList',
  FunctionCall: 'FunctionCall',
  MemberAccess: 'MemberAccess',
  Selection: 'Selection',
  InfixExpression: 'InfixExpression',
  LiteralInteger: 'LiteralInteger',
  KeyWord: 'KeyWord',
  LiteralDouble: 'LiteralDouble',
  LiteralLong: 'LiteralLong',
  Identifier: 'Identifier',
  IdentiferList: 'IdentiferList',
  Operator: 'Operator',
  LambdaExpression: 'LambdaExpression',
  ExpressionInBrace: 'ExpressionInBrace',
  LiteralString: 'LiteralString',
  StringTemplate: 'StringTemplate',
  KeyValuePair: 'KeyValuePair',
  KeyValueCollection: 'KeyValueCollection',
  List: 'List',
  Key: 'Key',
  Case: 'Case',
  DataConnection: 'DataConnection',
  NormalErrorSink: 'NormalErrorSink',
  SigSequence: 'SigSequence',
  ErrorKeyWord: 'ErrorKeyWord',
  SignalConnection: 'SignalConnection',
  GeneralInfixExpression: 'GeneralInfixExpression',
  PrefixOperatorExpression: 'PrefixOperatorExpression'
});

module.exports = {
  ParseNode,
  ParseNodeType
};
