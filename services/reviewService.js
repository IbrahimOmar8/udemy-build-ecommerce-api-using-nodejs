const asyncHandler = require('express-async-handler');
const factory = require('./handlersFactory');
const ApiError = require('../utils/apiError');
const Review = require('../models/reviewModel');
const Enrollment = require('../models/enrollmentModel');

// Nested filter: GET /api/v1/courses/:courseId/reviews
exports.createFilterObj = (req, res, next) => {
  const filter = {};
  if (req.params.courseId) filter.course = req.params.courseId;
  req.filterObj = filter;
  next();
};

exports.setCourseIdAndUserIdToBody = (req, res, next) => {
  if (!req.body.course) req.body.course = req.params.courseId;
  if (!req.body.user) req.body.user = req.user._id;
  next();
};

// @desc    Verify the user is enrolled before reviewing
exports.verifyEnrollment = asyncHandler(async (req, res, next) => {
  const courseId = req.body.course || req.params.courseId;
  const enrolled = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
  });
  if (!enrolled) {
    return next(new ApiError('You can only review courses you are enrolled in', 403));
  }
  next();
});

exports.getReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
