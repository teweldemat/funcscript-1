const FSDataType = Object.freeze({
  NULL: 0,
  BOOLEAN: 1,
  INTEGER: 2,
  BIG_INTEGER: 3,
  DATE_TIME: 4,
  GUID: 5,
  FLOAT: 6,
  STRING: 7,
  BYTE_ARRAY: 8,
  LIST: 9,
  KEY_VALUE_COLLECTION: 10,
  FUNCTION: 11,
  VAL_REF: 12,
  VAL_SINK: 13,
  SIG_SOURCE: 14,
  SIG_SINK: 15,
  ERROR: 16,
});

const KEYWORDS = Object.freeze({
  RETURN: "return",
  CASE: "case",
  SWITCH: "switch",
  ERROR: "fault",
  TRUE: "true",
  FALSE: "false",
  NULL: "null",
});

module.exports = {
  FSDataType,
  KEYWORDS,
};
