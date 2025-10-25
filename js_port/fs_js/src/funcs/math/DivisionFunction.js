const { BaseFunction, CallType } = require('../../core/functionBase');
const { ensureTyped, typeOf, valueOf, makeValue, convertToCommonNumericType } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');

class DivisionFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = '/';
    this.callType = CallType.Infix;
  }

  evaluate(provider, parameters) {
    if (parameters.count === 0) {
      throw new Error('Division requires at least one operand');
    }
    let result = ensureTyped(parameters.getParameter(provider, 0));

    for (let i = 1; i < parameters.count; i += 1) {
      const next = ensureTyped(parameters.getParameter(provider, i));
      let [left, right] = convertToCommonNumericType(result, next);
      const divisor = valueOf(right);
      if (divisor === 0 || divisor === 0n) {
        throw new Error('Division by zero');
      }
      const quotient = valueOf(left) / Number(divisor);
      result = makeValue(FSDataType.Float, quotient);
    }
    return result;
  }
}

module.exports = {
  DivisionFunction
};
