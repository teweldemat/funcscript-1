const { ExpressionBlock } = require('./expressionBlock');
const { literalList } = require('../core/values');

class ListExpression extends ExpressionBlock {
  constructor(values = []) {
    super();
    this.valueExpressions = values;
  }

  getChilds() {
    return this.valueExpressions;
  }

  evaluate(provider, connectionActions = []) {
    const items = this.valueExpressions.map((expr) => expr.evaluate(provider, connectionActions).value);
    return this.makeResult(literalList(items));
  }

  asExpString(provider) {
    return `[${this.valueExpressions.map((v) => v.asExpString(provider)).join(', ')}]`;
  }
}

module.exports = {
  ListExpression,
};
