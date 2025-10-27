const { BaseFunction, CallType } = require('../../core/function-base');
const helpers = require('../helpers');

class ReplaceIfNullFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = '??';
    this.callType = CallType.Infix;
    this.precidence = 0;
  }

  get maxParameters() {
    return 2;
  }

  evaluate(provider, parameters) {
    const error = helpers.expectParamCount(this.symbol, parameters, this.maxParameters);
    if (error) {
      return error;
    }
    const first = parameters.getParameter(provider, 0);
    if (helpers.typeOf(first) !== helpers.FSDataType.Null) {
      return first;
    }
    return parameters.getParameter(provider, 1);
  }
}

module.exports = {
  ReplaceIfNullFunction
};
