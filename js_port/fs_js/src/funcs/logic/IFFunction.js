const { BaseFunction, CallType } = require('../../core/functionBase');
const { ensureTyped, typeOf, valueOf } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');

class IFFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'If';
    this.callType = CallType.Infix;
  }

  get maxParameters() {
    return 3;
  }

  evaluate(provider, parameters) {
    const condition = ensureTyped(parameters.getParameter(provider, 0));
    const conditionValue = this.toBoolean(condition);

    if (conditionValue) {
      if (parameters.count > 1) {
        return ensureTyped(parameters.getParameter(provider, 1));
      }
      return ensureTyped(condition);
    }

    if (parameters.count > 2) {
      return ensureTyped(parameters.getParameter(provider, 2));
    }
    return ensureTyped(condition);
  }

  toBoolean(value) {
    const type = typeOf(value);
    switch (type) {
      case FSDataType.Boolean:
        return valueOf(value);
      case FSDataType.Null:
        return false;
      case FSDataType.Integer:
      case FSDataType.Float:
      case FSDataType.BigInteger:
        return valueOf(value) !== 0 && valueOf(value) !== 0n;
      case FSDataType.String:
        return valueOf(value).length > 0;
      default:
        return true;
    }
  }
}

module.exports = {
  IFFunction
};
