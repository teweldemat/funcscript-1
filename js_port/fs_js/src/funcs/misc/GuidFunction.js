const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

const GUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

class GuidFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'guid';
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
    const textResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 0), 'Guid string');
    if (!textResult.ok) {
      return textResult.error;
    }
    const guid = textResult.value;
    if (!GUID_REGEX.test(guid)) {
      return helpers.makeError(helpers.FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: invalid GUID`);
    }
    return helpers.makeValue(FSDataType.String, guid.toLowerCase());
  }
}

module.exports = {
  GuidFunction
};
