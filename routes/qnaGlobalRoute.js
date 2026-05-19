const express = require('express');
const authService = require('../services/authService');
const {
  getQna,
  addAnswer,
  upvoteQna,
  deleteQna,
} = require('../services/qnaService');

const router = express.Router();

router.get('/:id', authService.optionalAuth, getQna);
router.post('/:id/answers', authService.protect, addAnswer);
router.post('/:id/upvote', authService.protect, upvoteQna);
router.delete('/:id', authService.protect, deleteQna);

module.exports = router;
