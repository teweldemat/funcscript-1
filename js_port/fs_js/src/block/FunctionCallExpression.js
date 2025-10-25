const { ExpressionBlock } = require('./ExpressionBlock');
const { ParameterList } = require('../core/functionBase');
const { typeOf, valueOf, ensureTyped, typedNull } = require('../core/value');
const { FSDataType } = require('../core/fstypes');

class FuncParameterList extends ParameterList {
  constructor(parentExpression, provider) {
    super();
    this.parentExpression = parentExpression;
    this.provider = provider;
  }

  get count() {
    return this.parentExpression.parameters.length;
  }

  getParameter(provider, index) {
    const exp = this.parentExpression.parameters[index];
    if (!exp) {
      return typedNull();
    }
    const result = exp.evaluate(this.provider);
    return ensureTyped(result);
  }
}

class FunctionCallExpression extends ExpressionBlock {
  constructor(fnExpression, parameterExpressions, position = 0, length = 0) {
    super(position, length);
    this.functionExpression = fnExpression;
    this.parameters = parameterExpressions || [];
  }

  evaluate(provider) {
    const fnValue = ensureTyped(this.functionExpression.evaluate(provider));
    const fnType = typeOf(fnValue);

    if (fnType === FSDataType.Function) {
      const fn = valueOf(fnValue);
      const paramList = new FuncParameterList(this, provider);
      const result = fn.evaluate(provider, paramList);
      return ensureTyped(result);
    }

    if (fnType === FSDataType.List) {
      const list = valueOf(fnValue);
      if (this.parameters.length === 0) {
        return typedNull();
      }
      const index = this.parameters[0].evaluate(provider);
      const typedIndex = ensureTyped(index);
      if (typeOf(typedIndex) !== FSDataType.Integer) {
        return typedNull();
      }
      const raw = list.get(valueOf(typedIndex));
      return ensureTyped(raw);
    }

    if (fnType === FSDataType.KeyValueCollection) {
      const collection = valueOf(fnValue);
      if (this.parameters.length === 0) {
        return typedNull();
      }
      const keyVal = ensureTyped(this.parameters[0].evaluate(provider));
      if (typeOf(keyVal) !== FSDataType.String) {
        return typedNull();
      }
      const result = collection.get(valueOf(keyVal));
      return ensureTyped(result);
    }

    throw new Error('Function call target is not a function, list, or key-value collection');
  }

  getChilds() {
    return [this.functionExpression, ...this.parameters];
  }

  asExpressionString(provider) {
    const fnStr = this.functionExpression.asExpressionString(provider);
    const paramStr = this.parameters.map((p) => p.asExpressionString(provider)).join(',');
    return `${fnStr}(${paramStr})`;
  }
}

module.exports = {
  FunctionCallExpression
};
