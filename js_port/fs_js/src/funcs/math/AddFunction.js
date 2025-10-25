const { BaseFunction, CallType } = require('../../core/functionBase');
const { ensureTyped, typeOf, valueOf, makeValue, convertToCommonNumericType } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');

function isNumericType(t) {
  return t === FSDataType.Integer || t === FSDataType.Float || t === FSDataType.BigInteger;
}

class AddFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = '+';
    this.callType = CallType.Infix;
  }

  evaluate(provider, parameters) {
    let resultType = null;
    let resultValue = null;

    for (let i = 0; i < parameters.count; i += 1) {
      const typed = ensureTyped(parameters.getParameter(provider, i));
      const currentType = typeOf(typed);
      const currentValue = valueOf(typed);

      if (resultType === null) {
        resultType = currentType;
        resultValue = currentValue;
        continue;
      }

      if (currentType === FSDataType.String || resultType === FSDataType.String) {
        resultValue = String(resultValue) + String(currentValue);
        resultType = FSDataType.String;
        continue;
      }

      if (isNumericType(resultType) && isNumericType(currentType)) {
        let left = makeValue(resultType, resultValue);
        let right = makeValue(currentType, currentValue);
        [left, right] = convertToCommonNumericType(left, right);
        resultType = typeOf(left);
        if (resultType === FSDataType.BigInteger) {
          resultValue = valueOf(left) + valueOf(right);
        } else {
          resultValue = valueOf(left) + valueOf(right);
          if (resultType === FSDataType.Integer && !Number.isInteger(resultValue)) {
            resultType = FSDataType.Float;
          }
        }
        continue;
      }

      throw new Error('Unsupported operand types for +');
    }

    return makeValue(resultType ?? FSDataType.Null, resultValue);
  }
}

module.exports = {
  AddFunction
};
