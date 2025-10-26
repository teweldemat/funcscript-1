const { BaseFunction, CallType } = require('../../core/functionBase');
const { SimpleKeyValueCollection } = require('../../model/KeyValueCollection');
const helpers = require('../helpers');

class KvSelectFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'Select';
    this.callType = CallType.Prefix;
  }

  get maxParameters() {
    return 2;
  }

  evaluate(provider, parameters) {
    const error = helpers.expectParamCount(this.symbol, parameters, this.maxParameters);
    if (error) {
      return error;
    }

    const sourceTyped = helpers.ensureTyped(parameters.getParameter(provider, 0));
    if (helpers.typeOf(sourceTyped) !== helpers.FSDataType.KeyValueCollection) {
      return helpers.makeError(
        helpers.FsError.ERROR_TYPE_MISMATCH,
        `${this.symbol} function: The first parameter should be ${this.parName(0)}`
      );
    }

    const selectionTyped = helpers.ensureTyped(parameters.getParameter(provider, 1));
    if (helpers.typeOf(selectionTyped) !== helpers.FSDataType.KeyValueCollection) {
      return helpers.makeError(
        helpers.FsError.ERROR_TYPE_MISMATCH,
        `${this.symbol} function: The second parameter should be ${this.parName(1)}`
      );
    }

    const source = helpers.valueOf(sourceTyped);
    const mergedEntries = [];
    const index = new Map();

    for (const [key, value] of source.getAll()) {
      mergedEntries.push([key, value]);
      index.set(key.toLowerCase(), mergedEntries.length - 1);
    }

    for (const [key, value] of helpers.valueOf(selectionTyped).getAll()) {
      const lower = key.toLowerCase();
      let resolved = value;
      if (!value || helpers.typeOf(value) === helpers.FSDataType.Null) {
        resolved = source.get(lower);
      }
      if (index.has(lower)) {
        mergedEntries[index.get(lower)][1] = resolved;
      } else {
        mergedEntries.push([key, resolved]);
        index.set(lower, mergedEntries.length - 1);
      }
    }

    return helpers.makeValue(
      helpers.FSDataType.KeyValueCollection,
      new SimpleKeyValueCollection(provider, mergedEntries)
    );
  }

  parName(index) {
    return index === 0 ? 'Source KVC' : index === 1 ? 'Target KVC' : '';
  }
}

module.exports = {
  KvSelectFunction
};
