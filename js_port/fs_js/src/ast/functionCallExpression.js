const { ExpressionBlock } = require('./expressionBlock');
const { FSDataType } = require('../core/constants');
const { literalNull } = require('../core/values');

class FunctionCallExpression extends ExpressionBlock {
  constructor(fnBlock, parameters = []) {
    super();
    this.function = fnBlock;
    this.parameters = parameters;
  }

  getChilds() {
    return [this.function, ...this.parameters];
  }

  evaluate(provider, connectionActions = []) {
    const funcResult = this.function.evaluate(provider, connectionActions);
    const funcValue = funcResult.value;
    if (!funcValue) {
      return this.makeResult(literalNull());
    }

    const [type, data] = funcValue;

    if (type === FSDataType.FUNCTION && data && typeof data.invoke === 'function') {
      const args = this.parameters.map((param) => param.evaluate(provider, connectionActions).value);
      const invocationResult = data.invoke(provider, args);
      return this.makeResult(invocationResult);
    }

    if (type === FSDataType.LIST) {
      const listValues = Array.isArray(data) ? data : [];
      const indexResult = this.parameters[0]?.evaluate(provider, connectionActions);
      const indexValue = indexResult?.value?.[1];
      const item = Number.isInteger(indexValue) ? listValues[indexValue] ?? literalNull() : literalNull();
      return this.makeResult(item);
    }

    if (type === FSDataType.KEY_VALUE_COLLECTION) {
      const keyResult = this.parameters[0]?.evaluate(provider, connectionActions);
      const keyValue = keyResult?.value?.[1];
      const collection = data || {};
      const value =
        keyValue != null && typeof keyValue === 'string'
          ? collection[keyValue.toLowerCase()] ?? literalNull()
          : literalNull();
      return this.makeResult(value);
    }

    return this.makeResult(literalNull());
  }

  asExpString(provider) {
    const fn = this.function.asExpString(provider);
    const args = this.parameters.map((p) => p.asExpString(provider)).join(', ');
    return `${fn}(${args})`;
  }
}

module.exports = {
  FunctionCallExpression,
};
