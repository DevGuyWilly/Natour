const cryto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
//name, email, photo, password, password-confirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
    unique: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a Valid Email'],
  },
  photo: {
    type: String,
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please comfirm your password'],
    validate: {
      //WORRKS ON CREATE AND SAVE ONLY
      validator: function (el) {
        return el === this.password;
      },
      message: 'Must be a match',
    },
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    defalt: true,
    select: false,
  },
});

//PASSWORD-HASHING
userSchema.pre('save', async function (next) {
  //CHECK IF PASSWORD IS
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  //SETTING CONFIRM PASSWORD TO UNDEFINED
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  inputtedPassword,
  userPassword
) {
  return await bcrypt.compare(inputtedPassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTIMESTAMP) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimeStamp, JWTTIMESTAMP);
    console.log(changedTimeStamp < JWTTIMESTAMP);
    return JWTTIMESTAMP < changedTimeStamp;
  }
  //False means NOT changed
  return false;
};

userSchema.methods.createPassswordResetToken = function () {
  const restToken = cryto.randomBytes(32).toString('hex');

  this.passwordResetToken = cryto
    .createHash('sha256')
    .update(restToken)
    .digest('hex');

  console.log({ restToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return restToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
