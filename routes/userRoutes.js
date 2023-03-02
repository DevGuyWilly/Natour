const express = require('express');
const {
  getAllUsers,
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
} = require('../controllers/userController');
const authController = require('../controllers/authController');

//FOR USERS
const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

router.patch(
  '/updatepassword',
  authController.protect,
  authController.updatePassword
);

router.patch('/updateMe', authController.protect, updateMe);
router.delete('/deleteMe', authController.protect, deleteMe);

//INITIALLY CREATED
router.route('/').get(authController.protect, getAllUsers).post(createUser);
router
  .route('/:id')
  .get(getUsers)
  .patch(updateUser)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    deleteUser
  );

module.exports = router;
