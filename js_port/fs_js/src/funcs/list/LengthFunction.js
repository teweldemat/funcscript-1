const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');
const { ArrayFsList } = require('../../model/FsList');

class LengthFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'Length';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 1;
  }

  evaluate(provider, parameters) {
    const error = helpers.expectParamCount(this.symbol, parameters, this.maxParameters);
    if (error) {
      return error;
    }

    const list = helpers.ensureList(parameters.getParameter(provider, 0));
    if (!list) {
      return helpers.makeError(
        helpers.FsError.ERROR_TYPE_MISMATCH,
        `${this.symbol} function: The parameter should be ${this.parName(0)}`
      );
    }

    return helpers.makeValue(FSDataType.Integer, list.length);
  }

  parName(index) {
    return index === 0 ? 'List' : '';
  }
}

module.exports = {
  LengthFunction
};
