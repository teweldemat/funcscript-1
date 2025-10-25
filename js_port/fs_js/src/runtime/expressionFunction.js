const { FSDataType } = require('../core/constants');

class LambdaParameterProvider {
  constructor(expressionFunction, invocationProvider, args) {
    this.expressionFunction = expressionFunction;
    this.invocationProvider = invocationProvider;
    this.args = args;
  }

  _normalize(key) {
    return String(key).toLowerCase();
  }

  _getFromParameters(key) {
    const index = this.expressionFunction.parameterIndex.get(key);
    if (index === undefined) {
      return null;
    }
    return this.args[index] ?? null;
  }

  _forward(target, key) {
    if (!target) {
      return null;
    }
    if (typeof target.get === 'function') {
      const value = target.get(key);
      if (value != null) {
        return value;
      }
    }
    if (typeof target.getData === 'function') {
      const value = target.getData(key);
      if (value != null) {
        return value;
      }
    }
    return null;
  }

  get(key) {
    const normalized = this._normalize(key);
    const paramValue = this._getFromParameters(normalized);
    if (paramValue != null) {
      return paramValue;
    }

    const invocationValue = this._forward(this.invocationProvider, key);
    if (invocationValue != null) {
      return invocationValue;
    }

    return this._forward(this.expressionFunction.context, key);
  }

  getData(key) {
    return this.get(key);
  }

  isDefined(key) {
    const normalized = this._normalize(key);
    if (this.expressionFunction.parameterIndex.has(normalized)) {
      return true;
    }
    if (this.invocationProvider && typeof this.invocationProvider.isDefined === 'function') {
      if (this.invocationProvider.isDefined(key)) {
        return true;
      }
    }
    if (this.expressionFunction.context && typeof this.expressionFunction.context.isDefined === 'function') {
      return this.expressionFunction.context.isDefined(key);
    }
    return false;
  }
}

class ExpressionFunction {
  constructor(parameters, expression) {
    this.parameters = parameters.map((param) => String(param));
    this.parameterIndex = new Map();
    this.parameters.forEach((param, index) => {
      this.parameterIndex.set(param.toLowerCase(), index);
    });
    this.expression = expression;
    this.context = null;
    this.symbol = null;
    this.arity = this.parameters.length;
  }

  setContext(context) {
    this.context = context;
  }

  invoke(invocationProvider, args = []) {
    if (!this.context) {
      throw new Error('Context not set to expression function');
    }
    if (args.length !== this.arity) {
      throw new Error(`Function expected ${this.arity} parameters got ${args.length}`);
    }
    const parameterProvider = new LambdaParameterProvider(this, invocationProvider, args);
    const connectionActions = [];
    const result = this.expression.evaluate(parameterProvider, connectionActions);
    connectionActions.forEach((action) => {
      if (typeof action === 'function') {
        action();
      }
    });
    return result.value;
  }
}

function isExpressionFunctionValue(value) {
  return Array.isArray(value) && value[0] === FSDataType.FUNCTION && value[1] instanceof ExpressionFunction;
}

module.exports = {
  ExpressionFunction,
  LambdaParameterProvider,
  isExpressionFunctionValue,
};
