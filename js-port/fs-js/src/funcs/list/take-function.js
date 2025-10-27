const { BaseFunction, CallType } = require('../../core/function-base');
const { ArrayFsList } = require('../../model/fs-list');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

class TakeFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'Take';
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
    let count = countResult.value;
    if (count <= 0) {
      return helpers.makeValue(FSDataType.List, new ArrayFsList([]));
    }

    if (count > list.length) {
      count = list.length;
    }

    const values = [];
    for (let i = 0; i < count; i += 1) {
      values.push(list.get(i));
    }
    return helpers.makeValue(FSDataType.List, new ArrayFsList(values));
  }

  parName(index) {
    return index === 0 ? 'List' : index === 1 ? 'Number' : '';
  }
}

module.exports = {
  TakeFunction
};
