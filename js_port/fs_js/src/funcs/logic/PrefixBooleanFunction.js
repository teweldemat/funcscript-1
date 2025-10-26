const { BaseFunction, CallType } = require('../../core/functionBase');
const { ensureTyped, typeOf, valueOf, makeValue } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');

function toBoolean(typed) {
  switch (typeOf(typed)) {
    case FSDataType.Boolean:
      return valueOf(typed);
    case FSDataType.Null:
      return false;
    case FSDataType.Integer:
    case FSDataType.Float:
      return valueOf(typed) !== 0;
    default:
      return !!valueOf(typed);
  }
}

class PrefixBooleanFunction extends BaseFunction {
  constructor(symbol, implementation) {
    super();
    this.symbol = symbol;
    this.callType = CallType.Prefix;
    this.implementation = implementation;
  }

  get maxParameters() {
    return 1;
  }

  evaluate(provider, parameters) {
    const operand = ensureTyped(parameters.getParameter(provider, 0));
    const result = this.implementation(toBoolean(operand));
    return makeValue(FSDataType.Boolean, result);
  }
}

module.exports = {
  PrefixBooleanFunction,
  toBoolean
};
