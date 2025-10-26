const { BaseFunction, CallType } = require('../../core/functionBase');
const { ensureTyped, typeOf, valueOf, makeValue } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');
const { makeError, FsError } = require('../helpers');

function ensureNumeric(symbol, parameter) {
  const typed = ensureTyped(parameter);
  if (typeOf(typed) === FSDataType.Integer || typeOf(typed) === FSDataType.Float || typeOf(typed) === FSDataType.BigInteger) {
    return { ok: true, value: Number(valueOf(typed)) };
  }
  return { ok: false, error: makeError(FsError.ERROR_TYPE_MISMATCH, `${symbol}: number expected`) };
}

class SineFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'sin';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 1;
  }

  evaluate(provider, parameters) {
    const result = ensureNumeric(this.symbol, parameters.getParameter(provider, 0));
    if (!result.ok) {
      return result.error;
    }
    return makeValue(FSDataType.Float, Math.sin(result.value));
  }
}

class CosineFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'cos';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 1;
  }

  evaluate(provider, parameters) {
    const result = ensureNumeric(this.symbol, parameters.getParameter(provider, 0));
    if (!result.ok) {
      return result.error;
    }
    return makeValue(FSDataType.Float, Math.cos(result.value));
  }
}

module.exports = {
  SineFunction,
  CosineFunction
};
