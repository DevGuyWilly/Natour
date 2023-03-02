const AppError = require('../utils/appError');

//HANDLING CERTAIN TYPE OF ERROR
const handleCastErrorDB = (path, value) => {
  const message = `Invalid ${path}: ${value}`;
  return new AppError(message, 400);
};

const duplicateErrorDB = (keyValue) => {
  const message = `Duplicate keyValue: '${keyValue}', Please use another value`;
  return new AppError(message, 400);
};

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJsonWebTokenError = () => {
  const message = `Invalid web Token, Please Login again`;
  return new AppError(message, 401);
};
const expiredToken = () => {
  const message = `Your Token Has Expired`;
  return new AppError(message, 401);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrProd = (err, res) => {
  //operational trusted error,: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    //programming or other unknown error: don't wanna leak details to client
  } else {
    //log error
    console.error('ERROR 💥');
    //send a generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong',
    });
  }
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
    console.log(err.keyValue.name);
  } else if (process.env.NODE_ENV === 'production') {
    //HANDLING CAST-ERROR
    let error;
    if (err.name === 'CastError')
      error = handleCastErrorDB(err.path, err.value);
    //HANDLING MULTITPLE-DATA-FIELDS
    if (err.code === 11000) error = duplicateErrorDB(err.keyValue.name);
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError();
    if (err.name === 'TokenExpiredError') error = expiredToken();
    sendErrProd(error, res);
  }
};
