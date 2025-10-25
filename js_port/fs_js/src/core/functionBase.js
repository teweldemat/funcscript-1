const CallType = {
  Infix: 'infix',
  Prefix: 'prefix',
  Dual: 'dual'
};

class ParameterList {
  get count() {
    throw new Error('ParameterList.count not implemented');
  }

  getParameter(provider, index) {
    throw new Error('ParameterList.getParameter not implemented');
  }
}

class BaseFunction {
  constructor() {
    this.callType = CallType.Infix;
    this.symbol = null;
    this.precidence = 0;
  }

  evaluate(provider, parameters) {
    throw new Error('BaseFunction.evaluate not implemented');
  }

  parName(index) {
    return `Par${index}`;
  }

  getCallInfo() {
    return {
      callType: this.callType,
      symbol: this.symbol,
      precidence: this.precidence,
      maxParameters: this.maxParameters
    };
  }

  get maxParameters() {
    return -1;
  }
}

module.exports = {
  CallType,
  BaseFunction,
  ParameterList
};
