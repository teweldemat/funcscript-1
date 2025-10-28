const { BaseFunction, CallType } = require('../../core/function-base');
const helpers = require('../helpers');
const { FSDataType } = require('../../core/fstypes');

function htmlEncode(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class HtmlEncodeFunction extends BaseFunction {
  constructor() {
    super();
    this.symbol = 'hencode';
    this.callType = CallType.Infix;
  }

  get maxParameters() {
    return 1;
  }

  evaluate(provider, parameters) {
    const error = helpers.expectParamCount(this.symbol, parameters, this.maxParameters);
    if (error) {
      return error;
    }
    const textResult = helpers.requireString(this.symbol, parameters.getParameter(provider, 0), 'text');
    if (!textResult.ok) {
      return textResult.error;
    }
    return helpers.makeValue(FSDataType.String, htmlEncode(textResult.value));
  }
}

module.exports = {
  HtmlEncodeFunction
};
