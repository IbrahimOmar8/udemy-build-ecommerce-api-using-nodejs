const express = require('express');
const authService = require('../services/authService');
const { updateNote, deleteNote } = require('../services/noteService');

const router = express.Router();

router.use(authService.protect);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
