const TokenType = {
  Number: 'Number',
  String: 'String',
  Identifier: 'Identifier',
  Operator: 'Operator',
  Punctuation: 'Punctuation',
  EOF: 'EOF'
};

class Token {
  constructor(type, value, position) {
    this.type = type;
    this.value = value;
    this.position = position;
  }
}

class Tokenizer {
  constructor(text) {
    this.text = text;
    this.index = 0;
    this.current = null;
    this.advance();
  }

  advance() {
    this.current = this.readNextToken();
  }

  peek() {
    return this.current;
  }

  readNextToken() {
    this.skipWhitespace();
    if (this.index >= this.text.length) {
      return new Token(TokenType.EOF, null, this.index);
    }
    const ch = this.text[this.index];

    if (isDigit(ch) || (ch === '.' && isDigit(this.text[this.index + 1]))) {
      return this.readNumber();
    }
    if (ch === '"' || ch === '\'') {
      return this.readString();
    }
    if (isIdentifierStart(ch)) {
      return this.readIdentifier();
    }
    if (isOperatorChar(ch)) {
      this.index += 1;
      return new Token(TokenType.Operator, ch, this.index - 1);
    }
    if (',()'.includes(ch)) {
      this.index += 1;
      return new Token(TokenType.Punctuation, ch, this.index - 1);
    }
    throw new Error(`Unexpected character '${ch}' at position ${this.index}`);
  }

  readNumber() {
    const start = this.index;
    let sawDot = false;
    while (this.index < this.text.length) {
      const ch = this.text[this.index];
      if (ch === '.') {
        if (sawDot) {
          break;
        }
        sawDot = true;
        this.index += 1;
        continue;
      }
      if (!isDigit(ch)) {
        break;
      }
      this.index += 1;
    }
    const value = this.text.slice(start, this.index);
    return new Token(TokenType.Number, value, start);
  }

  readString() {
    const quote = this.text[this.index];
    const start = this.index;
    this.index += 1;
    let result = '';
    while (this.index < this.text.length) {
      const ch = this.text[this.index];
      if (ch === quote) {
        this.index += 1;
        return new Token(TokenType.String, result, start);
      }
      if (ch === '\\') {
        const next = this.text[this.index + 1];
        if (next === 'n') {
          result += '\n';
          this.index += 2;
        } else if (next === 't') {
          result += '\t';
          this.index += 2;
        } else if (next === quote) {
          result += quote;
          this.index += 2;
        } else {
          result += next;
          this.index += 2;
        }
      } else {
        result += ch;
        this.index += 1;
      }
    }
    throw new Error('Unterminated string literal');
  }

  readIdentifier() {
    const start = this.index;
    this.index += 1;
    while (this.index < this.text.length && isIdentifierPart(this.text[this.index])) {
      this.index += 1;
    }
    const value = this.text.slice(start, this.index);
    return new Token(TokenType.Identifier, value, start);
  }

  skipWhitespace() {
    while (this.index < this.text.length) {
      const ch = this.text[this.index];
      if (ch === ' ' || ch === '\n' || ch === '\r' || ch === '\t') {
        this.index += 1;
      } else {
        break;
      }
    }
  }
}

function isDigit(ch) {
  return ch >= '0' && ch <= '9';
}

function isIdentifierStart(ch) {
  return /[A-Za-z_]/.test(ch);
}

function isIdentifierPart(ch) {
  return /[A-Za-z0-9_]/.test(ch);
}

function isOperatorChar(ch) {
  return '+-*/='.includes(ch);
}

module.exports = {
  Tokenizer,
  TokenType,
  Token
};
