const { ExpressionBlock } = require('./expressionBlock');
const { literalKeyValueCollection } = require('../core/values');

class KvcExpression extends ExpressionBlock {
  constructor() {
    super();
    this.keyValues = [];
    this.returnExpression = null;
    this.dataConnections = [];
    this.signalConnections = [];
    this.index = new Map();
  }

  setKeyValues(kvPairs = [], returnExpression = null, dataConnections = [], signalConnections = []) {
    this.keyValues = kvPairs;
    this.returnExpression = returnExpression;
    this.dataConnections = dataConnections;
    this.signalConnections = signalConnections;
    this.index = new Map();

    for (const kv of kvPairs) {
      const keyLower = kv.key.toLowerCase();
      if (this.index.has(keyLower)) {
        return `Key ${keyLower} is duplicated`;
      }
      this.index.set(keyLower, kv);
    }
    return null;
  }

  getChilds() {
    const kvChildren = this.keyValues.map((kv) => kv.valueExpression).filter(Boolean);
    const connChildren = [...this.dataConnections, ...this.signalConnections]
      .flatMap((conn) => [conn.source, conn.sink, conn.catch].filter(Boolean));
    if (this.returnExpression) {
      return [...kvChildren, this.returnExpression, ...connChildren];
    }
    return [...kvChildren, ...connChildren];
  }

  asExpString(provider) {
    const kvString = this.keyValues
      .map((kv) => `${kv.key}: ${kv.valueExpression.asExpString(provider)}`)
      .join(', ');
    if (this.returnExpression) {
      return `{ ${kvString}, return ${this.returnExpression.asExpString(provider)} }`;
    }
    return `{ ${kvString} }`;
  }

  evaluate(provider, connectionActions = []) {
    const map = {};
    for (const kv of this.keyValues) {
      const evaluated = kv.valueExpression?.evaluate(provider, connectionActions)?.value;
      if (kv.keyLower) {
        map[kv.keyLower] = evaluated;
      } else if (kv.key) {
        map[kv.key.toLowerCase()] = evaluated;
      }
    }

    if (this.returnExpression) {
      const evaluated = this.returnExpression.evaluate(provider, connectionActions)?.value;
      map.return = evaluated;
    }

    return this.makeResult(literalKeyValueCollection(map));
  }
}

module.exports = {
  KvcExpression,
};
