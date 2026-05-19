const express = require('express');
const authService = require('../services/authService');

const {
  enrollInCourse,
  markLectureCompleted,
  getMyProgress,
  listCourseStudents,
} = require('../services/enrollmentService');
const { verifyCourseOwnership } = require('../services/courseService');

const router = express.Router({ mergeParams: true });

router.post(
  '/enroll',
  authService.protect,
  authService.allowedTo('student'),
  enrollInCourse
);

router.post(
  '/progress',
  authService.protect,
  authService.allowedTo('student'),
  markLectureCompleted
);

router.get(
  '/progress',
  authService.protect,
  authService.allowedTo('student'),
  getMyProgress
);

router.get(
  '/students',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  (req, res, next) => {
    req.params.id = req.params.courseId;
    next();
  },
  verifyCourseOwnership,
  listCourseStudents
);

module.exports = router;
