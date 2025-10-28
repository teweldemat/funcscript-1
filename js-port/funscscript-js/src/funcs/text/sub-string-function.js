const { BaseFunction, CallType } = require('../../core/function-base');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

class SubStringFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'substring';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 3;
  }

  evaluate(provider, parameters) {
    if (parameters.count === 0) {
      return helpers.makeError(helpers.FsError.ERROR_PARAMETER_COUNT_MISMATCH, `${this.symbol} requires at least one parameter`);
    }

    const textResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 0), 'string');
    if (!textResult.ok) {
      return textResult.error;
    }
    const text = textResult.value;

    let start = 0;
    if (parameters.count > 1) {
      const startResult = helpers.requireInteger(this.symbol, parameters.getParameter(provider, 1), 'index');
      if (!startResult.ok) {
        return startResult.error;
      }
      start = startResult.value;
    }

    let length = text.length - start;
    if (parameters.count > 2) {
      const lengthResult = helpers.requireInteger(this.symbol, parameters.getParameter(provider, 2), 'count');
      if (!lengthResult.ok) {
        return lengthResult.error;
      }
      length = lengthResult.value;
    }

    if (start < 0 || start >= text.length || length <= 0) {
      return helpers.makeValue(FSDataType.String, '');
    }

    const end = Math.min(text.length, start + length);
    return helpers.makeValue(FSDataType.String, text.substring(start, end));
  }
}

module.exports = {
  SubStringFunction
};
