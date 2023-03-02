/* eslint-disable prefer-arrow-callback */
const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

//Creating a Schema
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      maxLength: [40, 'A tour name must have less or equal 40 char'],
      minLength: [10, 'A tour name must have more or equal 40 char'],
      // validate: [validator.isAlpha, 'Name must contain only characters'],
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a Max Group Size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be between the value options',
      },
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    ratingsAvegrage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount class should be below current price',
      },
      //custom validator to return either true or false
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have an Image Cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    startDates: [Date],
    slug: String,
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//document middleware
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  //console.log(this);
  next();
});

// eslint-disable-next-line prefer-arrow-callback
// tourSchema.pre('save', function (next) {
//   console.log('Will Save Document');
//   next();
// });

// eslint-disable-next-line prefer-arrow-callback
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  //console.log('Hey');
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`queery took ${Date.now() - this.start} millisecond`);
  //console.log(docs);
  next();
});

//aggregation middleware
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this.pipeline());
  next();
});

//create a model from schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
