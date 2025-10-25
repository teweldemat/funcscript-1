const { ExpressionBlock } = require('./expressionBlock');

class LiteralBlock extends ExpressionBlock {
  constructor(value) {
    super();
    this.value = value;
  }

  evaluate() {
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
