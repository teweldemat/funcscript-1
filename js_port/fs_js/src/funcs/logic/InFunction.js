const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');

class InFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'in';
    this.callType = CallType.Infix;
    this.precidence = 150;
  }

  get maxParameters() {
    return 2;
  }

  evaluate(provider, parameters) {
    const error = helpers.expectParamCount(this.symbol, parameters, this.maxParameters);
    if (error) {
      return error;
    }

    const target = parameters.getParameter(provider, 0);
    const list = helpers.ensureList(parameters.getParameter(provider, 1));
    if (!list) {
      return helpers.makeError(helpers.FsError.ERROR_TYPE_MISMATCH, `${this.symbol}: second parameter must be a list`);
    }

    const targetNumeric = helpers.isNumeric(target);

    for (let i = 0; i < list.length; i += 1) {
      let item = list.get(i);
      if (!item) {
        continue;
      }

      let left = target;
      let right = item;

      if (targetNumeric && helpers.isNumeric(item)) {
        [left, right] = helpers.convertToCommonNumericType(target, item);
      }

      if (helpers.typeOf(left) === helpers.FSDataType.Null && helpers.typeOf(right) === helpers.FSDataType.Null) {
        return helpers.makeValue(helpers.FSDataType.Boolean, true);
      }

      if (helpers.typeOf(left) === helpers.FSDataType.Null || helpers.typeOf(right) === helpers.FSDataType.Null) {
        continue;
      }

      if (helpers.typeOf(left) !== helpers.typeOf(right)) {
        continue;
      }

      if (helpers.valueOf(left) === helpers.valueOf(right)) {
        return helpers.makeValue(helpers.FSDataType.Boolean, true);
      }
    }

    return helpers.makeValue(helpers.FSDataType.Boolean, false);
  }
}

module.exports = {
  InFunction
};
