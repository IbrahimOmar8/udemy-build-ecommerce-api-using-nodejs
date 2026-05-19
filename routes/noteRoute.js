const express = require('express');
const authService = require('../services/authService');

const {
  listLectureNotes,
  createNote,
  updateNote,
  deleteNote,
} = require('../services/noteService');

const router = express.Router({ mergeParams: true });

router.use(authService.protect);

router.route('/').get(listLectureNotes).post(createNote);

module.exports = router;
