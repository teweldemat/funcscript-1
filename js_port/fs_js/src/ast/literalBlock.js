const { ExpressionBlock } = require('./expressionBlock');
const { isExpressionFunctionValue } = require('../runtime/expressionFunction');

class LiteralBlock extends ExpressionBlock {
  constructor(value) {
    super();
    this.value = value;
  }

  evaluate(provider) {
    if (isExpressionFunctionValue(this.value)) {
      const [, expressionFunction] = this.value;
      expressionFunction.setContext(provider);
    }
    return this.makeResult(this.value);
  }

  asExpString() {
    const [, val] = this.value;
    if (val === null) return 'null';
    if (typeof val === 'string') return JSON.stringify(val);
    return String(val);
  }
}

module.exports = {
  LiteralBlock,
};
