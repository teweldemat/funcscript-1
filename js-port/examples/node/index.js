#!/usr/bin/env node
const readline = require('readline');
const {
  evaluate,
  DefaultFsDataProvider,
  getTypeName,
  FSDataType,
  valueOf
} = require('../../fs-js/src/func-script');

const provider = new DefaultFsDataProvider();

function convertTypedValue(typed) {
  const [type, raw] = typed;
  switch (type) {
    case FSDataType.Null:
    case FSDataType.Boolean:
    case FSDataType.Integer:
    case FSDataType.Float:
      return raw;
    case FSDataType.BigInteger:
      return typeof raw === 'bigint' ? raw.toString() : raw;
    case FSDataType.String:
      return raw;
    case FSDataType.List: {
      return Array.from(raw).map(convertTypedValue);
    }
    case FSDataType.KeyValueCollection: {
      const result = {};
      for (const [key, value] of raw.getAll()) {
        result[key] = convertTypedValue(value);
      }
      return result;
    }
    case FSDataType.Function:
      return '<function>';
    case FSDataType.Error: {
      const err = valueOf(typed);
      return err && typeof err === 'object' ? err : String(raw);
    }
    default:
      return raw;
  }
}

function printResult(expr) {
  try {
    const typed = evaluate(expr, provider);
    const typeName = getTypeName(typed[0]);
    const plain = convertTypedValue(typed);
    console.log(`Type: ${typeName}`);
    console.log('Value:', typeof plain === 'string' ? plain : JSON.stringify(plain, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const cliExpression = process.argv.slice(2).join(' ').trim();

if (cliExpression) {
  printResult(cliExpression);
  process.exit(0);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'FuncScript> '
});

console.log('Enter FuncScript expressions (Ctrl+C to exit).');
rl.prompt();

rl.on('line', (line) => {
  const expr = line.trim();
  if (expr) {
    printResult(expr);
  }
  rl.prompt();
}).on('close', () => {
  process.stdout.write('\n');
  process.exit(0);
});
