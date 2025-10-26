const { BaseFunction, CallType } = require('../../core/functionBase');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

function convertToString(value) {
  const typed = helpers.ensureTyped(value);
  switch (helpers.typeOf(typed)) {
    case FSDataType.Null:
      return 'null';
    case FSDataType.Boolean:
    case FSDataType.Integer:
    case FSDataType.Float:
    case FSDataType.BigInteger:
      return String(helpers.valueOf(typed));
    case FSDataType.String:
      return helpers.valueOf(typed);
    case FSDataType.List: {
      const list = helpers.valueOf(typed);
      const parts = [];
      for (const item of list) {
        parts.push(convertToString(item));
      }
      return `[${parts.join(', ')}]`;
    }
    case FSDataType.KeyValueCollection: {
      const kv = helpers.valueOf(typed);
      const entries = kv.getAll().map(([key, val]) => `${key}: ${convertToString(val)}`);
      return `{ ${entries.join(', ')} }`;
    }
    case FSDataType.Function:
      return '<function>';
    default:
      return String(helpers.valueOf(typed));
  }
}

class FormatValueFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'format';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 2;
  }

  evaluate(provider, parameters) {
    if (parameters.count < 1) {
      return helpers.makeError(helpers.FsError.ERROR_PARAMETER_COUNT_MISMATCH, `${this.symbol} requires at least one parameter`);
    }
    const value = parameters.getParameter(provider, 0);
    const format = parameters.count > 1 ? parameters.getParameter(provider, 1) : null;

    if (typeof format === 'string') {
      switch (format.toLowerCase()) {
        case 'json':
          return helpers.makeValue(FSDataType.String, JSON.stringify(convertToJs(value)));
        default:
          break;
      }
    }

    return helpers.makeValue(FSDataType.String, convertToString(value));
  }
}

function convertToJs(value) {
  const typed = helpers.ensureTyped(value);
  switch (helpers.typeOf(typed)) {
    case FSDataType.Null:
      return null;
    case FSDataType.Boolean:
    case FSDataType.Integer:
    case FSDataType.Float:
    case FSDataType.BigInteger:
    case FSDataType.String:
      return helpers.valueOf(typed);
    case FSDataType.List: {
      const results = [];
      for (const item of helpers.valueOf(typed)) {
        results.push(convertToJs(item));
      }
      return results;
    }
    case FSDataType.KeyValueCollection: {
      const obj = {};
      for (const [key, val] of helpers.valueOf(typed).getAll()) {
        obj[key] = convertToJs(val);
      }
      return obj;
    }
    default:
      return helpers.valueOf(typed);
  }
}

module.exports = {
  FormatValueFunction
};
