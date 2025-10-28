const { ExpressionBlock } = require('./expression-block');
const { typedNull } = require('../core/value');

class NullExpressionBlock extends ExpressionBlock {
  evaluate() {
    return typedNull();
  }
}

module.exports = {
  NullExpressionBlock
};
