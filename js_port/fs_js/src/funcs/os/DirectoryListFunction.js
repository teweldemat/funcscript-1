const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');
const { ArrayFsList } = require('../../model/FsList');
const fs = require('fs');
const path = require('path');

class DirectoryListFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'dirlist';
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
    const pathResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 0), 'directory path');
    if (!pathResult.ok) {
      return pathResult.error;
    }
    const dir = pathResult.value;
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      return helpers.makeError(helpers.FsError.ERROR_TYPE_MISMATCH, `${this.symbol}: Directory '${dir}' does not exist`);
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const dirs = [];
    const files = [];
    for (const entry of entries) {
      if (entry.isDirectory()) {
        dirs.push(path.join(dir, entry.name));
      } else {
        files.push(path.join(dir, entry.name));
      }
    }
    dirs.sort();
    files.sort();
    const combined = [...dirs, ...files].map((item) => helpers.makeValue(FSDataType.String, item));
    return helpers.makeValue(FSDataType.List, new ArrayFsList(combined));
  }
}

module.exports = {
  DirectoryListFunction
};
