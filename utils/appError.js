// eslint-disable-next-line no-unused-vars
class AppError extends Error {
  constructor(message, statusCode) {
    //this.message = message,
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'Failed' : 'ERROR';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
