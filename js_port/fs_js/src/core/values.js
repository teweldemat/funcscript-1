const { FSDataType } = require('./constants');

function createValue(type, value) {
  return [type, value];
}

function literalNull() {
  return createValue(FSDataType.NULL, null);
}

function literalBoolean(value) {
  return createValue(FSDataType.BOOLEAN, Boolean(value));
}

function literalNumber(value) {
  if (Number.isInteger(value)) {
    return createValue(FSDataType.INTEGER, value);
  }
  return createValue(FSDataType.FLOAT, value);
}

function literalString(value) {
  return createValue(FSDataType.STRING, value);
}

function literalList(items) {
  return createValue(FSDataType.LIST, items);
}

function literalKeyValueCollection(map) {
  return createValue(FSDataType.KEY_VALUE_COLLECTION, map);
}

function literalFunction(func) {
  return createValue(FSDataType.FUNCTION, func);
}

function unwrap(value) {
  return Array.isArray(value) && value.length === 2 ? value[1] : value;
}

function isTypedValue(value) {
  return Array.isArray(value) && value.length === 2;
}

module.exports = {
  createValue,
  literalNull,
  literalBoolean,
  literalNumber,
  literalString,
  literalList,
  literalKeyValueCollection,
  literalFunction,
  unwrap,
  isTypedValue,
};
