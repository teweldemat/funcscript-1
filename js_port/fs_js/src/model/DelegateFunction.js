const { BaseFunction, CallType } = require('../core/functionBase');
const { ensureTyped } = require('../core/value');

class DelegateFunction extends BaseFunction {
  constructor(delegate) {
    super();
    if (typeof delegate !== 'function') {
      throw new Error('DelegateFunction requires a function');
    }
    this.delegate = delegate;
  }

  get maxParameters() {
    return -1;
  }

  evaluate(provider, parameters) {
    const args = [];
    const count = parameters ? parameters.count : 0;
    for (let i = 0; i < count; i += 1) {
      args.push(parameters.getParameter(provider, i));
    }
    const result = this.delegate(...args.map(ensureTyped));
    return ensureTyped(result);
  }

  get callType() {
    return CallType.Infix;
  }
}

module.exports = {
  DelegateFunction
};
