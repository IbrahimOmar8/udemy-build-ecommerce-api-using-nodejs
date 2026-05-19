const express = require('express');
const authService = require('../services/authService');

const {
  listCourseQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  startAttempt,
  submitAttempt,
  myAttempts,
} = require('../services/quizService');

const { verifyCourseOwnership } = require('../services/courseService');

const router = express.Router({ mergeParams: true });

// Nested under /courses/:courseId/quizzes
router
  .route('/')
  .get(authService.protect, listCourseQuizzes)
  .post(
    authService.protect,
    authService.allowedTo('instructor', 'admin'),
    (req, res, next) => {
      req.params.id = req.params.courseId;
      next();
    },
    verifyCourseOwnership,
    createQuiz
  );

router
  .route('/:id')
  .get(authService.protect, getQuiz)
  .put(authService.protect, authService.allowedTo('instructor', 'admin'), updateQuiz)
  .delete(authService.protect, authService.allowedTo('instructor', 'admin'), deleteQuiz);

router.post('/:id/attempt', authService.protect, startAttempt);
router.post('/:id/submit', authService.protect, submitAttempt);
router.get('/:id/my-attempts', authService.protect, myAttempts);

module.exports = router;
