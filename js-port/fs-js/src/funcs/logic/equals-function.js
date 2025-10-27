const { BaseFunction, CallType } = require('../../core/function-base');
const { ensureTyped, typeOf, valueOf, makeValue } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');

class EqualsFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = '=';
    this.callType = CallType.Infix;
  }

  get maxParameters() {
    return 2;
  }

  evaluate(provider, parameters) {
    if (parameters.count < 2) {
      throw new Error('Equality requires two operands');
    }
    const left = ensureTyped(parameters.getParameter(provider, 0));
    const right = ensureTyped(parameters.getParameter(provider, 1));
    const sameType = typeOf(left) === typeOf(right);
    const equal = sameType && valueOf(left) === valueOf(right);
    return makeValue(FSDataType.Boolean, equal);
  }
}

module.exports = {
  EqualsFunction
};
