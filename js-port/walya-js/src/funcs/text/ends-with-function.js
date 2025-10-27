const { BaseFunction, CallType } = require('../../core/function-base');
const helpers = require('../helpers');
const { requireString, makeValue, makeError, FsError, FSDataType } = helpers;

class EndsWithFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'endswith';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 2;
  }

  evaluate(provider, parameters) {
    const error = helpers.expectParamCount(this.symbol, parameters, this.maxParameters);
    if (error) {
      return error;
    }
    const textResult = requireString(this.symbol, parameters.getParameter(provider, 0), 'text');
    if (!textResult.ok) {
      return textResult.error;
    }
    const endingResult = requireString(this.symbol, parameters.getParameter(provider, 1), 'ending substring');
    if (!endingResult.ok) {
      return endingResult.error;
    }
    return makeValue(FSDataType.Boolean, textResult.value.endsWith(endingResult.value));
  }
}

module.exports = {
  EndsWithFunction
};
