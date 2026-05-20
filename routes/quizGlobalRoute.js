const express = require('express');
const authService = require('../services/authService');

const {
  getQuiz,
  updateQuiz,
  deleteQuiz,
  startAttempt,
  submitAttempt,
  myAttempts,
} = require('../services/quizService');

const router = express.Router();

router.get('/:id', authService.protect, getQuiz);
router.put('/:id', authService.protect, authService.allowedTo('instructor', 'admin'), updateQuiz);
router.delete(
  '/:id',
  authService.protect,
  authService.allowedTo('instructor', 'admin'),
  deleteQuiz
);

router.post('/:id/attempt', authService.protect, startAttempt);
router.post('/:id/submit', authService.protect, submitAttempt);
router.get('/:id/my-attempts', authService.protect, myAttempts);

module.exports = router;
