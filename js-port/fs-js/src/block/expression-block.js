class ExpressionBlock {
  constructor(position = 0, length = 0) {
    this.position = position;
    this.length = length;
  }

  evaluate(provider) {
    throw new Error('ExpressionBlock.evaluate not implemented');
  }

  getChilds() {
    return [];
  }

  asExpressionString(provider) {
    return '';
  }
}

module.exports = {
  ExpressionBlock
};
