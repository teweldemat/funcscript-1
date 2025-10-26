const { BaseFunction, CallType } = require('../../core/functionBase');
const { ensureTyped, typeOf, valueOf, makeValue } = require('../../core/value');
const { FSDataType } = require('../../core/fstypes');

class SwitchFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'switch';
    this.callType = CallType.Prefix;
  }

  evaluate(provider, parameters) {
    if (parameters.count === 0) {
      return ensureTyped(null);
    }
    const selector = ensureTyped(parameters.getParameter(provider, 0));
    const selectorType = typeOf(selector);
    const selectorValue = valueOf(selector);

    for (let i = 1; i < parameters.count - 1; i += 2) {
      const key = ensureTyped(parameters.getParameter(provider, i));
      const value = parameters.getParameter(provider, i + 1);
      if (typeOf(key) === selectorType && valueOf(key) === selectorValue) {
        return ensureTyped(value);
      }
    }

    if (parameters.count % 2 === 0) {
      return ensureTyped(parameters.getParameter(provider, parameters.count - 1));
    }

    return ensureTyped(null);
  }
}

module.exports = {
  SwitchFunction
};
