const express = require('express');

const {
  getAllTours,
  createTour,
  getTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  //  checkID,
  //checkBody,
} = require('../controllers/tourController');
const authController = require('../controllers/authController');

const router = express.Router();

//router.param('id', checkID);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);

router.route('/monthly-plan/:year').get(getMonthlyPlan);

router.route('/get-tour-stats').get(getTourStats);

//INITIALLY CREATED
router.route('/').get(authController.protect, getAllTours).post(createTour);
router
  .route('/:id')
  .get(getTour)
  .patch(updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteTour
  );

module.exports = router;
