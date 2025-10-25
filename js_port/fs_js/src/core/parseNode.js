const ParseNodeType = Object.freeze({
  COMMENT: 'Comment',
  FUNCTION_PARAMETER_LIST: 'FunctionParameterList',
  FUNCTION_CALL: 'FunctionCall',
  MEMBER_ACCESS: 'MemberAccess',
  SELECTION: 'Selection',
  INFIX_EXPRESSION: 'InfixExpression',
  LITERAL_INTEGER: 'LiteralInteger',
  KEYWORD: 'KeyWord',
  LITERAL_DOUBLE: 'LiteralDouble',
  LITERAL_LONG: 'LiteralLong',
  IDENTIFIER: 'Identifier',
  IDENTIFIER_LIST: 'IdentifierList',
  OPERATOR: 'Operator',
  LAMBDA_EXPRESSION: 'LambdaExpression',
  EXPRESSION_IN_BRACE: 'ExpressionInBrace',
  LITERAL_STRING: 'LiteralString',
  STRING_TEMPLATE: 'StringTemplate',
  KEY_VALUE_PAIR: 'KeyValuePair',
  KEY_VALUE_COLLECTION: 'KeyValueCollection',
  LIST: 'List',
  KEY: 'Key',
  CASE: 'Case',
  DATA_CONNECTION: 'DataConnection',
  NORMAL_ERROR_SINK: 'NormalErrorSink',
  SIG_SEQUENCE: 'SigSequence',
  ERROR_KEYWORD: 'ErrorKeyWord',
  SIGNAL_CONNECTION: 'SignalConnection',
  GENERAL_INFIX_EXPRESSION: 'GeneralInfixExpression',
  PREFIX_OPERATOR_EXPRESSION: 'PrefixOperatorExpression',
});

class ParseNode {
  constructor(type, pos, length, childs = []) {
    this.nodeType = type;
    this.pos = pos;
    this.length = length;
    this.childs = childs;
  }
}

class SyntaxErrorData {
  constructor(loc, length, message) {
    this.loc = loc;
    this.length = length;
    this.message = message;
  }
}

module.exports = {
  ParseNodeType,
  ParseNode,
  SyntaxErrorData,
};
