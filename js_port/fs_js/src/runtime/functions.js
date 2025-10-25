const { literalFunction } = require('../core/values');

class FsFunction {
  constructor(symbol, impl, options = {}) {
    this.symbol = symbol;
    this.arity = options.arity ?? null;
    this.impl = impl;
  }

  invoke(provider, args) {
    if (this.arity !== null && args.length !== this.arity) {
      throw new Error(`Function ${this.symbol} expected ${this.arity} parameters got ${args.length}`);
    }
    return this.impl({ provider, args });
  }
}

function wrapFunction(symbol, impl, options) {
  return literalFunction(new FsFunction(symbol, impl, options));
}

module.exports = {
  FsFunction,
  wrapFunction,
};
