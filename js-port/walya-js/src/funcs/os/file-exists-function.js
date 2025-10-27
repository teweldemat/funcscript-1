const { BaseFunction, CallType } = require('../../core/function-base');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');
const fs = require('fs');

class FileExistsFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'fileexists';
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
    return helpers.makeValue(FSDataType.Boolean, fs.existsSync(pathResult.value));
  }
}

module.exports = {
  FileExistsFunction
};
