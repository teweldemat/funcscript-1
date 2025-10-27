const { PrefixBooleanFunction } = require('./prefix-boolean-function');

class NotFunction extends PrefixBooleanFunction {
  constructor() {
    super('!', (value) => !value);
  }
}

module.exports = {
  NotFunction
};
