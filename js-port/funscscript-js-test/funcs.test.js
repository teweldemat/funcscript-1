const assert = require('assert');
const { Engine } = require('../funscscript-js/src/funscscript');
const { evaluate, DefaultFsDataProvider, FSDataType } = Engine;
const { ensureTyped, typeOf, valueOf } = require('../funscscript-js/src/core/value');

function toJs(typed) {
  if (!typed) return null;
  const t = typeOf(typed);
  const v = valueOf(typed);
  switch (t) {
    case FSDataType.Null:
      return null;
    case FSDataType.Boolean:
    case FSDataType.Integer:
    case FSDataType.Float:
    case FSDataType.BigInteger:
    case FSDataType.String:
      return v;
    case FSDataType.DateTime:
      return v.toISOString();
    case FSDataType.List: {
      const arr = [];
      for (const item of v) {
        arr.push(toJs(ensureTyped(item)));
      }
      return arr;
    }
    case FSDataType.KeyValueCollection: {
      const obj = {};
      for (const [key, val] of v.getAll()) {
        obj[key] = toJs(ensureTyped(val));
      }
      return obj;
    }
    default:
      return v;
  }
}

function expect(expression, expectedType, expectedValue, provider) {
  const result = evaluate(expression, provider);
  assert.strictEqual(result[0], expectedType, `Type mismatch for ${expression}`);
  const jsValue = toJs(result);
  assert.deepStrictEqual(jsValue, expectedValue, `Value mismatch for ${expression}`);
}

function run() {
  const provider = new DefaultFsDataProvider();

  expect('1>0', FSDataType.Boolean, true, provider);
  expect('1>=1', FSDataType.Boolean, true, provider);
  expect('1<2', FSDataType.Boolean, true, provider);
  expect('1<=2', FSDataType.Boolean, true, provider);
  expect('1!=2', FSDataType.Boolean, true, provider);
  expect('1 in [1,2,3]', FSDataType.Boolean, true, provider);
  expect('null ?? 5', FSDataType.Integer, 5, provider);
  expect('5 ?! "fallback"', FSDataType.String, 'fallback', provider);
  expect('!(1=0)', FSDataType.Boolean, true, provider);
  expect('negate(5)', FSDataType.Integer, -5, provider);
  expect('5%2', FSDataType.Integer, 1, provider);
  expect('sin(0)', FSDataType.Float, 0, provider);
  expect('cos(0)', FSDataType.Float, 1, provider);

  expect('Map([1,2], (x,i)=>x+i)', FSDataType.List, [1, 3], provider);
  expect('Reduce([1,2,3], (total,item)=>total+item, 0)', FSDataType.Integer, 6, provider);
  expect('Filter([1,2,3], (x)=>x>1)', FSDataType.List, [2, 3], provider);
  expect('Reverse([1,2,3])', FSDataType.List, [3, 2, 1], provider);
  expect('Distinct([1,1,2])', FSDataType.List, [1, 2], provider);
  expect('Any([1,2,3], (x)=>x=2)', FSDataType.Boolean, true, provider);
  expect('Contains([1,2,3],2)', FSDataType.Boolean, true, provider);
  expect('Sort([3,1,2], (a,b)=>a-b)', FSDataType.List, [1, 2, 3], provider);
  expect('Length([3,4,5])', FSDataType.Integer, 3, provider);
  expect('Series(5,3)', FSDataType.List, [5, 6, 7], provider);
  expect('Take([1,2,3],2)', FSDataType.List, [1, 2], provider);
  expect('Skip([1,2,3],2)', FSDataType.List, [3], provider);
  expect('First([1,2,3], (x)=>x>1)', FSDataType.Integer, 2, provider);

  expect('case false: "none"; true: "fallback"', FSDataType.String, 'fallback', provider);
  expect('switch 2, 1:"one", 2:"two", "other"', FSDataType.String, 'two', provider);

  expect('Contains("hello","ell")', FSDataType.Boolean, true, provider);
  expect('substring("hello",1,3)', FSDataType.String, 'ell', provider);
  expect('endswith("hello","lo")', FSDataType.Boolean, true, provider);
  expect('join(["a","b"], "-")', FSDataType.String, 'a-b', provider);
  expect('find("hello","l")', FSDataType.Integer, 2, provider);
  expect('isblank("  ")', FSDataType.Boolean, true, provider);
  expect('_templatemerge(["a",["b","c"]])', FSDataType.String, 'abc', provider);
  expect('format([1,2,3])', FSDataType.String, '[1, 2, 3]', provider);
  expect('parse("0xFF","hex")', FSDataType.Integer, 255, provider);
  expect('parse("123","l")', FSDataType.BigInteger, BigInt(123), provider);
  expect('parse("1+2","fs")', FSDataType.Integer, 3, provider);

  expect('date("2020-01-01T00:00:00Z")', FSDataType.DateTime, '2020-01-01T00:00:00.000Z', provider);
  expect('tickstoday(621355968000000000)', FSDataType.DateTime, '1970-01-01T00:00:00.000Z', provider);

  expect('hencode("<tag>")', FSDataType.String, '&lt;tag&gt;', provider);
  expect('guid("550e8400-e29b-41d4-a716-446655440000")', FSDataType.String, '550e8400-e29b-41d4-a716-446655440000', provider);

  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'funscscript-'));
  const filePath = path.join(tempDir, 'file.txt');
  fs.writeFileSync(filePath, 'content');
  const dirExpr = `dirlist("${tempDir.replace(/\\/g, '\\\\\\')}")`;
  const list = toJs(evaluate(dirExpr, provider));
  assert.ok(list.includes(path.join(tempDir, 'file.txt')));
  expect(`fileexists("${filePath.replace(/\\/g, '\\\\\\')}")`, FSDataType.Boolean, true, provider);
  expect(`isfile("${filePath.replace(/\\/g, '\\\\\\')}")`, FSDataType.Boolean, true, provider);
  expect(`file("${filePath.replace(/\\/g, '\\\\\\')}")`, FSDataType.String, 'content', provider);
  fs.unlinkSync(filePath);
  fs.rmSync(tempDir, { recursive: true, force: true });
}

module.exports = {
  run
};
