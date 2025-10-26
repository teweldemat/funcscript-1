const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

class FindTextFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'find';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 3;
  }

  evaluate(provider, parameters) {
    if (parameters.count < 2 || parameters.count > this.maxParameters) {
      return helpers.makeError(helpers.FsError.ERROR_PARAMETER_COUNT_MISMATCH, `${this.symbol}: Two or three parameters expected`);
    }

    const textResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 0), 'text');
    if (!textResult.ok) {
      return textResult.error;
    }

    const searchResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 1), 'search');
    if (!searchResult.ok) {
      return searchResult.error;
    }

    let startIndex = 0;
    if (parameters.count === 3) {
      const indexResult = helpers.requireInteger(this.symbol, parameters.getParameter(provider, 2), 'startIndex');
      if (!indexResult.ok) {
        return indexResult.error;
      }
      startIndex = indexResult.value;
    }

    if (startIndex < 0 || startIndex > textResult.value.length) {
      return helpers.makeError(helpers.FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: index is out of range`);
    }

    return helpers.makeValue(FSDataType.Integer, textResult.value.indexOf(searchResult.value, startIndex));
  }

  parName(index) {
    return ['Text', 'Search', 'StartIndex'][index] || '';
  }
}

module.exports = {
  FindTextFunction
};
