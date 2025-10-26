const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');
const fs = require('fs');
const path = require('path');

class IsFileFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'isfile';
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
    const pathResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 0), 'file path');
    if (!pathResult.ok) {
      return pathResult.error;
    }
    const target = pathResult.value;
    return helpers.makeValue(
      FSDataType.Boolean,
      fs.existsSync(target) && fs.statSync(target).isFile()
    );
  }
}

module.exports = {
  IsFileFunction
};
