const { BaseFunction, CallType } = require('../../core/functionBase');
const { ArrayFsList } = require('../../model/FsList');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

class MapListFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'Map';
    this.callType = CallType.Dual;
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
        `${this.symbol} function: The first parameter should be ${this.ParName(0)}`
      );
    }

    const fn = helpers.ensureFunction(parameters.getParameter(provider, 1));
    if (!fn) {
      return helpers.makeError(
        helpers.FsError.ERROR_TYPE_MISMATCH,
        `${this.symbol} function: The second parameter should be ${this.ParName(1)}`
      );
    }

    const results = [];
    for (let i = 0; i < list.length; i += 1) {
      const args = new helpers.ArrayParameterList([
        list.get(i),
        helpers.makeValue(FSDataType.Integer, i)
      ]);
      const mapped = fn.evaluate(provider, args);
      results.push(helpers.ensureTyped(mapped));
    }

    return helpers.makeValue(FSDataType.List, new ArrayFsList(results));
  }

  parName(index) {
    switch (index) {
      case 0:
        return 'List';
      case 1:
        return 'Transform Function';
      default:
        return '';
    }
  }
}

module.exports = {
  MapListFunction
};
