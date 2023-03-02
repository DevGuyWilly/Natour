//requiring modules
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const MongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const hpp = require('hpp');

const app = express();

//GLOBAL MIDDLEWARE
//SET SECURITY HTTP HEADERS
app.use(helmet());

//LIMIT REQUEST FROM SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request form this IP, please try again in an hour',
});
app.use('/api', limiter);
//BODY PARSER, READING DATA FROM BODY INTO REQ.BODY
app.use(express.json());
//DATA SANITIZATION AGAINST NOSQL QUERY INJECTION
app.use(MongoSanitize());
//DATA SANITIZATION AGAINST XSSS
app.use(xss());
//PREVENT PARAMTER POLLUTION (handling multiple appearance on query)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsQuantity',
      'maxGroupsize',
      'difficulty',
      'price',
    ],
  })
);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//routing
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);

//ERROR HANDLER
app.use(globalErrorHandler);

//WRONG ROUTING
app.all('*', (req, res, next) => {
  next(new AppError(`Cant find ${req.originalUrl} on this server!`, 400));
});

module.exports = app;
