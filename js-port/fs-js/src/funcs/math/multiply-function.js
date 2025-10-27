const { BaseFunction, CallType } = require('../../core/function-base');
const { ensureTyped, typeOf, valueOf, makeValue, convertToCommonNumericType } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');

class MultiplyFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = '*';
    this.callType = CallType.Infix;
  }

  evaluate(provider, parameters) {
    if (parameters.count === 0) {
      return makeValue(FSDataType.Integer, 1);
    }
    let result = ensureTyped(parameters.getParameter(provider, 0));

    for (let i = 1; i < parameters.count; i += 1) {
      const next = ensureTyped(parameters.getParameter(provider, i));
      let [left, right] = convertToCommonNumericType(result, next);
      if (typeOf(left) === FSDataType.BigInteger) {
        result = makeValue(FSDataType.BigInteger, valueOf(left) * valueOf(right));
      } else if (typeOf(left) === FSDataType.Float) {
        result = makeValue(FSDataType.Float, valueOf(left) * valueOf(right));
      } else {
        result = makeValue(FSDataType.Integer, valueOf(left) * valueOf(right));
      }
    }
    return result;
  }
}

module.exports = {
  MultiplyFunction
};
