const { BaseFunction, CallType } = require('../../core/functionBase');
const { ArrayFsList } = require('../../model/FsList');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

class DistinctListFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'Distinct';
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

    const seen = [];
    const unique = [];
    for (let i = 0; i < list.length; i += 1) {
      const item = list.get(i);
      if (!seen.some((existing) => helpers.typeOf(existing) === helpers.typeOf(item) && helpers.valueOf(existing) === helpers.valueOf(item))) {
        seen.push(item);
        unique.push(item);
      }
    }

    return helpers.makeValue(FSDataType.List, new ArrayFsList(unique));
  }

  parName(index) {
    return index === 0 ? 'List' : '';
  }
}

module.exports = {
  DistinctListFunction
};
