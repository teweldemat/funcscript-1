const { PrefixBooleanFunction } = require('./PrefixBooleanFunction');

class NotFunction extends PrefixBooleanFunction {
  constructor() {
    super('!', (value) => !value);
  }
}

module.exports = {
  NotFunction
};
