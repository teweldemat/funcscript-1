const FSDataType = {
  Null: 0,
  Boolean: 1,
  Integer: 2,
  BigInteger: 3,
  DateTime: 4,
  Guid: 5,
  Float: 6,
  String: 7,
  ByteArray: 8,
  List: 9,
  KeyValueCollection: 10,
  Function: 11,
  ValRef: 12,
  ValSink: 13,
  SigSource: 14,
  SigSink: 15,
  Error: 16
};

function getTypeName(type) {
  const entry = Object.entries(FSDataType).find(([, v]) => v === type);
  return entry ? entry[0] : 'Unknown';
}

module.exports = {
  FSDataType,
  getTypeName
};
