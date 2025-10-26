const { BaseFunction, CallType } = require('../../core/functionBase');
const { ensureTyped } = require('../../core/value');

class CaseFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'case';
    this.callType = CallType.Prefix;
  }

  evaluate(provider, parameters) {
    const count = parameters.count;
    for (let i = 0; i < Math.floor(count / 2); i += 1) {
      const condition = ensureTyped(parameters.getParameter(provider, 2 * i));
      if (condition[1]) {
        return ensureTyped(parameters.getParameter(provider, 2 * i + 1));
      }
    }
    if (count % 2 === 1) {
      return ensureTyped(parameters.getParameter(provider, count - 1));
    }
    return ensureTyped(null);
  }
}

module.exports = {
  CaseFunction
};
