const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');

class AndFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'and';
    this.callType = CallType.Infix;
    this.precidence = 400;
  }

  get maxParameters() {
    return -1;
  }

  evaluate(provider, parameters) {
    const count = parameters.count;
    for (let i = 0; i < count; i += 1) {
      const param = parameters.getParameter(provider, i);
      if (helpers.typeOf(param) !== helpers.FSDataType.Boolean) {
        return helpers.makeError(
          helpers.FsError.ERROR_TYPE_MISMATCH,
          `${this.symbol} doesn't apply to this type: ${helpers.typeOf(param)}`
        );
      }
      if (!helpers.valueOf(param)) {
        return helpers.makeValue(helpers.FSDataType.Boolean, false);
      }
    }
    return helpers.makeValue(helpers.FSDataType.Boolean, true);
  }
}

module.exports = {
  AndFunction
};
