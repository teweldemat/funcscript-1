class ExpressionBlock {
  constructor(pos = 0, length = 0) {
    this.pos = pos;
    this.length = length;
  }

  setSpan(pos, length) {
    this.pos = pos;
    this.length = length;
    return this;
  }

  getLocation() {
    return { pos: this.pos, length: this.length };
  }

  makeResult(value) {
    return { value, location: this.getLocation() };
  }

  evaluate(provider, connectionActions = []) {
    throw new Error('evaluate not implemented');
  }

  getChilds() {
    return [];
  }

  asExpString(provider) {
    throw new Error('asExpString not implemented');
  }
}

module.exports = {
  ExpressionBlock,
};
