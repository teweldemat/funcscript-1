const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');

class GreaterThanOrEqualFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = '>=';
    this.callType = CallType.Infix;
    this.precidence = 200;
  }

  get maxParameters() {
    return 2;
  }

  evaluate(provider, parameters) {
    const error = helpers.expectParamCount(this.symbol, parameters, this.maxParameters);
    if (error) {
      return error;
    }
    const left = parameters.getParameter(provider, 0);
    const right = parameters.getParameter(provider, 1);
    const comparison = helpers.compare(left, right, this.symbol);
    if (Array.isArray(comparison)) {
      return comparison;
    }
    return helpers.makeValue(helpers.FSDataType.Boolean, comparison >= 0);
  }
}

module.exports = {
  GreaterThanOrEqualFunction
};
