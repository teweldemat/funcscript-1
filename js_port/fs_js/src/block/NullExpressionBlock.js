const { ExpressionBlock } = require('./ExpressionBlock');
const { typedNull } = require('../core/value');

class NullExpressionBlock extends ExpressionBlock {
  evaluate() {
    return typedNull();
  }
}

module.exports = {
  NullExpressionBlock
};
