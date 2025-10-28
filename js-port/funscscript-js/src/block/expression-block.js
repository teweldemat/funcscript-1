class ExpressionBlock {
  constructor(position = 0, length = 0) {
    this.Pos = position;
    this.Length = length;
  }

  get position() {
    return this.Pos;
  }

  set position(value) {
    this.Pos = value;
  }

  get length() {
    return this.Length;
  }

  set length(value) {
    this.Length = value;
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
