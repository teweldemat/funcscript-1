const { ExpressionBlock } = require('./expressionBlock');
const { literalNull } = require('../core/values');

class ReferenceBlock extends ExpressionBlock {
  constructor(identifier) {
    super();
    this.identifier = identifier;
  }

  evaluate(provider) {
    if (!provider || typeof provider.get !== 'function') {
      return this.makeResult(literalNull());
    }
    const value = provider.get(this.identifier);
    if (value != null) {
      return this.makeResult(value);
    }
    return this.makeResult(literalNull());
  }

  asExpString() {
    return this.identifier;
  }
}

module.exports = {
  ReferenceBlock,
};
