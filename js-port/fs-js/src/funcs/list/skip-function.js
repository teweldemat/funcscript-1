const { BaseFunction, CallType } = require('../../core/function-base');
const { ArrayFsList } = require('../../model/fs-list');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

class SkipFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'Skip';
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

    const list = helpers.ensureList(parameters.getParameter(provider, 0));
    if (!list) {
      return helpers.makeError(
        helpers.FsError.ERROR_TYPE_MISMATCH,
        `${this.symbol} function: The first parameter should be ${this.parName(0)}`
      );
    }

    const countResult = helpers.requireInteger(this.symbol, parameters.getParameter(provider, 1), 'count');
    if (!countResult.ok) {
      return countResult.error;
    }

    const count = Math.max(0, countResult.value);
    const values = [];
    for (let i = count; i < list.length; i += 1) {
      values.push(list.get(i));
    }
    return helpers.makeValue(FSDataType.List, new ArrayFsList(values));
  }

  parName(index) {
    return index === 0 ? 'List' : index === 1 ? 'Number' : '';
  }
}

module.exports = {
  SkipFunction
};
