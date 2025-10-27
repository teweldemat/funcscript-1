const { BaseFunction, CallType } = require('../../core/function-base');
const helpers = require('../helpers');

class LogFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'log';
    this.callType = CallType.Infix;
  }

  get maxParameters() {
    return -1;
  }

  evaluate(provider, parameters) {
    if (parameters.count === 0) {
      return helpers.makeError(helpers.FsError.ERROR_PARAMETER_COUNT_MISMATCH, `${this.symbol}: expression expected`);
    }

    const expression = parameters.getParameter(provider, 0);
    const tag = parameters.count > 1 ? String(parameters.getParameter(provider, 1) ?? '') : '';
    const outputResult = parameters.count > 2 ? helpers.ensureTyped(parameters.getParameter(provider, 2)) : null;
    const output = outputResult ? helpers.valueOf(outputResult) : true;

    const messageTag = tag ? `(${tag})` : '';
    console.log(`FuncScript: Evaluating ${messageTag}`);
    try {
      const result = helpers.ensureTyped(expression);
      if (output) {
        console.log(`FuncScript: Result ${messageTag}:`);
        console.log(helpers.valueOf(result));
      } else {
        console.log(`FuncScript: Done ${messageTag}`);
      }
      return result;
    } catch (error) {
      console.error(`FuncScript: Error evaluating ${messageTag}`);
      console.error(error);
      throw error;
    }
  }
}

module.exports = {
  LogFunction
};
