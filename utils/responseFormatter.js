// utils/responseFormatter.js
exports.responseFormatter = (message, data = null, success = true) => ({
    message,
    data,
    success
  });