const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

const signInToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signInToken(user.id);
  const cookieOption = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'PRODUCTION') cookieOption.secure = true;
  res.cookie('jwt', token, cookieOption);
  //remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'Sucucess',
    token,
    data: {
      user: user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(email);
  //CHECK IF EMAIL AND PASWWORD EXIT
  if (!email && !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  //CHECK IF THE USER EXIT AND THE SAME IF THE PASSWORD IS CORRECT
  const user = await User.findOne({ email }).select('+password');
  console.log(user);
  if (!email && !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email or Password', 400));
  }
  //IF EVERYTHING IS OKAY, THEN SEND TOKEN
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  //1GETTING TOKEN AND CHECK IF ITS TRUE
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, LogIn to get Access', 401)
    );
  }
  //2VERIFICATION TOKEN
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  //console.log(decoded);
  //3CHECK IF USER STILL EXIT
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The User belonging to this token does not longer exit', 401)
    );
  }
  //4CHECK IF USER CHANGED PASSWORD
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('user recently chnaged password! Please Logiin again', 401)
    );
  }
  //GRANT ACCES TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //console.log(roles.includes(req.user.role));
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //GET USER BASED ON POSTED EMAIL
  //VERIFY IF USER EXIT
  const user = await User.findOne({ email: req.body.email });
  //console.log(user);
  if (!user) {
    return next(new AppError('There is no user with this email', 404));
  }
  //GENERATE THE RANDOM RESET TOKEN
  const resetToken = user.createPassswordResetToken();
  await user.save({ validateBeforeSave: false });
  ///SEND IT TO USERS MAIL
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetpassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new
  password and passwordCon firm to: ${resetURL}.\n If you didnt forget you password, please ignore this email!
  `;
  try {
    await sendEmail({
      email: req.body.email,
      subject: 'Reset your password, valid for 10min',
      message,
    });

    res.status(200).json({
      status: 'Success',
      message: 'Token sent to your email',
    });
  } catch (error) {
    console.log(error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending the email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //GET USER BASED ON TOKEN
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //IF TOKEN HASNT EXPIRED AND THERE IS A USER, SET NEW PASSWORD
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // UPDATE CHANGEDPASSWORDAT PROPERTY FOR THE USER
  //LOGIN THE USER, JWT
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //get user from collection
  const user = await User.findById(req.user.id).select('+password');
  //check if posted current password is correct
  console.log(
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  );
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('Your cuurent password is wrong', 401));
  //if so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //log user in, sedn jwt
  createSendToken(user, 200, res);
});
