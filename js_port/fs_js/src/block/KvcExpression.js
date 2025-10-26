const { ExpressionBlock } = require('./ExpressionBlock');
const { SimpleKeyValueCollection } = require('../model/KeyValueCollection');
const { ensureTyped, makeValue } = require('../core/value');
const { FSDataType } = require('../core/fstypes');
const { FsDataProvider } = require('../core/dataProvider');

class KvcExpressionProvider extends FsDataProvider {
  constructor(parent, parentExpression) {
    super(parent);
    this.parentExpression = parentExpression;
    this.cache = new Map();
    this.evaluating = new Set();
  }

  get(name) {
    const lower = name.toLowerCase();
    const entry = this.parentExpression._index.get(lower);
    if (!entry) {
      return super.get(name);
    }
    if (this.cache.has(lower)) {
      return this.cache.get(lower);
    }
    if (this.evaluating.has(lower)) {
      return super.get(name);
    }

    this.evaluating.add(lower);
    try {
      const value = ensureTyped(entry.ValueExpression.evaluate(this));
      this.cache.set(lower, value);
      return value;
    } finally {
      this.evaluating.delete(lower);
    }
  }

  isDefined(name) {
    const lower = name.toLowerCase();
    if (this.parentExpression._index.has(lower)) {
      return true;
    }
    return super.isDefined(name);
  }
}

class KvcExpression extends ExpressionBlock {
  constructor() {
    super();
    this._keyValues = [];
    this.singleReturn = null;
    this._index = new Map();
  }

  SetKeyValues(kvExpressions, returnExpression) {
    this._keyValues = kvExpressions || [];
    this.singleReturn = returnExpression || null;
    this._index = new Map();
    for (const kv of this._keyValues) {
      const lower = kv.KeyLower || kv.Key.toLowerCase();
      if (this._index.has(lower)) {
        return `Key ${lower} is duplicated`;
      }
      kv.KeyLower = lower;
      this._index.set(lower, kv);
    }
    return null;
  }

  get KeyValues() {
    return this._keyValues;
  }

  evaluate(provider) {
    const scope = new KvcExpressionProvider(provider, this);
    const pairs = this._keyValues.map((kv) => [kv.Key, scope.get(kv.KeyLower)]);
    const collection = new SimpleKeyValueCollection(null, pairs);
    if (this.singleReturn) {
      return ensureTyped(this.singleReturn.evaluate(scope));
    }
    return makeValue(FSDataType.KeyValueCollection, collection);
  }

  getChilds() {
    const children = this._keyValues.map((kv) => kv.ValueExpression);
    if (this.singleReturn) {
      children.push(this.singleReturn);
    }
    return children;
  }

  asExpressionString(provider) {
    const parts = this._keyValues.map(
      (kv) => `${kv.Key}: ${kv.ValueExpression.asExpressionString(provider)}`
    );
    if (this.singleReturn) {
      parts.push(`return ${this.singleReturn.asExpressionString(provider)}`);
    }
    return `{ ${parts.join('; ')} }`;
  }
}

class KeyValueExpression {
  constructor() {
    this.Key = null;
    this.KeyLower = null;
    this.ValueExpression = null;
  }
}

module.exports = {
  KvcExpression,
  KeyValueExpression
};
