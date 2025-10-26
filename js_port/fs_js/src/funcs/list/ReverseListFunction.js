const { BaseFunction, CallType } = require('../../core/functionBase');
const { ArrayFsList } = require('../../model/FsList');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

class ReverseListFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'Reverse';
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

    const result = [];
    for (let i = list.length - 1; i >= 0; i -= 1) {
      result.push(list.get(i));
    }
    return helpers.makeValue(FSDataType.List, new ArrayFsList(result));
  }

  parName(index) {
    return index === 0 ? 'List' : '';
  }
}

module.exports = {
  ReverseListFunction
};
