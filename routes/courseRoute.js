const express = require('express');

const {
  getCoursesValidator,
  createCourseValidator,
  updateCourseValidator,
  getCourseValidator,
} = require('../utils/validators/courseValidator');

const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadCourseMedia,
  processCourseMedia,
  setInstructor,
  generateSlug,
  publicFilter,
  verifyCourseOwnership,
  publishCourse,
  reviewDecision,
  similarCourses,
  trendingCourses,
} = require('../services/courseService');

const authService = require('../services/authService');
const { cacheResponse } = require('../middlewares/cacheMiddleware');

const sectionRoute = require('./sectionRoute');
const reviewRoute = require('./reviewRoute');
const enrollmentRoute = require('./enrollmentRoute');
const quizRoute = require('./quizRoute');
const assignmentRoute = require('./assignmentRoute');
const qnaRoute = require('./qnaRoute');
const announcementRoute = require('./announcementRoute');
const { courseBookmarkRouter } = require('./bookmarkRoute');

const router = express.Router();

// Nested routes
router.use('/:courseId/sections', sectionRoute);
router.use('/:courseId/reviews', reviewRoute);
router.use('/:courseId/quizzes', quizRoute);
router.use('/:courseId/assignments', assignmentRoute);
router.use('/:courseId/qna', qnaRoute);
router.use('/:courseId/announcements', announcementRoute);
router.use('/:courseId/bookmarks', courseBookmarkRouter);
router.use('/:courseId', enrollmentRoute);

// Discovery (declared BEFORE the dynamic :idOrSlug route)
router.get('/trending', trendingCourses);
router.get('/:id/similar', similarCourses);

router
  .route('/')
  .get(
    authService.optionalAuth,
    publicFilter,
    cacheResponse(60),
    getCoursesValidator,
    getCourses
  )
  .post(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    uploadCourseMedia,
    processCourseMedia,
    setInstructor,
    generateSlug,
    createCourseValidator,
    createCourse
  );

router
  .route('/:idOrSlug')
  .get(authService.optionalAuth, getCourse);

router
  .route('/:id')
  .put(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    verifyCourseOwnership,
    uploadCourseMedia,
    processCourseMedia,
    updateCourseValidator,
    updateCourse
  )
  .delete(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    verifyCourseOwnership,
    getCourseValidator,
    deleteCourse
  );

router.post(
  '/:id/publish',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  verifyCourseOwnership,
  publishCourse
);

router.post(
  '/:id/review-decision',
  authService.protect,
  authService.allowedTo('admin'),
  reviewDecision
);

module.exports = router;
