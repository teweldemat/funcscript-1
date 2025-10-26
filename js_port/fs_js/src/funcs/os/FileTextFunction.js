const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');
const fs = require('fs');

const MAX_SIZE = 1_000_000;

class FileTextFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'file';
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
    const pathResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 0), 'file name');
    if (!pathResult.ok) {
      return pathResult.error;
    }
    const filename = pathResult.value;
    if (!fs.existsSync(filename)) {
      return helpers.makeError(helpers.FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: File '${filename}' does not exist`);
    }
    const stats = fs.statSync(filename);
    if (!stats.isFile()) {
      return helpers.makeError(helpers.FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: '${filename}' is not a file`);
    }
    if (stats.size > MAX_SIZE) {
      return helpers.makeError(helpers.FsError.ERROR_TYPE_INVALID_PARAMETER, `${this.symbol}: File '${filename}' is too big`);
    }
    const content = fs.readFileSync(filename, 'utf8');
    return helpers.makeValue(FSDataType.String, content);
  }
}

module.exports = {
  FileTextFunction
};
