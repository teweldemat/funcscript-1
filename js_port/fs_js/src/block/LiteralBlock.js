const { ExpressionBlock } = require('./ExpressionBlock');
const { ensureTyped } = require('../core/value');
const { ExpressionFunction } = require('../core/ExpressionFunction');

class LiteralBlock extends ExpressionBlock {
  constructor(value, position = 0, length = 0) {
    super(position, length);
    this.value = ensureTyped(value);
  }

  evaluate(provider) {
    const raw = this.value[1];
    if (raw instanceof ExpressionFunction) {
      raw.setContext(provider);
    }
    return this.value;
  }

  asExpressionString() {
    const val = this.value[1];
    if (val === null) {
      return 'null';
    }
    return String(val);
  }
}

module.exports = {
  LiteralBlock
};
