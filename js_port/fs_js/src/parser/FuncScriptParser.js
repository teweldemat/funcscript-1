const { Tokenizer, TokenType } = require('./tokenizer');
const { LiteralBlock } = require('../block/LiteralBlock');
const { ReferenceBlock } = require('../block/ReferenceBlock');
const { FunctionCallExpression } = require('../block/FunctionCallExpression');
const { InfixExpression } = require('../block/InfixExpression');
const { makeValue } = require('../core/value');
const { FSDataType } = require('../core/fstypes');

class FuncScriptParser {
  static parse(provider, text) {
    const parser = new Parser(provider, text);
    return parser.parseExpression();
  }
}

class Parser {
  constructor(provider, text) {
    this.provider = provider;
    this.tokenizer = new Tokenizer(text);
    this.current = this.tokenizer.peek();
  }

  advance() {
    this.tokenizer.advance();
    this.current = this.tokenizer.peek();
  }

  match(type, value = null) {
    if (this.current.type === type && (value === null || this.current.value === value)) {
      const tok = this.current;
      this.advance();
      return tok;
    }
    return null;
  }

  expect(type, value = null) {
    const token = this.match(type, value);
    if (!token) {
      throw new Error(`Expected ${value || type} at position ${this.current.position}`);
    }
    return token;
  }

  parseExpression() {
    return this.parseEquality();
  }

  parseEquality() {
    let expr = this.parseAdditive();
    while (this.current.type === TokenType.Operator && this.current.value === '=') {
      const op = this.current.value;
      this.advance();
      const right = this.parseAdditive();
      expr = new InfixExpression(op, expr, right);
    }
    return expr;
  }

  parseAdditive() {
    let expr = this.parseMultiplicative();
    while (this.current.type === TokenType.Operator && (this.current.value === '+' || this.current.value === '-')) {
      const op = this.current.value;
      this.advance();
      const right = this.parseMultiplicative();
      expr = new InfixExpression(op, expr, right);
    }
    return expr;
  }

  parseMultiplicative() {
    let expr = this.parseUnary();
    while (this.current.type === TokenType.Operator && (this.current.value === '*' || this.current.value === '/')) {
      const op = this.current.value;
      this.advance();
      const right = this.parseUnary();
      expr = new InfixExpression(op, expr, right);
    }
    return expr;
  }

  parseUnary() {
    if (this.current.type === TokenType.Operator && this.current.value === '-') {
      const op = this.current;
      this.advance();
      const operand = this.parseUnary();
      const zero = new LiteralBlock(makeValue(FSDataType.Integer, 0), op.position, 0);
      return new InfixExpression('-', zero, operand);
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    if (this.current.type === TokenType.Number) {
      const token = this.current;
      this.advance();
      if (token.value.includes('.')) {
        const value = Number(token.value);
        return new LiteralBlock(makeValue(FSDataType.Float, value), token.position, token.value.length);
      }
      return new LiteralBlock(makeValue(FSDataType.Integer, parseInt(token.value, 10)), token.position, token.value.length);
    }
    if (this.current.type === TokenType.String) {
      const token = this.current;
      this.advance();
      return new LiteralBlock(makeValue(FSDataType.String, token.value), token.position, token.value.length + 2);
    }
    if (this.current.type === TokenType.Identifier) {
      return this.parseIdentifierExpression();
    }
    if (this.match(TokenType.Punctuation, '(')) {
      const expr = this.parseExpression();
      this.expect(TokenType.Punctuation, ')');
      return expr;
    }
    throw new Error(`Unexpected token ${this.current.type} at position ${this.current.position}`);
  }

  parseIdentifierExpression() {
    const idToken = this.expect(TokenType.Identifier);
    let expr = new ReferenceBlock(idToken.value, idToken.position, idToken.value.length);
    while (this.current.type === TokenType.Punctuation && this.current.value === '(') {
      this.advance();
      const args = [];
      if (!(this.current.type === TokenType.Punctuation && this.current.value === ')')) {
        do {
          const arg = this.parseExpression();
          args.push(arg);
        } while (this.match(TokenType.Punctuation, ','));
      }
      this.expect(TokenType.Punctuation, ')');
      expr = new FunctionCallExpression(expr, args, idToken.position, this.current.position - idToken.position);
    }
    return expr;
  }
}

module.exports = {
  FuncScriptParser
};
