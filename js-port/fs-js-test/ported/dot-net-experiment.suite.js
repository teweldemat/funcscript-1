const { assert, finalizeSuite } = require('./common');

function run() {
  const suite = {};

  assert.strictEqual(null, null);

  finalizeSuite('DotNetExperiment', suite);
}

module.exports = {
  run
};
