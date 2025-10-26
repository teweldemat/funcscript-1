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
    const targetEntries = helpers.valueOf(selectionTyped).getAll().map(([key, value]) => {
      if (value === null || value === undefined) {
        return [key, source.get(key.toLowerCase())];
      }
      return [key, value];
    });

    return helpers.makeValue(
      helpers.FSDataType.KeyValueCollection,
      new SimpleKeyValueCollection(provider, targetEntries)
    );
  }

  parName(index) {
    return index === 0 ? 'Source KVC' : index === 1 ? 'Target KVC' : '';
  }
}

module.exports = {
  KvSelectFunction
};
