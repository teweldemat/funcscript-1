const { ExpressionBlock } = require('./ExpressionBlock');
const { ensureTyped } = require('../core/value');

class LiteralBlock extends ExpressionBlock {
  constructor(value, position = 0, length = 0) {
    super(position, length);
    this.value = ensureTyped(value);
  }

  evaluate(provider) {
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
