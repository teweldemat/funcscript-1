const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');
const { ArrayFsList } = require('../../model/FsList');

class ReduceListFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'Reduce';
    this.callType = CallType.Dual;
  }

  get maxParameters() {
    return 3;
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

    const fn = helpers.ensureFunction(parameters.getParameter(provider, 1));
    if (!fn) {
      return helpers.makeError(
        helpers.FsError.ERROR_TYPE_MISMATCH,
        `${this.symbol} function: The second parameter should be ${this.parName(1)}`
      );
    }

    let total = parameters.getParameter(provider, 2);
    for (let i = 0; i < list.length; i += 1) {
      const args = new helpers.ArrayParameterList([
        total,
        list.get(i),
        helpers.makeValue(FSDataType.Integer, i)
      ]);
      total = fn.evaluate(provider, args);
    }

    return helpers.ensureTyped(total);
  }

  parName(index) {
    return index === 0 ? 'List' : index === 1 ? 'Transform Function' : 'Seed';
  }
}

module.exports = {
  ReduceListFunction
};
