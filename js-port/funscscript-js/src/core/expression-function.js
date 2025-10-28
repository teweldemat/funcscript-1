const { BaseFunction, CallType } = require('./function-base');
const { KvcProvider, FsDataProvider } = require('./data-provider');
const { ensureTyped } = require('./value');

class ParameterProvider extends FsDataProvider {
  constructor(expressionFunction, parentProvider, parameterList) {
    super(parentProvider);
    this.expressionFunction = expressionFunction;
    this.parameterList = parameterList;
  }

  get(name) {
    const lower = name.toLowerCase();
    const index = this.expressionFunction.parameterIndex.get(lower);
    if (index !== undefined) {
      return ensureTyped(this.parameterList.getParameter(this.parent, index));
    }
    return super.get(name);
  }

  isDefined(name) {
    const lower = name.toLowerCase();
    if (this.expressionFunction.parameterIndex.has(lower)) {
      return true;
    }
    return super.isDefined(name);
  }
}

class ExpressionFunction extends BaseFunction {
  constructor(parameters, expressionBlock) {
    super();
    this.parameters = parameters || [];
    this.expression = expressionBlock;
    this.parameterIndex = new Map();
    this.context = null;

    this.parameters.forEach((name, idx) => {
      this.parameterIndex.set(name.toLowerCase(), idx);
    });
  }

  setContext(context) {
    this.context = context;
  }

  get maxParameters() {
    return this.parameters.length;
  }

  get callType() {
    return CallType.Infix;
  }

  evaluate(provider, parameterList) {
    if (!this.context) {
      throw new Error('Context not set on expression function');
    }
    const parentChain = new KvcProvider(this.context, provider);
    const parameterProvider = new ParameterProvider(this, parentChain, parameterList);
    const result = this.expression.evaluate(parameterProvider);
    return ensureTyped(result);
  }

  parName(index) {
    return this.parameters[index];
  }
}

module.exports = {
  ExpressionFunction
};
