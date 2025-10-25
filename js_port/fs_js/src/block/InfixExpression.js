const { ExpressionBlock } = require('./ExpressionBlock');
const { ensureTyped, typeOf, valueOf, makeValue } = require('../core/value');
const { FSDataType } = require('../core/fstypes');

function promoteNumeric(left, right) {
  const l = ensureTyped(left);
  const r = ensureTyped(right);
  const lt = typeOf(l);
  const rt = typeOf(r);

  if (lt === FSDataType.Float || rt === FSDataType.Float) {
    return [makeValue(FSDataType.Float, Number(valueOf(l))), makeValue(FSDataType.Float, Number(valueOf(r)))];
  }
  if (lt === FSDataType.BigInteger || rt === FSDataType.BigInteger) {
    const leftBig = lt === FSDataType.BigInteger ? valueOf(l) : BigInt(valueOf(l));
    const rightBig = rt === FSDataType.BigInteger ? valueOf(r) : BigInt(valueOf(r));
    return [makeValue(FSDataType.BigInteger, leftBig), makeValue(FSDataType.BigInteger, rightBig)];
  }
  return [l, r];
}

class InfixExpression extends ExpressionBlock {
  constructor(operator, left, right, position = 0, length = 0) {
    super(position, length);
    this.operator = operator;
    this.left = left;
    this.right = right;
  }

  evaluate(provider) {
    const leftVal = this.left.evaluate(provider);
    const rightVal = this.right.evaluate(provider);

    switch (this.operator) {
      case '+':
        return this.evaluateAdd(leftVal, rightVal);
      case '-':
        return this.evaluateSubtract(leftVal, rightVal);
      case '*':
        return this.evaluateMultiply(leftVal, rightVal);
      case '/':
        return this.evaluateDivide(leftVal, rightVal);
      case '=':
        return this.evaluateEquals(leftVal, rightVal);
      default:
        throw new Error(`Unsupported operator ${this.operator}`);
    }
  }

  evaluateAdd(left, right) {
    const l = ensureTyped(left);
    const r = ensureTyped(right);
    const lt = typeOf(l);
    const rt = typeOf(r);

    if (lt === FSDataType.String || rt === FSDataType.String) {
      return makeValue(FSDataType.String, String(valueOf(l)) + String(valueOf(r)));
    }

    const [pl, pr] = promoteNumeric(l, r);
    const type = typeOf(pl);

    if (type === FSDataType.Float) {
      return makeValue(FSDataType.Float, valueOf(pl) + valueOf(pr));
    }
    if (type === FSDataType.BigInteger) {
      return makeValue(FSDataType.BigInteger, valueOf(pl) + valueOf(pr));
    }
    return makeValue(FSDataType.Integer, valueOf(pl) + valueOf(pr));
  }

  evaluateSubtract(left, right) {
    const [pl, pr] = promoteNumeric(left, right);
    const type = typeOf(pl);
    if (type === FSDataType.Float) {
      return makeValue(FSDataType.Float, valueOf(pl) - valueOf(pr));
    }
    if (type === FSDataType.BigInteger) {
      return makeValue(FSDataType.BigInteger, valueOf(pl) - valueOf(pr));
    }
    return makeValue(FSDataType.Integer, valueOf(pl) - valueOf(pr));
  }

  evaluateMultiply(left, right) {
    const [pl, pr] = promoteNumeric(left, right);
    const type = typeOf(pl);
    if (type === FSDataType.Float) {
      return makeValue(FSDataType.Float, valueOf(pl) * valueOf(pr));
    }
    if (type === FSDataType.BigInteger) {
      return makeValue(FSDataType.BigInteger, valueOf(pl) * valueOf(pr));
    }
    return makeValue(FSDataType.Integer, valueOf(pl) * valueOf(pr));
  }

  evaluateDivide(left, right) {
    const [pl, pr] = promoteNumeric(left, right);
    const divisor = valueOf(pr);
    if (divisor === 0 || divisor === 0n) {
      throw new Error('Division by zero');
    }
    return makeValue(FSDataType.Float, Number(valueOf(pl)) / Number(divisor));
  }

  evaluateEquals(left, right) {
    const l = ensureTyped(left);
    const r = ensureTyped(right);
    if (typeOf(l) !== typeOf(r)) {
      return makeValue(FSDataType.Boolean, false);
    }
    return makeValue(FSDataType.Boolean, valueOf(l) === valueOf(r));
  }

  getChilds() {
    return [this.left, this.right];
  }

  asExpressionString(provider) {
    return `${this.left.asExpressionString(provider)} ${this.operator} ${this.right.asExpressionString(provider)}`;
  }
}

module.exports = {
  InfixExpression
};
