const { check } = require('express-validator');
const validatorMiddleware = require('../../middlewares/validatorMiddleware');
const Review = require('../../models/reviewModel');

exports.createReviewValidator = [
  check('title').optional(),
  check('comment').optional(),
  check('ratings')
    .notEmpty()
    .withMessage('Ratings value required')
    .isFloat({ min: 1, max: 5 }),
  check('user').isMongoId(),
  check('course')
    .isMongoId()
    .custom((val, { req }) =>
      Review.findOne({ user: req.user._id, course: req.body.course }).then(
        (review) => {
          if (review) {
            return Promise.reject(new Error('You already reviewed this course'));
          }
        }
      )
    ),
  validatorMiddleware,
];

exports.getReviewValidator = [
  check('id').isMongoId(),
  validatorMiddleware,
];

exports.updateReviewValidator = [
  check('id')
    .isMongoId()
    .custom((val, { req }) =>
      Review.findById(val).then((review) => {
        if (!review) return Promise.reject(new Error('Review not found'));
        if (review.user._id.toString() !== req.user._id.toString()) {
          return Promise.reject(new Error('Not allowed to modify this review'));
        }
      })
    ),
  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check('id')
    .isMongoId()
    .custom((val, { req }) => {
      if (req.user.role === 'student') {
        return Review.findById(val).then((review) => {
          if (!review) return Promise.reject(new Error('Review not found'));
          if (review.user._id.toString() !== req.user._id.toString()) {
            return Promise.reject(new Error('Not allowed to delete this review'));
          }
        });
      }
      return true;
    }),
  validatorMiddleware,
];
