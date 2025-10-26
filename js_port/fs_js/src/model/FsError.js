class FsError {
  static ERROR_DEFAULT = 'Default';
  static ERROR_PARAMETER_COUNT_MISMATCH = 'TOO_FEW_PARAMETER';
  static ERROR_TYPE_MISMATCH = 'TYPE_MISMATCH';
  static ERROR_TYPE_INVALID_PARAMETER = 'TYPE_INVALID_PARAMETER';

  constructor(type, message, data = null) {
    this.errorType = type || FsError.ERROR_DEFAULT;
    this.errorMessage = message || '';
    this.errorData = data;
  }

  toString() {
    return `${this.errorMessage} (${this.errorType})`;
  }
}

module.exports = {
  FsError
};
