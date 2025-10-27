const { BaseFunction, CallType } = require('../../core/function-base');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

class DateFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'date';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 2;
  }

  evaluate(provider, parameters) {
    if (parameters.count === 0 || parameters.count > this.maxParameters) {
      return helpers.makeError(helpers.FsError.ERROR_PARAMETER_COUNT_MISMATCH, `${this.symbol} expects one or two parameters`);
    }

    const textResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 0), 'date string');
    if (!textResult.ok) {
      return textResult.error;
    }

    const format = parameters.count === 2 ? parameters.getParameter(provider, 1) : null;
    let date;
    if (format && typeof format === 'string') {
      if (format.toLowerCase() === 'iso') {
        date = new Date(textResult.value);
      } else {
        date = new Date(textResult.value);
      }
    } else {
      date = new Date(textResult.value);
    }

    if (Number.isNaN(date.getTime())) {
      return helpers.makeError(helpers.FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: invalid date string`);
    }

    return helpers.makeValue(FSDataType.DateTime, date);
  }
}

module.exports = {
  DateFunction
};
