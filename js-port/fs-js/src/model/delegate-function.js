const { BaseFunction, CallType } = require('../core/function-base');
const { ensureTyped, valueOf } = require('../core/value');

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
      args.push(ensureTyped(parameters.getParameter(provider, i)));
    }
    const jsArgs = args.map((arg) => valueOf(arg));
    const result = this.delegate(...jsArgs);
    return ensureTyped(result);
  }

  get callType() {
    return CallType.Infix;
  }
}

module.exports = {
  DelegateFunction
};
