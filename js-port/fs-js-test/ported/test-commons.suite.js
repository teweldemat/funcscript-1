const { finalizeSuite } = require('./common');

function run() {
  const suite = {};
  finalizeSuite('TestCommons', suite);
}

module.exports = {
  run
};
