const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary, difficulty';
  next();
};

//CATCH ERRORS WHILE USING ASYNC-AWAIT

exports.getAllTours = catchAsync(async (req, res, next) => {
  //EXECUTE QUERY
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const tours = await features.query;
  //SEND RESPONSE
  res.status(200).json({
    status: 'success',
    result: `${tours.length}`,
    data: {
      tours,
    },
  });
  next();
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id);

  //HANDLING 404 ERROR
  if (!tour) {
    return next(new AppError('No tour found with that ID', 400));
  }

  res.status(200).json({
    message: 'Success',
    data: tour,
  });
});

exports.createTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.create(req.body);
  console.log(newTour);
  res.status(201).json({
    status: 'Success',
    data: { tour: newTour },
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  //HANDLING 404 ERROR
  if (!tour) {
    return next(new AppError('No tour found with that ID', 400));
  }

  res.json({
    status: 'Success',
    data: {
      tour,
    },
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id);

  //HANDLING 404 ERROR
  if (!tour) {
    return next(new AppError('No tour found with that ID', 400));
  }

  res.status(200).json({
    satus: 'Success',
    data: null,
  });
});

//USING PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAvegrage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        avgRatings: { $avg: '$ratingsAvegrage' },
        numRating: { $sum: 'ratingsQuantity' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    {
      $match: {
        _id: { $ne: 'EASY' },
      },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    data: { stats },
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStart: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'Success',
    data: { plan },
  });
});
