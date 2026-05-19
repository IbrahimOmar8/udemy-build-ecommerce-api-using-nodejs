const express = require('express');
const authService = require('../services/authService');

const {
  listCourseQna,
  askQuestion,
  getQna,
  addAnswer,
  upvoteQna,
  deleteQna,
} = require('../services/qnaService');

const router = express.Router({ mergeParams: true });

// Nested under /courses/:courseId/qna
router
  .route('/')
  .get(authService.optionalAuth, listCourseQna)
  .post(authService.protect, askQuestion);

router
  .route('/:id')
  .get(authService.optionalAuth, getQna)
  .delete(authService.protect, deleteQna);

router.post('/:id/answers', authService.protect, addAnswer);
router.post('/:id/upvote', authService.protect, upvoteQna);

module.exports = router;
