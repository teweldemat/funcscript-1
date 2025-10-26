const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { requireString } = helpers;

class KvcNoneNullMemberFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = '?.';
    this.callType = CallType.Infix;
    this.precidence = 200;
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
    if (helpers.typeOf(target) === helpers.FSDataType.Null) {
      return helpers.typedNull();
    }

    const keyResult = requireString(this.symbol, parameters.getParameter(provider, 1), 'Member key');
    if (!keyResult.ok) {
      return keyResult.error;
    }

    const typedTarget = helpers.ensureTyped(target);
    if (helpers.typeOf(typedTarget) !== helpers.FSDataType.KeyValueCollection) {
      return helpers.makeError(
        helpers.FsError.ERROR_TYPE_MISMATCH,
        `${this.symbol} function: Cannot access member '${keyResult.value}' on type ${helpers.typeOf(typedTarget)}`
      );
    }

    const collection = helpers.valueOf(typedTarget);
    return collection.get(keyResult.value.toLowerCase());
  }
}

module.exports = {
  KvcNoneNullMemberFunction
};
