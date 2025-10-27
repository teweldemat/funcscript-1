const { BaseFunction, CallType } = require('../../core/function-base');
const { ensureTyped, typeOf, valueOf, makeValue } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');
const { makeError, FsError } = require('../helpers');

function isNumericType(type) {
  return type === FSDataType.Integer || type === FSDataType.Float || type === FSDataType.BigInteger;
}

class DivisionFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = '/';
    this.callType = CallType.Infix;
    this.precidence = 50;
  }

  evaluate(provider, parameters) {
    if (parameters.count === 0) {
      return makeError(FsError.ERROR_PARAMETER_COUNT_MISMATCH, `${this.symbol}: at least one operand required`);
    }

    let current = ensureTyped(parameters.getParameter(provider, 0));
    let mode = typeOf(current);

    if (!isNumericType(mode)) {
      mode = FSDataType.Integer;
      current = makeValue(FSDataType.Integer, 1);
    }

    let intTotal = mode === FSDataType.Integer ? valueOf(current) : 1;
    let longTotal = mode === FSDataType.BigInteger ? valueOf(current) : 1n;
    let doubleTotal = mode === FSDataType.Float ? valueOf(current) : 1.0;

    for (let i = 1; i < parameters.count; i += 1) {
      const operand = ensureTyped(parameters.getParameter(provider, i));
      const operandType = typeOf(operand);

      if (!isNumericType(operandType)) {
        return makeError(FsError.ERROR_TYPE_MISMATCH, `${this.symbol}: numeric operand expected`);
      }

      if (mode === FSDataType.Integer) {
        if (operandType === FSDataType.Integer) {
          const divisor = valueOf(operand);
          if (divisor === 0) {
            return makeError(FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: division by zero`);
          }
          intTotal = Math.trunc(intTotal / divisor);
        } else if (operandType === FSDataType.BigInteger) {
          mode = FSDataType.BigInteger;
          longTotal = BigInt(intTotal);
          const divisor = valueOf(operand);
          if (divisor === 0n) {
            return makeError(FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: division by zero`);
          }
          longTotal = longTotal / divisor;
        } else {
          mode = FSDataType.Float;
          doubleTotal = intTotal;
          const divisor = Number(valueOf(operand));
          if (divisor === 0) {
            return makeError(FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: division by zero`);
          }
          doubleTotal /= divisor;
        }
      } else if (mode === FSDataType.BigInteger) {
        if (operandType === FSDataType.Float) {
          mode = FSDataType.Float;
          doubleTotal = Number(longTotal);
          const divisor = Number(valueOf(operand));
          if (divisor === 0) {
            return makeError(FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: division by zero`);
          }
          doubleTotal /= divisor;
        } else {
          const divisor = operandType === FSDataType.BigInteger ? valueOf(operand) : BigInt(valueOf(operand));
          if (divisor === 0n) {
            return makeError(FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: division by zero`);
          }
          longTotal = longTotal / divisor;
        }
      } else {
        const divisor = Number(valueOf(operand));
        if (divisor === 0) {
          return makeError(FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: division by zero`);
        }
        doubleTotal /= divisor;
      }
    }

    if (mode === FSDataType.Float) {
      return makeValue(FSDataType.Float, doubleTotal);
    }
    if (mode === FSDataType.BigInteger) {
      return makeValue(FSDataType.BigInteger, longTotal);
    }
    return makeValue(FSDataType.Integer, intTotal);
  }
}

module.exports = {
  DivisionFunction
};
